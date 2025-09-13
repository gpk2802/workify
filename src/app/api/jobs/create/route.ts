import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { title, company, description } = body;
    
    // Validate required fields
    if (!title || !company || !description) {
      return NextResponse.json(
        { message: 'Missing required fields' },
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
    
    // Insert the job into the database
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title,
        company,
        description,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error inserting job:', insertError);
      return NextResponse.json(
        { message: 'Failed to create job' },
        { status: 500 }
      );
    }
    
    // Return the job ID
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error in job creation:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}