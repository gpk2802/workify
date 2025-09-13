'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Database } from '@/lib/database.types';

export default function ResumeEditPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchResumeText();
    }
  }, [user, isLoading, router]);

  const fetchResumeText = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('master_resume_text')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      // Use the Database type for proper typing
      type ProfileData = Database['public']['Tables']['profiles']['Row'];
      // Check if data exists and cast it to the correct type
      const profileData = data as ProfileData | null;
      if (profileData && profileData.master_resume_text) {
        setResumeText(profileData.master_resume_text);
      } else {
        // No resume found, redirect to upload page
        router.push('/resume/upload');
      }
    } catch (error: any) {
      console.error('Error fetching resume:', error);
      setError(error.message || 'Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Use the Database type for proper typing
      const updateData = { master_resume_text: resumeText } as Database['public']['Tables']['profiles']['Update'];
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving resume:', error);
      setError(error.message || 'Failed to save resume');
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Your Resume</h1>
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
            Resume saved successfully!
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="resume-text" className="block text-sm font-medium text-gray-700 mb-2">
              Resume Text
            </label>
            <textarea
              id="resume-text"
              rows={20}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}