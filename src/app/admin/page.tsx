'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Users, Briefcase, FileText, TrendingUp, BarChart3, Target, CheckCircle, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface Application {
  id: string;
  user_id: string;
  job_id: string;
  tailor_id: string;
  status: string;
  outcome: string | null;
  created_at: string;
  users: User;
  jobs: {
    title: string;
    company: string;
  };
  tailors: {
    fit_score: number;
    status: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalApplications: number;
  pendingApplications: number;
  totalJobs: number;
  totalTailors: number;
}

interface FeedbackAnalytics {
  total_feedback: number;
  avg_probability: number;
  high_probability_percentage: number;
  top_strengths: Array<{ strength: string; count: number }>;
  common_gaps: Array<{ gap: string; count: number }>;
}

interface Feedback {
  id: string;
  user_id: string;
  job_id: string;
  tailor_id: string;
  selection_probability: number;
  semantic_similarity_score: number;
  skill_coverage_score: number;
  experience_alignment_score: number;
  strengths: any[];
  gaps: any[];
  recommendations: any[];
  created_at: string;
  users: User;
  jobs: {
    title: string;
    company: string;
  };
  tailors: {
    fit_score: number;
  };
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'applications' | 'feedback'>('overview');
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      checkAdminAccess();
    }
  }, [user, isLoading, router]);

  const checkAdminAccess = async () => {
    const supabase = createClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (error || !userData || userData.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadDashboardData();
  };

  const loadDashboardData = async () => {
    const supabase = createClient();
    
    try {
      // Load stats
      const [usersResult, applicationsResult, jobsResult, tailorsResult, feedbackResult] = await Promise.all([
        supabase.from('users').select('id, is_active'),
        supabase.from('applications').select('id, status'),
        supabase.from('jobs').select('id'),
        supabase.from('tailors').select('id'),
        supabase.from('feedback').select('id')
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const activeUsers = usersResult.data?.filter(u => u.is_active).length || 0;
      const totalApplications = applicationsResult.data?.length || 0;
      const pendingApplications = applicationsResult.data?.filter(a => a.status === 'submitted').length || 0;
      const totalJobs = jobsResult.data?.length || 0;
      const totalTailors = tailorsResult.data?.length || 0;
      const totalFeedback = feedbackResult.data?.length || 0;

      setStats({
        totalUsers,
        activeUsers,
        totalApplications,
        pendingApplications,
        totalJobs,
        totalTailors
      });

      // Load users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setUsers(usersData || []);

      // Load applications
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          users!applications_user_id_fkey(id, email, name),
          jobs!applications_job_id_fkey(title, company),
          tailors!applications_tailor_id_fkey(fit_score, status)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setApplications(applicationsData || []);
      setFilteredApplications(applicationsData || []);

      // Load feedback data
      await loadFeedbackData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackData = async () => {
    const supabase = createClient();
    
    try {
      // Load feedback data
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          *,
          users!feedback_user_id_fkey(id, email, name),
          jobs!feedback_job_id_fkey(title, company),
          tailors!feedback_tailor_id_fkey(fit_score)
        `)
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.error('Error loading feedback:', feedbackError);
      } else {
        setFeedback(feedbackData || []);
      }

      // Load feedback analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_system_feedback_analytics', { months: 3 });

      if (analyticsError) {
        console.error('Error loading feedback analytics:', analyticsError);
      } else {
        setFeedbackAnalytics(analyticsData?.[0] || null);
      }
    } catch (error) {
      console.error('Error loading feedback data:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ is_active: !isActive })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
      if (stats) {
        setStats({
          ...stats,
          activeUsers: isActive ? stats.activeUsers - 1 : stats.activeUsers + 1
        });
      }
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId);

    if (!error) {
      const updatedApplications = applications.map(a => 
        a.id === applicationId ? { ...a, status: newStatus } : a
      );
      setApplications(updatedApplications);
      applyFilters(updatedApplications);
    }
  };

  const updateApplicationOutcome = async (applicationId: string, newOutcome: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('applications')
      .update({ outcome: newOutcome })
      .eq('id', applicationId);

    if (!error) {
      const updatedApplications = applications.map(a => 
        a.id === applicationId ? { ...a, outcome: newOutcome } : a
      );
      setApplications(updatedApplications);
      applyFilters(updatedApplications);
    }
  };

  const applyFilters = (apps: Application[]) => {
    let filtered = apps;
    
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(app => app.outcome === outcomeFilter);
    }
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(app => app.user_id === userFilter);
    }
    
    setFilteredApplications(filtered);
  };

  const exportToCSV = () => {
    const csvData = applications.map(app => ({
      'Application ID': app.id,
      'User Email': app.users?.email || '',
      'User Name': app.users?.name || '',
      'Job Title': app.jobs?.title || '',
      'Company': app.jobs?.company || '',
      'Fit Score': app.tailors?.fit_score || '',
      'Status': app.status,
      'Outcome': app.outcome || 'Not Set',
      'Applied Date': new Date(app.created_at).toLocaleDateString()
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters(applications);
  }, [outcomeFilter, userFilter, applications]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users, applications, and system analytics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'users', name: 'Users' },
              { id: 'applications', name: 'Applications' },
              { id: 'feedback', name: 'Feedback Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalApplications}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Applications</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingApplications}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalJobs}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tailors</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalTailors}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage user accounts and permissions</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Application Management</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Track and manage job applications</p>
                </div>
                <button
                  onClick={exportToCSV}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Export CSV
                </button>
              </div>
              
              {/* Filters */}
              <div className="mt-4 flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Filter by Outcome</label>
                  <select
                    value={outcomeFilter}
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="Interview">Interview</option>
                    <option value="Rejected">Rejected</option>
                    <option value="No Response">No Response</option>
                    <option value="Hired">Hired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Filter by User</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                  >
                    <option value="all">All Users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <li key={application.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {application.jobs?.title} at {application.jobs?.company}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Score: {application.tailors?.fit_score}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <span>Applicant: {application.users?.name || application.users?.email}</span>
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>Applied: {new Date(application.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <select
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <select
                            value={application.outcome || ''}
                            onChange={(e) => updateApplicationOutcome(application.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md"
                          >
                            <option value="">Set Outcome</option>
                            <option value="Interview">Interview</option>
                            <option value="Rejected">Rejected</option>
                            <option value="No Response">No Response</option>
                            <option value="Hired">Hired</option>
                          </select>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => updateApplicationOutcome(application.id, 'Interview')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Interview
                          </button>
                          <button
                            onClick={() => updateApplicationOutcome(application.id, 'Rejected')}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateApplicationOutcome(application.id, 'Hired')}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Hire
                          </button>
                          <button
                            onClick={() => updateApplicationOutcome(application.id, 'No Response')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          >
                            No Response
                          </button>
                        </div>
                        {application.outcome && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            application.outcome === 'Interview' ? 'bg-blue-100 text-blue-800' :
                            application.outcome === 'Rejected' ? 'bg-red-100 text-red-800' :
                            application.outcome === 'Hired' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback Analytics Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            {feedbackAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Total Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{feedbackAnalytics.total_feedback}</div>
                    <p className="text-sm text-muted-foreground">Applications analyzed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Average Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{feedbackAnalytics.avg_probability}%</div>
                    <p className="text-sm text-muted-foreground">Selection probability</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      High Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{feedbackAnalytics.high_probability_percentage}%</div>
                    <p className="text-sm text-muted-foreground">Applications with 70%+ score</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Top Strengths */}
            {feedbackAnalytics?.top_strengths && feedbackAnalytics.top_strengths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Top Strengths
                  </CardTitle>
                  <CardDescription>
                    Most commonly identified strengths across applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedbackAnalytics.top_strengths.map((strength, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-800">{strength.strength}</span>
                        <Badge variant="success">{strength.count} times</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Common Gaps */}
            {feedbackAnalytics?.common_gaps && feedbackAnalytics.common_gaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Common Improvement Areas
                  </CardTitle>
                  <CardDescription>
                    Most frequently identified gaps across applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedbackAnalytics.common_gaps.map((gap, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="font-medium text-yellow-800">{gap.gap}</span>
                        <Badge variant="warning">{gap.count} times</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Feedback
                </CardTitle>
                <CardDescription>
                  Latest application feedback and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedback.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-sm font-medium text-foreground">No feedback data yet</h3>
                    <p className="text-sm text-muted-foreground">Feedback will appear here as users process job applications.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{item.jobs?.title} at {item.jobs?.company}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.users?.name || item.users?.email} • {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {item.selection_probability}%
                            </div>
                            <div className="text-xs text-muted-foreground">Selection Probability</div>
                          </div>
                          <div className="w-16">
                            <Progress value={item.selection_probability} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
