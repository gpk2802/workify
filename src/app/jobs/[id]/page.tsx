'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type JobData = {
  id: string;
  title: string;
  company: string;
  description: string;
  status: string;
  fit_score: number | null;
  created_at: string;
};

type TailorData = {
  id: string;
  tailored_resume: string;
  cover_letter: string;
  portfolio: string;
  fit_score: number;
  status: string;
  token_usage: number;
};

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<JobData | null>(null);
  const [tailor, setTailor] = useState<TailorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchJobData();
    }
  }, [user, isLoading, router, params.id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      
      // Fetch job data
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch tailor data if available
      const { data: tailorData, error: tailorError } = await supabase
        .from('tailors')
        .select('*')
        .eq('job_id', params.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (tailorError && tailorError.code !== 'PGRST116') {
        console.error('Error fetching tailor data:', tailorError);
      } else if (tailorData) {
        setTailor(tailorData);
      }
    } catch (error: any) {
      console.error('Error fetching job data:', error);
      setError(error.message || 'Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessJob = async () => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/jobs/process/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process job');
      }

      if (data.status === 'not_a_good_fit') {
        setSuccess(`Job processed. Fit score: ${data.fitScore}%. Not a good match for your resume.`);
      } else {
        setSuccess('Job processed successfully!');
        // Refresh the data
        fetchJobData();
      }
    } catch (error: any) {
      console.error('Error processing job:', error);
      setError(error.message || 'An error occurred while processing the job');
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!tailor) return;
    
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tailorId: tailor.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} application`);
      }

      setSuccess(action === 'approve' ? 'Application approved and submitted!' : 'Tailored content rejected.');
      // Refresh the data
      fetchJobData();
    } catch (error: any) {
      console.error(`Error ${action}ing application:`, error);
      setError(error.message || `An error occurred while ${action}ing the application`);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Job Not Found</h2>
            <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">
            {success}
          </div>
        )}
        
        {/* Job Details */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="text-gray-600">{job.company}</p>
              <p className="text-sm text-gray-500 mt-1">Submitted on {new Date(job.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              {job.fit_score !== null && (
                <div className={`text-center p-2 rounded-full w-16 h-16 flex items-center justify-center ${job.fit_score >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  <div>
                    <div className="font-bold">{job.fit_score}%</div>
                    <div className="text-xs">Fit</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Job Description</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap text-sm">
              {job.description}
            </div>
          </div>
          
          {job.status === 'pending' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleProcessJob}
                disabled={processing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Process Job'
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Tailored Content */}
        {tailor && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Tailored Resume</h2>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap text-sm mb-4">
                {tailor.tailored_resume}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const blob = new Blob([tailor.tailored_resume], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${job.company.replace(/\s+/g, '_')}_${job.title.replace(/\s+/g, '_')}_Resume.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Download
                </button>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap text-sm mb-4">
                {tailor.cover_letter}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const blob = new Blob([tailor.cover_letter], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${job.company.replace(/\s+/g, '_')}_${job.title.replace(/\s+/g, '_')}_Cover_Letter.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Download
                </button>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Value Portfolio</h2>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap text-sm mb-4">
                {tailor.portfolio}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const blob = new Blob([tailor.portfolio], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${job.company.replace(/\s+/g, '_')}_${job.title.replace(/\s+/g, '_')}_Portfolio.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Download
                </button>
              </div>
            </div>
            
            {tailor.status === 'pending_review' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Review</h2>
                <p className="text-gray-600 mb-4">
                  Please review the tailored content above. If you're satisfied, approve it to mark the application as submitted.
                  Otherwise, reject it to try again or make manual adjustments.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            )}
            
            {tailor.status === 'approved' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-700">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Application approved and submitted!</span>
                </div>
              </div>
            )}
            
            {tailor.status === 'rejected' && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>Tailored content rejected.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}