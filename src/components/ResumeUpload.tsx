'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { uploadFile, extractTextFromFile } from '@/lib/fileUtils';

export default function ResumeUpload() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (
        selectedFile.type !== 'application/pdf' &&
        selectedFile.type !== 'text/plain'
      ) {
        setError('Please upload a PDF or text file');
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !user) return;
    
    setIsUploading(true);
    setProgress(10);
    setError(null);
    
    try {
      // Upload file to Supabase Storage
      const filePath = await uploadFile(file, user.id);
      setProgress(40);
      
      // Extract text from file
      const extractedText = await extractTextFromFile(file);
      setProgress(70);
      
      // Generate a hash for the profile
      const profileHash = btoa(extractedText.substring(0, 100)).substring(0, 20);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            master_resume_text: extractedText,
            profile_hash: profileHash,
          })
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            master_resume_text: extractedText,
            profile_hash: profileHash,
          });
        
        if (insertError) throw insertError;
      }
      
      setProgress(100);
      
      // Redirect to intent setup if it's a new profile
      if (!existingProfile) {
        router.push('/dashboard/intent-setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      setError(err.message || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Upload Your Resume</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resume">
            Upload your master resume (PDF or TXT)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="resume"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="resume"
                    name="resume"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileChange}
                    required
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF or TXT up to 5MB</p>
              {file && (
                <p className="text-sm text-primary-600 font-medium">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={!file || isUploading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
        
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {progress < 100 ? `Processing: ${progress}%` : 'Complete!'}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}