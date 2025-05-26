'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiCheck, FiUserPlus, FiLogOut, FiUsers, FiX, FiClock, FiEdit2, FiEye, FiEyeOff, FiCheckSquare } from 'react-icons/fi';
import Image from 'next/image';

// Cache constants
const TODOS_CACHE_KEY_PREFIX = 'todos_cache_';
const FRIENDS_CACHE_KEY_PREFIX = 'friends_cache_';
const ALL_USERS_CACHE_KEY_PREFIX = 'all_users_cache_'; // New cache key for all users
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Cache helper functions

/**
 * Generates a cache key with a given prefix and user ID.
 * @param prefix The prefix for the cache key (e.g., 'todos_cache_').
 * @param userId The user's ID.
 * @returns The generated cache key or null if userId is not provided.
 */
const getCacheKey = (prefix: string, userId: string | undefined) => {
  if (!userId) return null;
  return `${prefix}${userId}`;
};

interface CacheEntry<T> {
  timestamp: number; // Timestamp of when the data was cached
  data: T; // The cached data itself
}

/**
 * Retrieves cached data from localStorage if it exists and is not stale.
 * @param key The cache key.
 * @returns The cached data or null if not found, stale, or an error occurs.
 */
const getCachedData = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null; // Prevent localStorage access on server
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(item);
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch (error) {
    console.error('Error parsing cached data:', error);
    localStorage.removeItem(key); // Corrupted cache
    return null;
  }
};

const setCachedData = <T>(key: string, data: T) => {
  if (typeof window === 'undefined') return;
  const entry: CacheEntry<T> = {
  timestamp: Date.now(), // Set current timestamp
  data, // The data to cache
  };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error setting cached data:', error); // Log error if caching fails
    // Potentially handle quota exceeded error here, e.g., by clearing older cache items
  }
};

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  user: {
    username: string;
    _id?: string;
  };
}

interface User {
  _id: string;
  username: string;
  email?: string;
}

export default function Todos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [sortByDueDate, setSortByDueDate] = useState(true);
  const [hideCompletedUser, setHideCompletedUser] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', dueDate: '' });
  const [secondColumnView, setSecondColumnView] = useState<'friends' | 'completed'>('friends');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false); // For edit modal save button

  // Effect to handle initial data loading and authentication status changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin'); // Redirect to signin if not authenticated
    } else if (status === 'authenticated' && session?.user?.id) {
      setLoading(true); // Start loading indicator
      const userId = session.user.id;

      // Attempt to load Todos from cache
      const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, userId);
      if (todosCacheKey) {
        const cachedTodos = getCachedData<Todo[]>(todosCacheKey);
        if (cachedTodos) {
          setTodos(cachedTodos); // Use cached todos
          // Potentially set loading to false if friends are also cached or not needed immediately
        } else {
          fetchTodos(); // Fetch if not in cache or stale
        }
      } else {
        fetchTodos(); // Fetch if cache key generation failed (should not happen with userId)
      }

      // Attempt to load Friends from cache
      const friendsCacheKey = getCacheKey(FRIENDS_CACHE_KEY_PREFIX, userId);
      if (friendsCacheKey) {
        const cachedFriends = getCachedData<User[]>(friendsCacheKey);
        if (cachedFriends) {
          setFriends(cachedFriends); // Use cached friends
        } else {
          fetchFriends(); // Fetch if not in cache or stale
        }
      } else {
        fetchFriends(); // Fetch if cache key generation failed
      }
      
      // Determine final loading state
      const areTodosCached = todosCacheKey ? !!getCachedData<Todo[]>(todosCacheKey) : false;
      const areFriendsCached = friendsCacheKey ? !!getCachedData<User[]>(friendsCacheKey) : false;
      
      if ((areTodosCached || !todosCacheKey) && (areFriendsCached || !friendsCacheKey)) {
         // If both are cached (or cache key couldn't be generated, implying an issue handled by fetch)
         // and fetchTodos itself will set loading to false eventually.
         // This ensures loading is false if all initial data can be potentially loaded from cache.
         // If fetchTodos/fetchFriends are called, they will set loading to false in their finally block.
         if(areTodosCached && areFriendsCached) setLoading(false);
      }
    }
  }, [status, router, session?.user?.id]); // Dependencies for the effect
  
  // Removed automated hideCompleted setting when viewing Finished Tasks
  
  // Fetches all todos (user's and friends') from the API and updates cache
  const fetchTodos = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, userId);

    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      if (response.ok) {
        setTodos(data);
        if (todosCacheKey) {
          setCachedData(todosCacheKey, data);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setError('Failed to fetch todos');
    } finally {
      setLoading(false); // Ensure loading is set to false after fetching
    }
  };
  
  const handleSortByDueDate = () => {
    setSortByDueDate(!sortByDueDate);
  };

  /**
   * Generic function to sort an array of todos.
   * @param items Array of Todo objects to sort.
   * @param sortByDueDateFlag Boolean indicating whether to sort by due date or creation date.
   * @returns A new array of sorted Todo objects.
   */
  const sortTodos = (items: Todo[], sortByDueDateFlag: boolean): Todo[] => {
    return [...items].sort((a, b) => {
      if (sortByDueDateFlag) {
        if (!a.dueDate && !b.dueDate) return 0; // Both null or undefined, keep order
        if (!a.dueDate) return 1; // a is null/undefined, b is not, so b comes first
        if (!b.dueDate) return -1; // b is null/undefined, a is not, so a comes first
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      // Default sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };
  
  // Filter todos into user's todos, completed todos, and friends' todos
  const userTodos = todos.filter(todo => todo.user._id === session?.user?.id);
  const friendsTodos = todos.filter(todo => todo.user._id !== session?.user?.id);
  const completedTodos = userTodos.filter(todo => todo.completed);
  
  // Apply hide completed filter ONLY to the user's todos, not to friends' todos
  const filteredUserTodos = hideCompletedUser 
    ? userTodos.filter(todo => !todo.completed) 
    : userTodos;
    
  // Don't filter friends' todos by completion status (already filtered by not being user's todos)
  const filteredFriendsTodos = friendsTodos;
  
  // Use the reusable sort function
  const sortedUserTodos = sortTodos(filteredUserTodos, sortByDueDate);
  const sortedFriendsTodos = sortTodos(filteredFriendsTodos, sortByDueDate);
  const sortedCompletedTodos = sortTodos(completedTodos, sortByDueDate);

  const handleToggleHideCompletedUser = () => {
    setHideCompletedUser(!hideCompletedUser);
  };

  // Toggle function for second column view
  const toggleSecondColumnView = () => {
    if (secondColumnView === 'friends') {
      // Switching to Finished Tasks view, hide completed tasks
      setSecondColumnView('completed');
      setHideCompletedUser(true);
    } else {
      // Switching to Friends' Tasks view, show completed tasks
      setSecondColumnView('friends');
      setHideCompletedUser(false);
    }
  };

  // Fetches the current user's friends list from the API and updates cache
  const fetchFriends = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const friendsCacheKey = getCacheKey(FRIENDS_CACHE_KEY_PREFIX, userId);

    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
        if (friendsCacheKey) {
          setCachedData(friendsCacheKey, data);
        }
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  // Fetches all registered users (for friend finding) from the API and updates cache
  const fetchAllUsers = async () => {
    if (!session?.user?.id) return; // Ensure user is logged in
    const userId = session.user.id; // User ID for cache key
    const allUsersCacheKey = getCacheKey(ALL_USERS_CACHE_KEY_PREFIX, userId);

    try {
      setError(''); // Clear previous errors specifically for this action
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
        if (allUsersCacheKey) {
          setCachedData(allUsersCacheKey, data);
        }
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users');
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) { // Basic validation for title
      setError('Title is required.');
      return;
    }
    setError('');
    setIsAddingTodo(true);

    const originalTodos = [...todos];
    const tempId = `temp-${Date.now()}`;
    
    const optimisticTodo: Todo = {
      _id: tempId,
      title: newTodo.title,
      description: newTodo.description || undefined, // Ensure description is undefined if empty, matching interface
      dueDate: newTodo.dueDate || undefined, // Ensure dueDate is undefined if empty
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), // Tentative updatedAt
      user: { 
        username: session?.user?.name || 'You', 
        _id: session?.user?.id 
      },
    };

    setTodos(prevTodos => [optimisticTodo, ...prevTodos]);
    const currentNewTodoState = { ...newTodo }; // Capture newTodo state before clearing
    setNewTodo({ title: '', description: '', dueDate: '' }); // Clear inputs

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send the captured newTodo state, not the cleared one
        body: JSON.stringify({ 
          title: currentNewTodoState.title, 
          description: currentNewTodoState.description, 
          dueDate: currentNewTodoState.dueDate 
        }),
      });

      if (response.ok) {
        const serverTodo = await response.json();
        // Replace optimistic todo with server-confirmed todo
        setTodos(prevTodos => 
          [serverTodo, ...prevTodos.filter(t => t._id !== tempId)]
        );
        // Update cache with the new state
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) {
            // Construct the final list for caching
            const finalTodosForCache = [serverTodo, ...originalTodos.filter(t => t._id !== tempId)]; // Use originalTodos here
            setCachedData(todosCacheKey, finalTodosForCache);
          }
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add task. Please try again.');
        // Revert UI: remove optimistic todo
        setTodos(originalTodos);
        // Revert cache
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
        }
      }
    } catch (err: any) {
      console.error('Failed to add todo:', err.message, { stack: err.stack });
      setError('Failed to add task. Please try again.');
      // Revert UI: remove optimistic todo
      setTodos(originalTodos);
      // Revert cache
      if (session?.user?.id) {
        const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
        if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
      }
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleToggleTodo = async (todoId: string, newStatus: boolean) => {
    setError(''); // Clear previous errors

    const originalTodos = [...todos]; // Store original todos for potential revert

    // Optimistic UI Update
    setTodos(prevTodos =>
      prevTodos.map(t =>
        t._id === todoId ? { ...t, completed: newStatus, updatedAt: new Date().toISOString() } : t // Tentatively update updatedAt
      )
    );

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: newStatus }),
      });

      if (response.ok) {
        const updatedTodoFromServer = await response.json();
        
        // Construct the new todos list with the server-confirmed data
        const newTodosState = originalTodos.map(t => 
          t._id === todoId ? updatedTodoFromServer : t
        );
        
        setTodos(newTodosState); // Update UI with server-confirmed data

        // Update cache with the successfully updated list
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) {
            setCachedData(todosCacheKey, newTodosState);
          }
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update task. Please try again.');
        setTodos(originalTodos); // Revert UI on API error

        // Revert cache
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
        }
      }
    } catch (err: any) {
      console.error('Failed to update todo:', err.message, { stack: err.stack });
      setError('Failed to update task. Please try again.');
      setTodos(originalTodos); // Revert UI on network or other errors

      // Revert cache
      if (session?.user?.id) {
        const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
        if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
      }
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    setError('');
    setDeletingTodoId(todoId);

    const originalTodos = [...todos];
    // const todoToDelete = originalTodos.find(t => t._id === todoId); // For potential specific re-add, not strictly needed if reverting full list

    // Optimistic UI Update
    setTodos(prevTodos => prevTodos.filter(t => t._id !== todoId));

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // UI is already updated.
        // Update cache with the successfully filtered list.
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) {
            // The current 'todos' state is already the filtered list due to optimistic update
            // However, it's safer to use a list derived from originalTodos or explicitly filter again for cache
            const finalTodosForCache = originalTodos.filter(t => t._id !== todoId);
            setCachedData(todosCacheKey, finalTodosForCache);
          }
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete task. Please try again.');
        setTodos(originalTodos); // Revert UI on API error

        // Revert cache
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete todo:', err.message, { stack: err.stack });
      setError('Failed to delete task. Please try again.');
      setTodos(originalTodos); // Revert UI on network or other errors

      // Revert cache
      if (session?.user?.id) {
        const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
        if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
      }
    } finally {
      setDeletingTodoId(null);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditFormData({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
    });
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;
    if (!editFormData.title.trim()) { // Basic validation for title
      setError('Title is required for editing.'); // Set error within modal or globally
      return;
    }

    setError('');
    setIsSavingEdit(true);

    const originalTodos = [...todos];

    // Optimistic UI Update
    setTodos(prevTodos =>
      prevTodos.map(t =>
        t._id === editingTodo._id
          ? { ...t, ...editFormData, dueDate: editFormData.dueDate || undefined, description: editFormData.description || undefined, updatedAt: new Date().toISOString() }
          : t
      )
    );
    
    const todoIdToUpdate = editingTodo._id; // Store ID before closing modal
    setEditingTodo(null); // Close modal optimistically

    try {
      const response = await fetch(`/api/todos/${todoIdToUpdate}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData), // Send current editFormData
      });

      if (response.ok) {
        const updatedTodoFromServer = await response.json();
        // Update UI with server-confirmed data
        const newTodosState = originalTodos.map(t => 
          t._id === updatedTodoFromServer._id ? updatedTodoFromServer : t
        );
        setTodos(newTodosState);

        // Update cache
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) setCachedData(todosCacheKey, newTodosState);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update task. Please try again.');
        setTodos(originalTodos); // Revert UI

        // Revert cache
        if (session?.user?.id) {
          const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
          if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
        }
        // Optionally, re-open modal or keep data to allow user to retry
        // For simplicity, we are just reverting the list and showing an error.
      }
    } catch (err: any) {
      console.error('Failed to update todo:', err.message, { stack: err.stack });
      setError('Failed to update task. Please try again.');
      setTodos(originalTodos); // Revert UI

      // Revert cache
      if (session?.user?.id) {
        const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, session.user.id);
        if (todosCacheKey) setCachedData(todosCacheKey, originalTodos);
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddFriend = async (username: string) => {
    try {
      setError('');
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        // Close the modal and refresh todos/friends
        setShowUserList(false);
        // fetchTodos(); // Data will be updated via fetchFriends -> setFriends -> cache update
        fetchFriends(); // This will also update friends cache
        // After adding a friend, their todos might become visible, so refetch todos
        fetchTodos(); 
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to add friend:', err);
      setError('Failed to add friend');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFriends(); // This will also update friends cache
        // After removing a friend, their todos should be removed from the main list, so refetch todos
        fetchTodos();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to remove friend:', err);
      setError('Failed to remove friend');
    }
  };

  // Handles user logout: clears session and all user-specific cache
  const handleLogout = async () => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      const userId = session.user.id;
      // Clear all caches associated with the user
      const todosCacheKey = getCacheKey(TODOS_CACHE_KEY_PREFIX, userId);
      if (todosCacheKey) localStorage.removeItem(todosCacheKey);
      
      const friendsCacheKey = getCacheKey(FRIENDS_CACHE_KEY_PREFIX, userId);
      if (friendsCacheKey) localStorage.removeItem(friendsCacheKey);
      
      const allUsersCacheKey = getCacheKey(ALL_USERS_CACHE_KEY_PREFIX, userId);
      if (allUsersCacheKey) localStorage.removeItem(allUsersCacheKey);
    }
    await signOut({ redirect: false }); // Sign out without immediate redirect
    router.push('/'); // Redirect to homepage
  };

  // Opens the 'Find Friends' modal and loads user list (from cache or API)
  const handleOpenUserList = () => {
    setShowUserList(true);
    setError(''); // Clear previous errors when opening modal

    if (!session?.user?.id) return;
    const userId = session.user.id; // Or use a global key
    const allUsersCacheKey = getCacheKey(ALL_USERS_CACHE_KEY_PREFIX, userId);

    if (allUsersCacheKey) {
      const cachedUsers = getCachedData<User[]>(allUsersCacheKey);
      if (cachedUsers) {
        setAllUsers(cachedUsers);
        return; // Data loaded from cache
      }
    }
    fetchAllUsers(); // Fetch if not in cache or stale
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend._id === userId);
  };

  const isCurrentUser = (userId: string) => {
    return session?.user?.id === userId;
  };

  // Client-side filtering of allUsers based on searchTerm
  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Display loading screen while initial data is being fetched
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(45deg, #ffb6c1 25%, #ffc1d0 25%, #ffc1d0 50%, #ffb6c1 50%, #ffb6c1 75%, #ffc1d0 75%, #ffc1d0)',
          backgroundSize: '40px 40px',
          imageRendering: 'pixelated'
        }}
      >
        <div className="text-2xl font-pixel text-white px-4 py-3 bg-pixel-purple rounded-lg shadow-pixel">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        background: 'linear-gradient(45deg, #ffb6c1 25%, #ffc1d0 25%, #ffc1d0 50%, #ffb6c1 50%, #ffb6c1 75%, #ffc1d0 75%, #ffc1d0)',
        backgroundSize: '40px 40px',
        imageRendering: 'pixelated'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-pixel p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-pixel text-pixel-purple flex items-center gap-2">
              <Image 
                src="/favicon.svg" 
                alt="LunaTODO Heart Favicon" 
                width={24}
                height={24}
                style={{ imageRendering: 'pixelated' }}
              />
              My LunaTODO List
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
            >
              <FiLogOut /> Logout
            </button>
          </div>
          
          <form onSubmit={handleAddTodo} className="space-y-4 mb-8">
            <div>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel placeholder:text-gray-400 placeholder:font-pixel"
                required
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={isAddingTodo}
              />
            </div>
            <div className="flex gap-4 flex-wrap md:flex-nowrap">
              <input
                type="text"
                placeholder="Description (optional)"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                className="flex-1 px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel min-w-[200px] font-pixel placeholder:text-gray-400 placeholder:font-pixel"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={isAddingTodo}
              />
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                className="px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel"
                autoComplete="off"
                disabled={isAddingTodo}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pixel-purple text-white rounded-md shadow-pixel pixel-btn flex items-center justify-center gap-2 font-pixel text-sm whitespace-nowrap min-w-[120px]"
                disabled={isAddingTodo}
              >
                {isAddingTodo ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><FiPlus /> Add Task</>
                )}
              </button>
            </div>
          </form>

          <div className="flex gap-4 mb-6 justify-between items-center flex-wrap">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-pixel text-pixel-green">Friends</h2>
              <button
                onClick={handleOpenUserList}
                className="px-4 py-2 bg-pixel-green text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
              >
                <FiUsers /> Find Friends
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggleHideCompletedUser}
                className={`px-4 py-2 ${hideCompletedUser ? 'bg-pixel-purple' : 'bg-gray-400'} text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm`}
                title={hideCompletedUser ? "Show completed tasks" : "Hide completed tasks"}
              >
                {hideCompletedUser ? <FiEye /> : <FiEyeOff />} {hideCompletedUser ? "Show Done" : "Hide Done"}
              </button>
              <button
                onClick={handleSortByDueDate}
                className={`px-4 py-2 ${sortByDueDate ? 'bg-pixel-purple' : 'bg-pixel-blue'} text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm`}
                title={sortByDueDate ? "Sorted by due date" : "Sort by due date"}
              >
                <FiClock /> {sortByDueDate ? "By Date" : "Sort Date"}
              </button>
            </div>
          </div>

          {/* Current Friends List */}
          <div className="mb-6 space-y-2">
            {friends.length === 0 ? (
              <p className="text-gray-500 font-pixel text-sm">You haven&apos;t added any friends yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map(friend => (
                  <div key={friend._id} className="px-3 py-1 bg-pixel-green bg-opacity-20 rounded-full text-pixel-green font-pixel text-xs flex items-center justify-between gap-2">
                    {friend.username}
                    <button
                      onClick={() => handleRemoveFriend(friend._id)}
                      className="bg-red-400 hover:bg-red-500 rounded-full p-1 ml-1 transition-colors"
                      aria-label={`Remove ${friend.username}`}
                      title="Remove friend"
                    >
                      <FiX size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 mb-4 font-pixel text-sm">{error}</div>
          )}

          {/* Two-column layout for todos */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* User's Todos Column */}
            <div className="flex-1">
              <h2 className="text-xl font-pixel text-pixel-purple mb-4">My Tasks</h2>
              <div className="space-y-4">
                {sortedUserTodos.length === 0 ? (
                  <p className="text-gray-500 font-pixel text-center py-6">No todos yet. Add one above!</p>
                ) : (
                  sortedUserTodos.map((todo) => (
                    <div
                      key={todo._id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 shadow-pixel"
                    >
                      <button
                        onClick={() => handleToggleTodo(todo._id, !todo.completed)}
                        className={`p-2 rounded-full ${
                          todo.completed ? 'bg-pixel-green' : 'bg-gray-300'
                        } shadow-sm`}
                      >
                        <FiCheck className="text-white" />
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-pixel ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-gray-600 text-sm font-pixel">{todo.description}</p>
                        )}
                        {todo.dueDate && (
                          <p className="text-gray-500 text-sm font-pixel">
                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex">
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-full mr-1"
                          disabled={deletingTodoId === todo._id}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-full w-9 h-9 flex items-center justify-center"
                          disabled={deletingTodoId === todo._id}
                          aria-label={deletingTodoId === todo._id ? "Deleting..." : "Delete todo"}
                        >
                          {deletingTodoId === todo._id ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <FiTrash2 />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Second Column - Toggle between Friends' Tasks and Completed Tasks */}
            <div className="flex-1 md:border-l-2 md:border-gray-200 md:pl-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-pixel text-pixel-blue">
                  {secondColumnView === 'friends' ? "Friends' Tasks" : "Finished Tasks"}
                </h2>
                
                {/* Toggle Button (replaces dropdown) */}
                <button
                  onClick={toggleSecondColumnView}
                  className="px-4 py-2 bg-pixel-pink border-2 border-pixel-purple text-pixel-purple font-pixel rounded-md shadow-pixel pixel-btn flex items-center gap-2 text-sm transition-all hover:bg-pixel-purple hover:text-white hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-[1px_1px_0_rgba(0,0,0,0.2)]"
                  style={{
                    imageRendering: 'pixelated',
                    boxShadow: '3px 3px 0 rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {secondColumnView === 'friends' ? <FiCheckSquare className="text-pixel-purple" /> : <FiUsers className="text-pixel-purple" />}
                  {secondColumnView === 'friends' ? "Show Finished" : "Show Friends"}
                </button>
              </div>
              
              {secondColumnView === 'friends' ? (
                // Friends' Tasks View - Now showing all friend tasks (including completed)
                <div className="space-y-4">
                  {sortedFriendsTodos.length === 0 ? (
                    <p className="text-gray-500 font-pixel text-center py-6">No friend tasks found.</p>
                  ) : (
                    sortedFriendsTodos.map((todo) => (
                      <div
                        key={todo._id}
                        className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-100 shadow-pixel"
                      >
                        <div className={`p-2 rounded-full ${
                          todo.completed ? 'bg-pixel-green' : 'bg-gray-300'
                        } shadow-sm`}>
                          <FiCheck className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-pixel ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 text-sm font-pixel">{todo.description}</p>
                          )}
                          {todo.dueDate && (
                            <p className="text-gray-500 text-sm font-pixel">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-blue-400 text-sm font-pixel">
                            By: <span className="font-pixel">{todo.user.username}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Completed Tasks View
                <div className="space-y-4">
                  {sortedCompletedTodos.length === 0 ? (
                    <p className="text-gray-500 font-pixel text-center py-6">You haven&apos;t completed any tasks yet.</p>
                  ) : (
                    sortedCompletedTodos.map((todo) => (
                      <div
                        key={todo._id}
                        className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-100 shadow-pixel"
                      >
                        <div className="p-2 rounded-full bg-pixel-green shadow-sm">
                          <FiCheck className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-pixel line-through text-gray-500">
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 text-sm font-pixel">{todo.description}</p>
                          )}
                          {todo.dueDate && (
                            <p className="text-gray-500 text-sm font-pixel">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-green-500 text-sm font-pixel">
                            Completed on: {new Date(todo.updatedAt || todo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex">
                          <button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full w-9 h-9 flex items-center justify-center"
                            disabled={deletingTodoId === todo._id}
                            aria-label={deletingTodoId === todo._id ? "Deleting..." : "Delete todo"}
                          >
                            {deletingTodoId === todo._id ? (
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FiTrash2 />
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-pixel p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-pixel text-pixel-purple">Edit Task</h2>
              <button 
                onClick={() => setEditingTodo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                <label className="block text-sm font-pixel mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-pixel mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-pixel mb-1">Due Date (optional)</label>
                <input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md shadow-pixel pixel-btn font-pixel text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pixel-purple text-white rounded-md shadow-pixel pixel-btn font-pixel text-sm min-w-[120px] flex items-center justify-center"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for showing all users */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-pixel p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-pixel text-pixel-purple">Find Friends</h2>
              <button 
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-md border-2 border-gray-300 shadow-pixel font-pixel placeholder:text-gray-400 placeholder:font-pixel"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            
            {error && (
              <div className="text-red-500 mb-4 font-pixel text-sm">{error}</div>
            )}
            
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4 font-pixel text-sm">No users found</p>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user._id} 
                    className="flex justify-between items-center p-3 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="font-pixel text-sm">{user.username}</span>
                    
                    {isCurrentUser(user._id) ? (
                      <span className="text-xs text-gray-500 font-pixel">You</span>
                    ) : isFriend(user._id) ? (
                      <span className="text-xs text-pixel-green font-pixel">Already friends</span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user.username)}
                        className="px-2 py-1 bg-pixel-green text-white rounded-md text-xs font-pixel shadow-pixel pixel-btn flex items-center gap-1"
                      >
                        <FiUserPlus size={12} /> Add
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}