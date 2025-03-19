'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
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
        email: 'demo@example.com',
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
              email: 'demo@example.com',
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
          <h1 className="text-3xl font-pixel text-pixel-purple mb-2">MeowTODO</h1>
          <p className="text-gray-600">Welcome back! Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2"
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
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pixel-purple hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pixel-purple disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="text-pixel-purple hover:underline font-medium"
            >
              Use Demo Account
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-pixel-purple hover:text-opacity-90">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 