'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

type WorkType = 'remote' | 'hybrid' | 'on-site';

export default function IntentSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  
  const [roles, setRoles] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [workType, setWorkType] = useState<WorkType>('remote');
  
  const [roleInput, setRoleInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = (
    e: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (!array.includes(value.trim())) {
        setArray([...array, value.trim()]);
      }
      setInput('');
    }
  };

  const handleRemoveItem = (
    index: number,
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setArray(array.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (roles.length === 0) {
      setError('Please add at least one desired role');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check if intent exists
      const { data: existingIntent } = await supabase
        .from('intents')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      const intentData = {
        user_id: user.id,
        roles,
        dream_companies: companies,
        locations,
        work_type: workType,
      };
      
      if (existingIntent) {
        // Update existing intent
        const { error: updateError } = await supabase
          .from('intents')
          .update(intentData)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new intent
        const { error: insertError } = await supabase
          .from('intents')
          .insert(intentData);
        
        if (insertError) throw insertError;
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error saving intent:', err);
      setError(err.message || 'Failed to save intent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Set Your Job Search Preferences</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Desired Roles */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roles">
            Desired Roles <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="roles"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => handleAddItem(e, roleInput, roles, setRoles, setRoleInput)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Add a role and press Enter"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded flex items-center"
              >
                {role}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index, roles, setRoles)}
                  className="ml-1.5 text-primary-700 hover:text-primary-900 focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">E.g., Software Engineer, Product Manager, Data Scientist</p>
        </div>
        
        {/* Dream Companies */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companies">
            Dream Companies
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="companies"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              onKeyDown={(e) => handleAddItem(e, companyInput, companies, setCompanies, setCompanyInput)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Add a company and press Enter"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {companies.map((company, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded flex items-center"
              >
                {company}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index, companies, setCompanies)}
                  className="ml-1.5 text-primary-700 hover:text-primary-900 focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">E.g., Google, Microsoft, Amazon</p>
        </div>
        
        {/* Preferred Locations */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="locations">
            Preferred Locations
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="locations"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => handleAddItem(e, locationInput, locations, setLocations, setLocationInput)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Add a location and press Enter"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {locations.map((location, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-800 text-sm font-medium px-2.5 py-0.5 rounded flex items-center"
              >
                {location}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index, locations, setLocations)}
                  className="ml-1.5 text-primary-700 hover:text-primary-900 focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">E.g., San Francisco, New York, Remote</p>
        </div>
        
        {/* Work Type */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Work Type
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="remote"
                type="radio"
                name="workType"
                value="remote"
                checked={workType === 'remote'}
                onChange={() => setWorkType('remote')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label htmlFor="remote" className="ml-2 block text-sm text-gray-700">
                Remote
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="hybrid"
                type="radio"
                name="workType"
                value="hybrid"
                checked={workType === 'hybrid'}
                onChange={() => setWorkType('hybrid')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label htmlFor="hybrid" className="ml-2 block text-sm text-gray-700">
                Hybrid
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="on-site"
                type="radio"
                name="workType"
                value="on-site"
                checked={workType === 'on-site'}
                onChange={() => setWorkType('on-site')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label htmlFor="on-site" className="ml-2 block text-sm text-gray-700">
                On-site
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}