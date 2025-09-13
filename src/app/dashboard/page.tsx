'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type ProfileData = {
  id: string;
  resume_text: string | null;
  resume_url: string | null;
};

type IntentData = {
  id: string;
  roles: string[];
  dream_companies: string[];
  locations: string[];
  work_type: 'remote' | 'hybrid' | 'on-site';
};

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
  job_id: string;
  status: string;
  fit_score: number | null;
};


export default function DashboardPage() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [intent, setIntent] = useState<IntentData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [tailors, setTailors] = useState<Record<string, TailorData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    } 
    
    if (user) {
      setUserName(user.user_metadata.name || user.email?.split('@')[0] || 'User');
      
      // Fetch profile, intent, and jobs data
      const fetchData = async () => {
        try {
          // Fetch profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, resume_text, resume_url')
            .eq('user_id', user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          } else {
            setProfile(profileData || null);
          }
          
          // Fetch intent
          const { data: intentData, error: intentError } = await supabase
            .from('intents')
            .select('id, roles, dream_companies, locations, work_type')
            .eq('user_id', user.id)
            .single();
            
          if (intentError && intentError.code !== 'PGRST116') {
            console.error('Error fetching intent:', intentError);
          } else {
            setIntent(intentData || null);
          }

          // Fetch jobs
          const { data: jobsData, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (jobsError) {
            console.error('Error fetching jobs:', jobsError);
          } else {
            // Explicitly type jobsData as JobData[]
            const typedJobsData = (jobsData as JobData[]) || [];
            setJobs(typedJobsData);
            
            // Fetch tailors for jobs
            if (typedJobsData.length > 0) {
              const jobIds = typedJobsData.map(job => job.id);
              const { data: tailorsData, error: tailorsError } = await supabase
                .from('tailors')
                .select('id, job_id, status, fit_score')
                .in('job_id', jobIds);
                
              if (tailorsError) {
                console.error('Error fetching tailors:', tailorsError);
              } else if (tailorsData) {
                const tailorsMap: Record<string, TailorData> = {};
                (tailorsData as TailorData[]).forEach(tailor => {
                  tailorsMap[tailor.job_id] = tailor;
                });
                setTailors(tailorsMap);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [user, isLoading, router]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {userName}</span>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Resume Status Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Resume Status
              </h2>
              
              {profile && profile.resume_text ? (
                <div>
                  <div className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Resume uploaded successfully</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Your resume has been processed and is ready for tailoring.</p>
                  </div>
                  <Link href="/resume/edit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Edit Resume
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 rounded">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>No resume uploaded</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Upload your resume to get started with tailoring for job applications.</p>
                  </div>
                  <Link href="/resume/upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>
            
            {/* Intent Summary Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Job Search Preferences
              </h2>
              
              {intent ? (
                <div>
                  <div className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Preferences set</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Desired Roles:</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {intent.roles.map((role, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {intent.dream_companies.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Dream Companies:</h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {intent.dream_companies.map((company, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {intent.locations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Preferred Locations:</h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {intent.locations.map((location, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {location}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Work Type:</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {intent.work_type.charAt(0).toUpperCase() + intent.work_type.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <Link href="/intent/edit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Edit Preferences
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 rounded">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>No preferences set</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <p>Set your job search preferences to help us tailor your resume more effectively.</p>
                  </div>
                  <Link href="/intent/setup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Set Preferences
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Jobs Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                Job Applications
              </h2>
              <Link 
                href="/jobs/create" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Job
              </Link>
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs added yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new job description.</p>
                <div className="mt-6">
                  <Link
                    href="/jobs/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add New Job
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Job Title</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fit Score</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                            <span className="sr-only">View</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {jobs.map((job) => {
                          const tailor = tailors[job.id];
                          return (
                            <tr key={job.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{job.title}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{job.company}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                {job.status === 'pending' && (
                                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                    Pending
                                  </span>
                                )}
                                {job.status === 'processed' && tailor && tailor.status === 'pending_review' && (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-600/20">
                                    Ready for Review
                                  </span>
                                )}
                                {job.status === 'processed' && tailor && tailor.status === 'approved' && (
                                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
                                    Approved
                                  </span>
                                )}
                                {job.status === 'processed' && tailor && tailor.status === 'rejected' && (
                                  <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-600/20">
                                    Rejected
                                  </span>
                                )}
                                {job.status === 'not_a_good_fit' && (
                                  <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-inset ring-gray-600/20">
                                    Not a Good Fit
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {job.fit_score !== null ? (
                                  <span className={job.fit_score >= 70 ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                                    {job.fit_score}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(job.created_at).toLocaleDateString()}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                <Link href={`/jobs/${job.id}`} className="text-primary-600 hover:text-primary-900">
                                  View<span className="sr-only">, {job.title}</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}