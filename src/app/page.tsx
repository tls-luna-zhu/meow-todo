'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/todos');
    }
  }, [status, router]);

  // Show welcome page by default, don't automatically redirect to sign-in
  return (
    <div className="min-h-screen bg-pixel-pink flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-pixel max-w-md w-full text-center">
        <h1 className="text-3xl font-pixel text-pixel-purple mb-6">MeowTODO</h1>
        <p className="text-gray-600 mb-6">A cute pixel art themed todo list application with social features!</p>
        
        {status === 'loading' ? (
          <div className="animate-pulse flex justify-center space-x-1 mb-6">
            <div className="w-3 h-3 bg-pixel-purple rounded-full"></div>
            <div className="w-3 h-3 bg-pixel-purple rounded-full"></div>
            <div className="w-3 h-3 bg-pixel-purple rounded-full"></div>
          </div>
        ) : null}
        
        <div className="space-y-4">
          <Link href="/auth/signin" 
                className="block w-full py-2 px-4 bg-pixel-purple text-white rounded-md hover:bg-opacity-90 transition-all shadow-pixel hover:translate-y-[-2px]">
            Sign In
          </Link>
          
          <Link href="/auth/signup" 
                className="block w-full py-2 px-4 bg-pixel-green text-white rounded-md hover:bg-opacity-90 transition-all shadow-pixel hover:translate-y-[-2px]">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
