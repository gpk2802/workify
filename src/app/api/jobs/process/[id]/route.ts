import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { calculateSimilarity, generateTailoredContent } from '@/lib/openai';
import { openaiRateLimit, addRateLimitHeaders } from '@/lib/rateLimit';
import { generateFeedback } from '@/lib/feedbackAnalytics';

// Async function to generate feedback without blocking the main response
async function generateFeedbackAsync(tailorId: string, resumeText: string, jobDescription: string) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('tailor_id', tailorId)
      .single();

    if (existingFeedback) {
      return; // Feedback already exists
    }

    // Get the tailor data
    const { data: tailor } = await supabase
      .from('tailors')
      .select('user_id, job_id, fit_score')
      .eq('id', tailorId)
      .single();

    if (!tailor) {
      return;
    }

    // Generate feedback
    const feedbackScores = await generateFeedback(
      resumeText,
      jobDescription,
      tailor.fit_score || 0
    );

    // Store feedback in database
    await supabase
      .from('feedback')
      .insert({
        user_id: tailor.user_id,
        job_id: tailor.job_id,
        tailor_id: tailorId,
        selection_probability: feedbackScores.selection_probability,
        semantic_similarity_score: feedbackScores.semantic_similarity_score,
        skill_coverage_score: feedbackScores.skill_coverage_score,
        experience_alignment_score: feedbackScores.experience_alignment_score,
        strengths: feedbackScores.strengths,
        gaps: feedbackScores.gaps,
        recommendations: feedbackScores.recommendations,
        model_version: 'v1.0'
      });
  } catch (error) {
    console.error('Error generating feedback asynchronously:', error);
    // Don't throw - this is async and shouldn't affect the main flow
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Apply rate limiting
    const rateLimitResult = await openaiRateLimit(request);
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const jobId = params.id;
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();
    
    if (jobError || !job) {
      return NextResponse.json(
        { message: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get the user's profile (resume)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resume_text')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile || !profile.resume_text) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // Get the user's intent
    const { data: intent, error: intentError } = await supabase
      .from('intents')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (intentError) {
      console.error('Error fetching intent:', intentError);
      // Continue without intent if not found
    }
    
    // Calculate similarity score
    const similarityScore = await calculateSimilarity(
      profile.resume_text,
      job.description
    );
    
    // Convert similarity to a 0-100 scale
    const fitScore = Math.round(similarityScore * 100);
    
    // Update job with fit score
    await supabase
      .from('jobs')
      .update({ fit_score: fitScore })
      .eq('id', jobId);
    
    // If score is less than 70, return early
    if (fitScore < 70) {
      return NextResponse.json({
        message: 'Not a good fit',
        fitScore,
        status: 'not_a_good_fit',
      });
    }
    
    // Generate tailored content
    const tailoredContent = await generateTailoredContent(
      profile.resume_text,
      job.description,
      intent || { roles: [], dream_companies: [], locations: [], work_type: 'remote' }
    );
    
    // Insert the tailored content into the database
    const { data: tailor, error: tailorError } = await supabase
      .from('tailors')
      .insert({
        job_id: jobId,
        user_id: user.id,
        tailored_resume: tailoredContent.tailoredResume,
        cover_letter: tailoredContent.coverLetter,
        portfolio: tailoredContent.portfolio,
        fit_score: fitScore,
        token_usage: tailoredContent.tokenUsage,
        status: 'pending_review',
      })
      .select('id')
      .single();
    
    if (tailorError) {
      console.error('Error inserting tailored content:', tailorError);
      return NextResponse.json(
        { message: 'Failed to save tailored content' },
        { status: 500 }
      );
    }
    
    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'processed' })
      .eq('id', jobId);
    
    // Generate feedback asynchronously (don't wait for it)
    generateFeedbackAsync(tailor.id, profile.resume_text, job.description);
    
    // Return the results
    const response = NextResponse.json({
      message: 'Job processed successfully',
      fitScore,
      tailorId: tailor.id,
      status: 'processed',
    });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Error processing job:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}