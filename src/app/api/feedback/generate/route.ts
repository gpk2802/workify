import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { generateFeedback } from '@/lib/feedbackAnalytics';
import { openaiRateLimit, addRateLimitHeaders } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
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

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tailorId } = body;

    if (!tailorId) {
      return NextResponse.json(
        { message: 'Tailor ID is required' },
        { status: 400 }
      );
    }

    // Get the tailor and related data
    const { data: tailor, error: tailorError } = await supabase
      .from('tailors')
      .select(`
        *,
        jobs!tailors_job_id_fkey(*),
        profiles!tailors_user_id_fkey(*)
      `)
      .eq('id', tailorId)
      .eq('user_id', user.id)
      .single();

    if (tailorError || !tailor) {
      return NextResponse.json(
        { message: 'Tailor not found' },
        { status: 404 }
      );
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('tailor_id', tailorId)
      .single();

    if (existingFeedback) {
      return NextResponse.json(
        { message: 'Feedback already exists for this tailor' },
        { status: 409 }
      );
    }

    // Generate feedback using the analytics system
    const feedbackScores = await generateFeedback(
      tailor.profiles?.master_resume_text || '',
      tailor.jobs?.job_description_text || '',
      tailor.fit_score || 0
    );

    // Store feedback in database
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
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
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error storing feedback:', feedbackError);
      return NextResponse.json(
        { message: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      message: 'Feedback generated successfully',
      feedback
    });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
