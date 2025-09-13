'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Target, Briefcase, TrendingUp, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import FeedbackSection from '@/components/FeedbackSection';

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Workify</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">Welcome, {userName}</span>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Resume Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Status
                </CardTitle>
              </CardHeader>
              <CardContent>
              
                {profile && profile.resume_text ? (
                  <div>
                    <div className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Resume uploaded successfully</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Your resume has been processed and is ready for tailoring.</p>
                    </div>
                    <Button asChild>
                      <Link href="/resume/edit">Edit Resume</Link>
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 rounded">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span>No resume uploaded</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Upload your resume to get started with tailoring for job applications.</p>
                    </div>
                    <Button asChild>
                      <Link href="/resume/upload">Upload Resume</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Intent Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Job Search Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
              
                {intent ? (
                  <div>
                    <div className="mb-4 p-3 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Preferences set</span>
                      </div>
                    </div>
                  
                    <div className="space-y-3 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Desired Roles:</h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {intent.roles.map((role, index) => (
                            <Badge key={index} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {intent.dream_companies.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Dream Companies:</h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {intent.dream_companies.map((company, index) => (
                              <Badge key={index} variant="outline">
                                {company}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {intent.locations.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Preferred Locations:</h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {intent.locations.map((location, index) => (
                              <Badge key={index} variant="outline">
                                {location}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Work Type:</h3>
                        <Badge variant="outline">
                          {intent.work_type.charAt(0).toUpperCase() + intent.work_type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button asChild variant="outline">
                      <Link href="/intent/edit">Edit Preferences</Link>
                    </Button>
                </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 rounded">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <span>No preferences set</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        <p>Set your job search preferences to help us tailor your resume more effectively.</p>
                      </div>
                      <Button asChild>
                        <Link href="/intent/setup">Set Preferences</Link>
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
            </div>
          </div>
          
          {/* Main Content Tabs */}
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Applications
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Application Feedback
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Job Applications
                      </CardTitle>
                      <CardDescription>
                        Manage your job applications and track their progress
                      </CardDescription>
                    </div>
                    <Button asChild>
                      <Link href="/jobs/create" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Job
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
            
                  {jobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">No jobs added yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new job description.</p>
                      <div className="mt-6">
                        <Button asChild>
                          <Link href="/jobs/create" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Job
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                          <table className="min-w-full divide-y divide-border">
                            <thead>
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-0">Job Title</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Company</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Fit Score</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Date</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                  <span className="sr-only">View</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {jobs.map((job) => {
                                const tailor = tailors[job.id];
                                return (
                                  <tr key={job.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-0">{job.title}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{job.company}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      {job.status === 'pending' && (
                                        <Badge variant="warning">Pending</Badge>
                                      )}
                                      {job.status === 'processed' && tailor && tailor.status === 'pending_review' && (
                                        <Badge variant="secondary">Ready for Review</Badge>
                                      )}
                                      {job.status === 'processed' && tailor && tailor.status === 'approved' && (
                                        <Badge variant="success">Approved</Badge>
                                      )}
                                      {job.status === 'processed' && tailor && tailor.status === 'rejected' && (
                                        <Badge variant="destructive">Rejected</Badge>
                                      )}
                                      {job.status === 'not_a_good_fit' && (
                                        <Badge variant="outline">Not a Good Fit</Badge>
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                      {job.fit_score !== null ? (
                                        <span className={job.fit_score >= 70 ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                                          {job.fit_score}%
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                      {new Date(job.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                      <Link href={`/jobs/${job.id}`} className="text-primary hover:text-primary/80">
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feedback" className="mt-6">
              <div className="space-y-6">
                {jobs.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">No applications to analyze</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Add a job application to see detailed feedback and insights.</p>
                    </CardContent>
                  </Card>
                ) : (
                  jobs
                    .filter(job => tailors[job.id] && tailors[job.id].status === 'pending_review')
                    .map(job => (
                      <FeedbackSection key={job.id} tailorId={tailors[job.id].id} />
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}