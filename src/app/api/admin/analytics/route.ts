import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `created_at >= '${startDate}' AND created_at <= '${endDate}'`;
    }

    // Get analytics data
    const [
      usersResult,
      applicationsResult,
      jobsResult,
      tailorsResult,
      userGrowthResult,
      applicationStatusResult
    ] = await Promise.all([
      // Total users and active users
      supabase
        .from('users')
        .select('id, is_active, created_at')
        .order('created_at', { ascending: false }),
      
      // Applications data
      supabase
        .from('applications')
        .select('id, status, created_at')
        .order('created_at', { ascending: false }),
      
      // Jobs data
      supabase
        .from('jobs')
        .select('id, created_at')
        .order('created_at', { ascending: false }),
      
      // Tailors data
      supabase
        .from('tailors')
        .select('id, fit_score, created_at')
        .order('created_at', { ascending: false }),
      
      // User growth over time (last 30 days)
      supabase
        .from('users')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
      
      // Application status distribution
      supabase
        .from('applications')
        .select('status')
    ]);

    // Process data
    const totalUsers = usersResult.data?.length || 0;
    const activeUsers = usersResult.data?.filter(u => u.is_active).length || 0;
    const totalApplications = applicationsResult.data?.length || 0;
    const totalJobs = jobsResult.data?.length || 0;
    const totalTailors = tailorsResult.data?.length || 0;

    // Calculate average fit score
    const fitScores = tailorsResult.data?.map(t => t.fit_score).filter(score => score !== null) || [];
    const averageFitScore = fitScores.length > 0 
      ? fitScores.reduce((sum, score) => sum + score, 0) / fitScores.length 
      : 0;

    // User growth data (daily)
    const userGrowth = userGrowthResult.data?.reduce((acc, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Application status distribution
    const statusDistribution = applicationStatusResult.data?.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentUsers = usersResult.data?.filter(u => u.created_at >= sevenDaysAgo).length || 0;
    const recentApplications = applicationsResult.data?.filter(a => a.created_at >= sevenDaysAgo).length || 0;
    const recentJobs = jobsResult.data?.filter(j => j.created_at >= sevenDaysAgo).length || 0;

    // Top performing applications (by fit score)
    const topApplications = tailorsResult.data
      ?.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))
      .slice(0, 10) || [];

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalApplications,
        totalJobs,
        totalTailors,
        averageFitScore: Math.round(averageFitScore * 100) / 100,
        recentActivity: {
          users: recentUsers,
          applications: recentApplications,
          jobs: recentJobs
        }
      },
      userGrowth,
      statusDistribution,
      topApplications: topApplications.map(t => ({
        id: t.id,
        fitScore: t.fit_score,
        createdAt: t.created_at
      }))
    });
  } catch (error) {
    console.error('Error in admin analytics API:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
