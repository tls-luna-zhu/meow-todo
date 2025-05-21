'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTodos();
      fetchFriends();
    }
  }, [status, router]);
  
  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      if (response.ok) {
        setTodos(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      setError('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSortByDueDate = () => {
    setSortByDueDate(!sortByDueDate);
  };
  
  const userTodos = todos.filter(todo => todo.user._id === session?.user?.id);
  const friendsTodos = todos.filter(todo => todo.user._id !== session?.user?.id);
  const completedTodos = userTodos.filter(todo => todo.completed);
  
  const filteredUserTodos = hideCompletedUser 
    ? userTodos.filter(todo => !todo.completed) 
    : userTodos;
    
  const filteredFriendsTodos = friendsTodos;
  
  const sortedUserTodos = [...filteredUserTodos].sort((a, b) => {
    if (sortByDueDate) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const sortedFriendsTodos = [...filteredFriendsTodos].sort((a, b) => {
    if (sortByDueDate) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const sortedCompletedTodos = [...completedTodos].sort((a, b) => {
    if (sortByDueDate) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleToggleHideCompletedUser = () => {
    setHideCompletedUser(!hideCompletedUser);
  };

  const toggleSecondColumnView = () => {
    if (secondColumnView === 'friends') {
      setSecondColumnView('completed');
      setHideCompletedUser(true);
    } else {
      setSecondColumnView('friends');
      setHideCompletedUser(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

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
        const todo = await response.json();
        setTodos([todo, ...todos]);
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
        setTodos(todos.map(todo =>
          todo._id === todoId ? { ...todo, completed } : todo
        ));
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
        setTodos(todos.filter(todo => todo._id !== todoId));
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
        const updatedTodo = await response.json();
        setTodos(todos.map(todo =>
          todo._id === editingTodo._id ? updatedTodo : todo
        ));
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
        setShowUserList(false);
        fetchTodos();
        fetchFriends();
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
        fetchFriends();
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
    return session?.user?.id === userId;
  };

  const filteredUsers = allUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-2xl font-pixel px-4 py-3 bg-pixel-purple text-white dark:bg-[var(--pastel-accent-1-hex)] dark:text-[var(--dark-lavender-hex)] rounded-lg shadow-pixel">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="pixel-card p-6 mb-6"> {/* Use pixel-card for main content area */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-pixel text-pixel-purple dark:text-[var(--light-pastel-text-hex)] flex items-center gap-2">
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
              className="px-4 py-2 bg-red-500 text-white dark:bg-red-500 dark:text-[var(--light-pastel-text-hex)] rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
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
                className="w-full pixel-input font-pixel"
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
                className="flex-1 pixel-input min-w-[200px] font-pixel"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                className="pixel-input font-pixel"
                autoComplete="off"
              />
              <button
                type="submit"
                className="pixel-button flex items-center gap-2 font-pixel text-sm whitespace-nowrap"
              >
                <FiPlus /> Add Task
              </button>
            </div>
          </form>

          <div className="flex gap-4 mb-6 justify-between items-center flex-wrap">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-pixel text-pixel-green dark:text-[var(--pastel-accent-2-hex)]">Friends</h2>
              <button
                onClick={handleOpenUserList}
                className="px-4 py-2 bg-pixel-green text-white dark:bg-[var(--pastel-accent-2-hex)] dark:text-[var(--dark-lavender-hex)] rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
              >
                <FiUsers /> Find Friends
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggleHideCompletedUser}
                className={`px-4 py-2 ${hideCompletedUser ? 'bg-pixel-purple dark:bg-[var(--pastel-accent-1-hex)] dark:text-[var(--dark-lavender-hex)]' : 'bg-gray-400 dark:bg-gray-500 dark:text-[var(--light-pastel-text-hex)]'} text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm`}
                title={hideCompletedUser ? "Show completed tasks" : "Hide completed tasks"}
              >
                {hideCompletedUser ? <FiEye /> : <FiEyeOff />} {hideCompletedUser ? "Show Done" : "Hide Done"}
              </button>
              <button
                onClick={handleSortByDueDate}
                className={`px-4 py-2 ${sortByDueDate ? 'bg-pixel-purple dark:bg-[var(--pastel-accent-1-hex)] dark:text-[var(--dark-lavender-hex)]' : 'bg-pixel-blue dark:bg-[var(--pastel-accent-2-hex)] dark:text-[var(--dark-lavender-hex)]'} text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm`}
                title={sortByDueDate ? "Sorted by due date" : "Sort by due date"}
              >
                <FiClock /> {sortByDueDate ? "By Date" : "Sort Date"}
              </button>
            </div>
          </div>

          <div className="mb-6 space-y-2">
            {friends.length === 0 ? (
              <p className="text-gray-500 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] font-pixel text-sm">You haven&apos;t added any friends yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map(friend => (
                  <div key={friend._id} className="px-3 py-1 bg-pixel-green bg-opacity-20 dark:bg-[var(--pastel-accent-1-hex)] dark:bg-opacity-30 rounded-full text-pixel-green dark:text-[var(--dark-lavender-hex)] font-pixel text-xs flex items-center justify-between gap-2">
                    {friend.username}
                    <button
                      onClick={() => handleRemoveFriend(friend._id)}
                      className="bg-red-400 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-600 rounded-full p-1 ml-1 transition-colors"
                      aria-label={`Remove ${friend.username}`}
                      title="Remove friend"
                    >
                      <FiX size={12} className="text-white dark:text-[var(--light-pastel-text-hex)]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-300 mb-4 font-pixel text-sm">{error}</div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-pixel text-pixel-purple dark:text-[var(--light-pastel-text-hex)] mb-4">My Tasks</h2>
              <div className="space-y-4">
                {sortedUserTodos.length === 0 ? (
                  <p className="text-gray-500 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] font-pixel text-center py-6">No todos yet. Add one above!</p>
                ) : (
                  sortedUserTodos.map((todo) => (
                    <div
                      key={todo._id}
                      className="pixel-card flex items-center gap-4 p-4" // Use pixel-card for todo items
                    >
                      <button
                        onClick={() => handleToggleTodo(todo._id, !todo.completed)}
                        className={`p-2 rounded-full ${
                          todo.completed ? 'bg-pixel-green dark:bg-[var(--pastel-accent-1-hex)]' : 'bg-gray-300 dark:bg-gray-500'
                        } shadow-sm`}
                      >
                        <FiCheck className="text-white dark:text-[var(--dark-lavender-hex)]" />
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-pixel ${todo.completed ? 'line-through text-gray-500 dark:text-opacity-60 dark:text-[var(--light-pastel-text-hex)]' : 'text-gray-800 dark:text-[var(--light-pastel-text-hex)]'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-gray-600 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] text-sm font-pixel">{todo.description}</p>
                        )}
                        {todo.dueDate && (
                          <p className="text-gray-500 dark:text-opacity-70 dark:text-[var(--light-pastel-text-hex)] text-sm font-pixel">
                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex">
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="p-2 text-blue-500 dark:text-[var(--pastel-accent-1-hex)] hover:bg-blue-100 dark:hover:bg-white dark:hover:bg-opacity-20 rounded-full mr-1"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="p-2 text-red-500 dark:text-red-300 hover:bg-red-100 dark:hover:bg-white dark:hover:bg-opacity-20 rounded-full"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 md:border-l-2 md:border-gray-200 dark:md:border-[var(--pastel-accent-1-hex)] md:pl-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-pixel text-pixel-blue dark:text-[var(--pastel-accent-2-hex)]">
                  {secondColumnView === 'friends' ? "Friends' Tasks" : "Finished Tasks"}
                </h2>
                
                <button
                  onClick={toggleSecondColumnView}
                  className="px-4 py-2 bg-pixel-pink border-2 border-pixel-purple text-pixel-purple dark:bg-[var(--pastel-accent-2-hex)] dark:border-[var(--pastel-accent-1-hex)] dark:text-[var(--dark-lavender-hex)] font-pixel rounded-md shadow-pixel pixel-btn flex items-center gap-2 text-sm transition-all hover:bg-pixel-purple hover:text-white dark:hover:bg-[var(--pastel-accent-1-hex)] dark:hover:text-[var(--dark-lavender-hex)] active:translate-y-[0px]"
                  style={{
                    imageRendering: 'pixelated', // Keep if desired for specific buttons
                  }}
                >
                  {secondColumnView === 'friends' ? <FiCheckSquare /> : <FiUsers />}
                  {secondColumnView === 'friends' ? "Show Finished" : "Show Friends"}
                </button>
              </div>
              
              {secondColumnView === 'friends' ? (
                <div className="space-y-4">
                  {sortedFriendsTodos.length === 0 ? (
                    <p className="text-gray-500 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] font-pixel text-center py-6">No friend tasks found.</p>
                  ) : (
                    sortedFriendsTodos.map((todo) => (
                      <div
                        key={todo._id}
                        className="pixel-card flex items-center gap-4 p-4" // Use pixel-card for friend's todo items
                      >
                        <div className={`p-2 rounded-full ${
                          todo.completed ? 'bg-pixel-green dark:bg-[var(--pastel-accent-1-hex)]' : 'bg-gray-300 dark:bg-gray-500'
                        } shadow-sm`}>
                          <FiCheck className="text-white dark:text-[var(--dark-lavender-hex)]" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-pixel ${todo.completed ? 'line-through text-gray-500 dark:text-opacity-60 dark:text-[var(--light-pastel-text-hex)]' : 'text-gray-800 dark:text-[var(--light-pastel-text-hex)]'}`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] text-sm font-pixel">{todo.description}</p>
                          )}
                          {todo.dueDate && (
                            <p className="text-gray-500 dark:text-opacity-70 dark:text-[var(--light-pastel-text-hex)] text-sm font-pixel">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-blue-400 dark:text-[var(--pastel-accent-2-hex)] text-sm font-pixel">
                            By: <span className="font-pixel">{todo.user.username}</span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCompletedTodos.length === 0 ? (
                    <p className="text-gray-500 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] font-pixel text-center py-6">You haven&apos;t completed any tasks yet.</p>
                  ) : (
                    sortedCompletedTodos.map((todo) => (
                      <div
                        key={todo._id}
                        className="pixel-card flex items-center gap-4 p-4" // Use pixel-card for completed todo items
                      >
                        <div className="p-2 rounded-full bg-pixel-green dark:bg-[var(--pastel-accent-1-hex)] shadow-sm">
                          <FiCheck className="text-white dark:text-[var(--dark-lavender-hex)]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-pixel line-through text-gray-500 dark:text-opacity-60 dark:text-[var(--light-pastel-text-hex)]">
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] text-sm font-pixel">{todo.description}</p>
                          )}
                          {todo.dueDate && (
                            <p className="text-gray-500 dark:text-opacity-70 dark:text-[var(--light-pastel-text-hex)] text-sm font-pixel">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-green-500 dark:text-[var(--pastel-accent-1-hex)] text-sm font-pixel">
                            Completed on: {new Date(todo.updatedAt || todo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex">
                          <button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="p-2 text-red-500 dark:text-red-300 hover:bg-red-100 dark:hover:bg-white dark:hover:bg-opacity-20 rounded-full"
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
          <div className="pixel-card p-6 max-w-md w-full"> {/* Use pixel-card for modal */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-pixel text-pixel-purple dark:text-[var(--light-pastel-text-hex)]">Edit Task</h2>
              <button 
                onClick={() => setEditingTodo(null)}
                className="text-gray-500 dark:text-[var(--light-pastel-text-hex)] hover:text-gray-700 dark:hover:text-opacity-80"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                <label className="block text-sm font-pixel mb-1 text-gray-700 dark:text-[var(--light-pastel-text-hex)] dark:text-opacity-80">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full pixel-input font-pixel"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-pixel mb-1 text-gray-700 dark:text-[var(--light-pastel-text-hex)] dark:text-opacity-80">Description (optional)</label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full pixel-input font-pixel"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-pixel mb-1 text-gray-700 dark:text-[var(--light-pastel-text-hex)] dark:text-opacity-80">Due Date (optional)</label>
                <input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="w-full pixel-input font-pixel"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-[var(--dark-pastel-bg-alt-hex)] dark:hover:bg-opacity-70 dark:text-[var(--light-pastel-text-hex)] dark:border-[var(--pastel-accent-1-hex)] border-2 rounded-md shadow-pixel pixel-btn font-pixel text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pixel-button font-pixel text-sm"
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
          <div className="pixel-card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"> {/* Use pixel-card for modal */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-pixel text-pixel-purple dark:text-[var(--light-pastel-text-hex)]">Find Friends</h2>
              <button 
                onClick={() => setShowUserList(false)}
                className="text-gray-500 dark:text-[var(--light-pastel-text-hex)] hover:text-gray-700 dark:hover:text-opacity-80"
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
                className="w-full pixel-input font-pixel"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            
            {error && (
              <div className="text-red-500 dark:text-red-300 mb-4 font-pixel text-sm">{error}</div>
            )}
            
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 dark:text-opacity-80 dark:text-[var(--light-pastel-text-hex)] text-center py-4 font-pixel text-sm">No users found</p>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user._id} 
                    className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-[var(--pastel-accent-1-hex)] dark:border-opacity-50 last:border-b-0"
                  >
                    <span className="font-pixel text-sm text-gray-800 dark:text-[var(--light-pastel-text-hex)]">{user.username}</span>
                    
                    {isCurrentUser(user._id) ? (
                      <span className="text-xs text-gray-500 dark:text-opacity-70 dark:text-[var(--light-pastel-text-hex)] font-pixel">You</span>
                    ) : isFriend(user._id) ? (
                      <span className="text-xs text-pixel-green dark:text-[var(--pastel-accent-1-hex)] font-pixel">Already friends</span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user.username)}
                        className="px-2 py-1 bg-pixel-green text-white dark:bg-[var(--pastel-accent-2-hex)] dark:text-[var(--dark-lavender-hex)] rounded-md text-xs font-pixel shadow-pixel pixel-btn flex items-center gap-1"
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