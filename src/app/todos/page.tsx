import { useState, useEffect } from 'react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/options';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiCheck, FiUserPlus, FiLogOut, FiUsers, FiX, FiClock, FiEdit2, FiEye, FiEyeOff, FiCheckSquare } from 'react-icons/fi';
import Image from 'next/image';

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

export const getServerSideProps: GetServerSideProps<{
  initialTodos: Todo[];
  initialFriends: User[];
  currentUser: User | null;
  initialSortByDueDate: boolean;
  initialHideCompletedUser: boolean;
}> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // TODO: Replace with direct database calls or service layer calls if possible
  // For now, using absolute URLs for API calls
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let initialTodos: Todo[] = [];
  let initialFriends: User[] = [];

  try {
    const todosResponse = await fetch(`${baseUrl}/api/todos`, {
      headers: {
        cookie: context.req.headers.cookie || '', // Forward cookies
      },
    });
    if (todosResponse.ok) {
      initialTodos = await todosResponse.json();
    } else {
      console.error('Failed to fetch todos SSR:', await todosResponse.text());
    }
  } catch (err) {
    console.error('Error fetching todos SSR:', err);
  }

  try {
    const friendsResponse = await fetch(`${baseUrl}/api/friends`, {
      headers: {
        cookie: context.req.headers.cookie || '', // Forward cookies
      },
    });
    if (friendsResponse.ok) {
      initialFriends = await friendsResponse.json();
    } else {
      console.error('Failed to fetch friends SSR:', await friendsResponse.text());
    }
  } catch (err) {
    console.error('Error fetching friends SSR:', err);
  }
  
  const currentUser = session.user ? {
    _id: session.user.id,
    username: session.user.name || '',
    email: session.user.email || '',
  } : null;

  // Get user preferences from cookies
  const cookies = context.req.cookies;
  const initialSortByDueDateCookie = cookies['preference_sortByDueDate'];
  const initialHideCompletedUserCookie = cookies['preference_hideCompletedUser'];

  // Default preferences if cookies are not set or invalid
  const initialSortByDueDate = initialSortByDueDateCookie ? initialSortByDueDateCookie === 'true' : true;
  const initialHideCompletedUser = initialHideCompletedUserCookie ? initialHideCompletedUserCookie === 'true' : false;

  return {
    props: {
      initialTodos,
      initialFriends,
      currentUser,
      initialSortByDueDate,
      initialHideCompletedUser,
    },
  };
};

export default function Todos({ 
  initialTodos, 
  initialFriends, 
  currentUser, 
  initialSortByDueDate,
  initialHideCompletedUser 
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false); // Initial data is loaded by SSR
  const [error, setError] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [friends, setFriends] = useState<User[]>(initialFriends);
  const [sortByDueDate, setSortByDueDate] = useState(initialSortByDueDate);
  const [hideCompletedUser, setHideCompletedUser] = useState(initialHideCompletedUser);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', dueDate: '' });
  const [secondColumnView, setSecondColumnView] = useState<'friends' | 'completed'>('friends');

  // --- Client-side Cache Configuration ---
  const CACHE_KEY_TODOS = 'LUNATODO_CACHED_TODOS';
  const CACHE_KEY_FRIENDS = 'LUNATODO_CACHED_FRIENDS';
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  const setCachedData = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        const item = {
          timestamp: Date.now(),
          data: data,
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (e) {
        console.error(`Error setting cache for ${key}:`, e);
      }
    }
  };

  const getCachedData = (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        const item = JSON.parse(itemStr);
        if (Date.now() - item.timestamp > CACHE_DURATION_MS) {
          localStorage.removeItem(key); // Cache expired
          return null;
        }
        return item.data;
      } catch (e) {
        console.error(`Error getting cache for ${key}:`, e);
        localStorage.removeItem(key); // Remove corrupted item
        return null;
      }
    }
    return null;
  };
  // --- End Cache Configuration ---

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Attempt to load from cache first, then use SSR data if cache is stale/empty
      // And ensure SSR data is cached if used.
      const cachedTodos = getCachedData(CACHE_KEY_TODOS);
      if (cachedTodos) {
        setTodos(cachedTodos);
      } else if (initialTodos) {
        setTodos(initialTodos); // Ensure state is set if cache miss and SSR data exists
        setCachedData(CACHE_KEY_TODOS, initialTodos);
      }

      const cachedFriends = getCachedData(CACHE_KEY_FRIENDS);
      if (cachedFriends) {
        setFriends(cachedFriends);
      } else if (initialFriends) {
        setFriends(initialFriends); // Ensure state is set
        setCachedData(CACHE_KEY_FRIENDS, initialFriends);
      }
    }
  }, [status, router, initialTodos, initialFriends]);

  // Function to refresh todos from the server
  const fetchTodosFromServer = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/todos'); // This fetches page 1 by default
      const data = await response.json();
      if (response.ok) {
        // API returns { todos: [], totalCount, currentPage, totalPages }
        setTodos(data.todos); 
        setCachedData(CACHE_KEY_TODOS, data.todos);
      } else {
        setError(data.error || 'Failed to refresh todos');
      }
    } catch (err) {
      console.error('Failed to refresh todos:', err);
      setError('Failed to refresh todos');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh friends from the server
  const fetchFriendsFromServer = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json(); // Friends API returns an array
        setFriends(data);
        setCachedData(CACHE_KEY_FRIENDS, data);
      } else {
        console.error('Failed to refresh friends:', await response.json());
      }
    } catch (err) {
      console.error('Error refreshing friends:', err);
    }
  };
  
  const handleSortByDueDate = async () => {
    const newSortByDueDate = !sortByDueDate;
    setSortByDueDate(newSortByDueDate);
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortByDueDate: newSortByDueDate }),
      });
    } catch (err) {
      console.error('Failed to save sort preference:', err);
      // Optionally, display an error to the user or revert the state
    }
  };
  
  // Filter todos into user's todos, completed todos, and friends' todos
  // Use currentUser from props for SSR consistency, fallback to session for client-side updates
  const currentUserId = currentUser?._id || session?.user?.id;
  const userTodos = todos.filter(todo => todo.user._id === currentUserId);
  const friendsTodos = todos.filter(todo => todo.user._id !== currentUserId);
  const completedTodos = userTodos.filter(todo => todo.completed);
  
  // Apply hide completed filter ONLY to the user's todos, not to friends' todos
  const filteredUserTodos = hideCompletedUser 
    ? userTodos.filter(todo => !todo.completed) 
    : userTodos;
    
  // Don't filter friends' todos by completion status
  const filteredFriendsTodos = friendsTodos;
  
  // Sort user's todos
  const sortedUserTodos = [...filteredUserTodos].sort((a, b) => {
    if (sortByDueDate) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Sort friends' todos
  const sortedFriendsTodos = [...filteredFriendsTodos].sort((a, b) => {
    if (sortByDueDate) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Sort completed todos
  const sortedCompletedTodos = [...completedTodos].sort((a, b) => {
    if (sortByDueDate) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleToggleHideCompletedUser = async () => {
    const newHideCompletedUser = !hideCompletedUser;
    setHideCompletedUser(newHideCompletedUser);
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideCompletedUser: newHideCompletedUser }),
      });
    } catch (err) {
      console.error('Failed to save hide completed preference:', err);
      // Optionally, display an error to the user or revert the state
    }
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

  // Fetch all registered users when the user list modal is opened
  const fetchAllUsers = async () => {
    try {
      setError('');
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
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
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      });

      if (response.ok) {
        const todo = await response.json(); // API returns the single created todo
        const updatedTodos = [todo, ...todos];
        setTodos(updatedTodos);
        setCachedData(CACHE_KEY_TODOS, updatedTodos);
        setNewTodo({ title: '', description: '', dueDate: '' });
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to add todo:', err);
      setError('Failed to add todo');
    }
  };

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const updatedTodo = await response.json(); // API returns the updated todo
        const updatedTodos = todos.map(t =>
          t._id === todoId ? updatedTodo : t
        );
        setTodos(updatedTodos);
        setCachedData(CACHE_KEY_TODOS, updatedTodos);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to update todo:', err);
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedTodos = todos.filter(todo => todo._id !== todoId);
        setTodos(updatedTodos);
        setCachedData(CACHE_KEY_TODOS, updatedTodos);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
      setError('Failed to delete todo');
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

    try {
      const response = await fetch(`/api/todos/${editingTodo._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedTodoData = await response.json(); // API returns the updated todo
        const updatedTodos = todos.map(todo =>
          todo._id === editingTodo._id ? updatedTodoData : todo
        );
        setTodos(updatedTodos);
        setCachedData(CACHE_KEY_TODOS, updatedTodos);
        setEditingTodo(null);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to update todo:', err);
      setError('Failed to update todo');
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
        fetchTodosFromServer(); // Refresh todos as new friend's tasks might be visible
        fetchFriendsFromServer(); // Refresh friend list
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
        fetchFriendsFromServer(); // Refresh friend list
        fetchTodosFromServer(); // Refresh todos as a friend's tasks might be removed
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to remove friend:', err);
      setError('Failed to remove friend');
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const handleOpenUserList = () => {
    setShowUserList(true);
    fetchAllUsers();
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend._id === userId);
  };

  const isCurrentUser = (userId: string) => {
    return (currentUser?._id || session?.user?.id) === userId;
  };

  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state can still be used for client-side operations after initial load
  if (status === 'loading' && !initialTodos.length && !initialFriends.length) { // Adjusted loading condition
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
              {currentUser?.username ? `${currentUser.username}'s LunaTODO List` : "My LunaTODO List"}
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
              />
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                className="px-4 py-2 rounded-md border-2 border-gray-300 focus:border-pixel-purple focus:ring-pixel-purple shadow-pixel font-pixel"
                autoComplete="off"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pixel-purple text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm whitespace-nowrap"
              >
                <FiPlus /> Add Task
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
                          disabled={!session} // Disable if no session (though page should redirect)
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
                            disabled={!session}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                            disabled={!session}
                        >
                          <FiTrash2 />
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
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                          >
                            <FiTrash2 />
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
                  className="px-4 py-2 bg-pixel-purple text-white rounded-md shadow-pixel pixel-btn font-pixel text-sm"
                >
                  Save Changes
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