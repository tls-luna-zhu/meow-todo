'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render form after client-side hydration to avoid mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/todos');
      }
    } catch (error) {
      setError('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        username: 'DemoUser',
        password: 'demopassword',
        redirect: false,
      });

      if (result?.error) {
        // Try to create a demo account if sign in fails
        try {
          const createResponse = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              email: 'demo@example.com', 
              password: 'demopassword',
              username: 'DemoUser' 
            }),
          });
          
          if (createResponse.ok) {
            // If account created successfully, try to sign in again
            const signInResult = await signIn('credentials', {
              username: 'DemoUser',
              password: 'demopassword',
              redirect: false,
            });
            
            if (!signInResult?.error) {
              router.push('/todos');
              return;
            }
          }
          
          setError('Could not create or sign in with demo account');
        } catch (createError) {
          setError('Error creating demo account');
        }
      } else {
        router.push('/todos');
      }
    } catch (error) {
      setError('An error occurred during demo sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pixel-pink flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-pixel max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-pixel text-pixel-purple mb-2">LunaTODO</h1>
          <p className="text-gray-600 font-pixel">Welcome back! Sign in to continue</p>
        </div>

        {mounted ? (
          <form onSubmit={handleSubmit} className="space-y-6 font-pixel" autoComplete="off">
            <div className="hidden">
              {/* These fields are here to trick browsers' autofill */}
              <input type="text" name="username-hidden" tabIndex={-1} />
              <input type="password" name="hidden-password" tabIndex={-1} />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2 font-pixel"
                placeholder="Enter your username"
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2 font-pixel"
                placeholder="Enter your password"
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm font-pixel">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-pixel text-white bg-pixel-purple hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pixel-purple disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={loading}
                className="text-pixel-purple hover:underline font-pixel"
              >
                Use Demo Account
              </button>
            </div>
          </form>
        ) : (
          // Show a minimal loading placeholder until the client hydration is complete
          <div className="space-y-6 font-pixel">
            <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 font-pixel">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-pixel-purple hover:text-opacity-90">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 