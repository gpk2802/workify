import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { adminRateLimit, addRateLimitHeaders } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await adminRateLimit(request);
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const userId = searchParams.get('userId');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');

    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        *,
        users!feedback_user_id_fkey(id, email, name),
        jobs!feedback_job_id_fkey(title, company),
        tailors!feedback_tailor_id_fkey(fit_score)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (minScore) {
      query = query.gte('selection_probability', parseInt(minScore));
    }
    if (maxScore) {
      query = query.lte('selection_probability', parseInt(maxScore));
    }

    // Apply pagination
    const { data: feedback, error: feedbackError, count } = await query
      .range(offset, offset + limit - 1);

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      return NextResponse.json(
        { message: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Get system analytics
    const { data: analytics, error: analyticsError } = await supabase
      .rpc('get_system_feedback_analytics', { months: 3 });

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError);
    }

    const response = NextResponse.json({
      feedback,
      analytics: analytics?.[0] || null,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Error in admin feedback API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
