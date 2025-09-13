import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { apiRateLimit, addRateLimitHeaders } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: { tailorId: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
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

    const tailorId = params.tailorId;

    // Get feedback for the specific tailor
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        jobs!feedback_job_id_fkey(title, company),
        tailors!feedback_tailor_id_fkey(fit_score)
      `)
      .eq('tailor_id', tailorId)
      .eq('user_id', user.id)
      .single();

    if (feedbackError || !feedback) {
      return NextResponse.json(
        { message: 'Feedback not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      feedback
    });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
