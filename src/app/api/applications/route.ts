import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { tailorId, action } = body;
    
    // Validate required fields
    if (!tailorId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid request' },
        { status: 400 }
      );
    }
    
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
    
    // Get the tailor details
    const { data: tailor, error: tailorError } = await supabase
      .from('tailors')
      .select('*, jobs(*)')
      .eq('id', tailorId)
      .eq('user_id', user.id)
      .single();
    
    if (tailorError || !tailor) {
      return NextResponse.json(
        { message: 'Tailor not found' },
        { status: 404 }
      );
    }
    
    if (action === 'approve') {
      // Update tailor status
      await supabase
        .from('tailors')
        .update({ status: 'approved' })
        .eq('id', tailorId);
      
      // Create application record
      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          job_id: tailor.job_id,
          tailor_id: tailorId,
          status: 'Submitted (manual)',
          company: tailor.jobs?.company,
          position: tailor.jobs?.title,
        })
        .select('id')
        .single();
      
      if (applicationError) {
        console.error('Error creating application:', applicationError);
        return NextResponse.json(
          { message: 'Failed to create application' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Application approved and submitted',
        applicationId: application.id,
      });
    } else {
      // Update tailor status to rejected
      await supabase
        .from('tailors')
        .update({ status: 'rejected' })
        .eq('id', tailorId);
      
      return NextResponse.json({
        message: 'Tailor rejected',
      });
    }
  } catch (error) {
    console.error('Error handling application:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}