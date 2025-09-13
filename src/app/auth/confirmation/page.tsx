'use client';

import Link from 'next/link';

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Check your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent you a confirmation email. Please click the link in the email to verify your account.
          </p>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Didn't receive an email?{' '}
            <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Try signing up again
            </Link>
            {' '}or check your spam folder.
          </p>
        </div>
        <div className="mt-6">
          <Link 
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}