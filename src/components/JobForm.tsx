'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function JobForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a job');
      return;
    }
    
    if (!jobTitle.trim()) {
      setError('Job title is required');
      return;
    }
    
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    
    if (!jobDescription.trim()) {
      setError('Job description is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit job to API
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: jobTitle,
          company: companyName,
          description: jobDescription,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit job');
      }
      
      const data = await response.json();
      
      // Redirect to the job details page
      router.push(`/jobs/${data.id}`);
    } catch (err: any) {
      console.error('Error submitting job:', err);
      setError(err.message || 'An error occurred while submitting the job');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
        Submit Job for Tailoring
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="job-title" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="job-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g., Software Engineer, Product Manager"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g., Google, Microsoft, Amazon"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="job-description"
            rows={10}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Paste the full job description here..."
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            For best results, include the full job description with requirements and responsibilities.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Submit for Tailoring'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}