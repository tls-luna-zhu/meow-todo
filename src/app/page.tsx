'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (status === 'authenticated') {
      router.push('/todos');
    }
  }, [status, router]);

  // Show welcome page by default, don't automatically redirect to sign-in
  return (
    <div className="min-h-screen bg-pixel-pink flex items-center justify-center p-4 font-pixel">
      <div className="bg-white p-8 rounded-lg shadow-pixel max-w-md w-full text-center">
        <h1 className="text-2xl font-pixel text-pixel-purple pixel-float">My LunaTODO List</h1>
        <p className="text-gray-600 mb-6 font-pixel">A cute pixel art themed todo list application with social features!</p>
        
        {status === 'loading' ? (
          <div className="animate-pulse flex justify-center space-x-1 mb-6">
            <div className="w-3 h-3 bg-pixel-purple rounded-full"></div>
            <div className="w-3 h-3 bg-pixel-purple rounded-full"></div>
            <div className="w-3 h-3 bg-pixel-purple rounded-full"></div>
          </div>
        ) : null}
        
        <div className="space-y-4">
          <Link href="/auth/signin" 
                className="block w-full py-2 px-4 bg-pixel-purple text-white rounded-md hover:bg-opacity-90 transition-all shadow-pixel hover:translate-y-[-2px] font-pixel">
            Sign In
          </Link>
          
          <Link href="/auth/signup" 
                className="block w-full py-2 px-4 bg-pixel-green text-white rounded-md hover:bg-opacity-90 transition-all shadow-pixel hover:translate-y-[-2px] font-pixel">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Example UI elements - only render on client side to avoid hydration issues */}
      {isMounted && (
        <div className="hidden">
          {/* Example todo item with animation */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 shadow-pixel hover:translate-y-[-2px] transition-transform font-pixel">
            {/* Todo content would go here */}
          </div>

          {/* Example button */}
          <button className="px-4 py-2 bg-pixel-purple text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm whitespace-nowrap hover:bg-opacity-90 transition-all">
            <FiPlus /> Add Task
          </button>

          {/* Example input fields */}
          <input
            type="text"
            placeholder="★ What quest awaits you? ★"
            className="w-full px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel placeholder:text-gray-400 placeholder:font-pixel"
            autoComplete="off"
            aria-hidden="true"
          />

          <input
            type="text"
            placeholder="★ Quest details... ★"
            className="flex-1 px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel min-w-[200px] font-pixel placeholder:text-gray-400 placeholder:font-pixel"
            autoComplete="off"
            aria-hidden="true"
          />

          {/* Example search input */}
          <input
            type="text"
            placeholder="★ Search for fellow adventurers... ★"
            className="w-full px-4 py-2 rounded-md border-2 border-gray-300 shadow-pixel font-pixel placeholder:text-gray-400 placeholder:font-pixel"
            autoComplete="off"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
