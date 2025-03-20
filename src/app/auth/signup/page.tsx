'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
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
    const username = formData.get('username') as string;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/auth/signin');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pixel-pink flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-pixel max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-pixel text-pixel-purple mb-2">MeowTODO</h1>
          <p className="text-gray-600 font-pixel">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 font-pixel">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2 font-pixel"
              placeholder="Choose a username"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2 font-pixel"
              placeholder="Enter your email"
              autoComplete="new-email"
              autoCorrect="off"
              spellCheck="false"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pixel-purple focus:ring-pixel-purple p-2 font-pixel"
              placeholder="Create a password"
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck="false"
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
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 font-pixel">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-pixel-purple hover:text-opacity-90">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 