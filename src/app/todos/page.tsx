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
  
  // Removed automated hideCompleted setting when viewing Finished Tasks
  
  // Fetch the current user's todos and their friends' todos
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
  
  // Filter todos into user's todos, completed todos, and friends' todos
  const userTodos = todos.filter(todo => todo.user._id === session?.user?.id);
  const friendsTodos = todos.filter(todo => todo.user._id !== session?.user?.id);
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

  // Fetch current friends
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
        // Close the modal and refresh todos/friends
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
      // 1. Remove inline gradient, 2. Refactor loading text bg/color
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-2xl font-pixel px-4 py-3 bg-pixel-purple text-white dark:bg-[var(--accent-pastel-blue-hex)] dark:text-[var(--dark-brown-hex)] rounded-lg shadow-pixel">Loading...</div>
      </div>
    );
  }

  return (
    // 1. Remove inline gradient
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* 2. Main Content Area: Use pixel-card like styling */}
        <div className="bg-white dark:bg-[var(--light-brown-hex)] rounded-lg shadow-pixel p-6 mb-6 border-2 border-transparent dark:border-[var(--beige-hex)]">
          <div className="flex justify-between items-center mb-6">
            {/* 2. Text Colors */}
            <h1 className="text-2xl font-pixel text-pixel-purple dark:text-[var(--cream-hex)] flex items-center gap-2">
              <Image 
                src="/favicon.svg" 
                alt="LunaTODO Heart Favicon" 
                width={24}
                height={24}
                style={{ imageRendering: 'pixelated' }}
              />
              My LunaTODO List
            </h1>
            {/* 3. Refactor Buttons */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white dark:bg-red-700 dark:text-gray-100 rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
            >
              <FiLogOut /> Logout
            </button>
          </div>
          
          <form onSubmit={handleAddTodo} className="space-y-4 mb-8">
            <div>
              {/* 4. Refactor Inputs */}
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full px-4 py-2 rounded-md font-pixel pixel-input" // Use pixel-input
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
                className="flex-1 px-4 py-2 rounded-md min-w-[200px] font-pixel pixel-input" // Use pixel-input
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                className="px-4 py-2 rounded-md font-pixel pixel-input" // Use pixel-input
                autoComplete="off"
              />
              {/* 3. Refactor Buttons - Use pixel-button class */}
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
              {/* 2. Text Colors */}
              <h2 className="text-xl font-pixel text-pixel-green dark:text-[var(--accent-pastel-pink-hex)]">Friends</h2>
              {/* 3. Refactor Buttons */}
              <button
                onClick={handleOpenUserList}
                className="px-4 py-2 bg-pixel-green text-white dark:bg-[var(--accent-pastel-pink-hex)] dark:text-[var(--dark-brown-hex)] rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
              >
                <FiUsers /> Find Friends
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 3. Refactor Buttons */}
              <button
                onClick={handleToggleHideCompletedUser}
                className={`px-4 py-2 ${hideCompletedUser ? 'bg-pixel-purple dark:bg-[var(--accent-pastel-blue-hex)] dark:text-[var(--dark-brown-hex)]' : 'bg-gray-400 dark:bg-gray-600 dark:text-gray-200'} text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm`}
                title={hideCompletedUser ? "Show completed tasks" : "Hide completed tasks"}
              >
                {hideCompletedUser ? <FiEye /> : <FiEyeOff />} {hideCompletedUser ? "Show Done" : "Hide Done"}
              </button>
              <button
                onClick={handleSortByDueDate}
                className={`px-4 py-2 ${sortByDueDate ? 'bg-pixel-purple dark:bg-[var(--accent-pastel-blue-hex)] dark:text-[var(--dark-brown-hex)]' : 'bg-pixel-blue dark:bg-[var(--accent-pastel-pink-hex)] dark:text-[var(--dark-brown-hex)]'} text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm`}
                title={sortByDueDate ? "Sorted by due date" : "Sort by due date"}
              >
                <FiClock /> {sortByDueDate ? "By Date" : "Sort Date"}
              </button>
            </div>
          </div>

          {/* Current Friends List */}
          <div className="mb-6 space-y-2">
            {friends.length === 0 ? (
              // 2. Text Colors
              <p className="text-gray-500 dark:text-gray-400 font-pixel text-sm">You haven&apos;t added any friends yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {friends.map(friend => (
                  // 2. Text Colors, 3. Refactor Buttons
                  <div key={friend._id} className="px-3 py-1 bg-pixel-green bg-opacity-20 dark:bg-opacity-30 dark:bg-[var(--accent-pastel-pink-hex)] rounded-full text-pixel-green dark:text-[var(--accent-pastel-pink-hex)] font-pixel text-xs flex items-center justify-between gap-2">
                    {friend.username}
                    <button
                      onClick={() => handleRemoveFriend(friend._id)}
                      className="bg-red-400 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-600 rounded-full p-1 ml-1 transition-colors"
                      aria-label={`Remove ${friend.username}`}
                      title="Remove friend"
                    >
                      {/* 5. Icons - color should be fine if button bg provides contrast */}
                      <FiX size={12} className="text-white dark:text-gray-800" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            // 2. Text Colors
            <div className="text-red-500 dark:text-red-400 mb-4 font-pixel text-sm">{error}</div>
          )}

          {/* Two-column layout for todos */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* User's Todos Column */}
            <div className="flex-1">
              {/* 2. Text Colors */}
              <h2 className="text-xl font-pixel text-pixel-purple dark:text-[var(--cream-hex)] mb-4">My Tasks</h2>
              <div className="space-y-4">
                {sortedUserTodos.length === 0 ? (
                  // 2. Text Colors
                  <p className="text-gray-500 dark:text-gray-400 font-pixel text-center py-6">No todos yet. Add one above!</p>
                ) : (
                  sortedUserTodos.map((todo) => (
                    // 2. Refactor Static Backgrounds (Todo Items)
                    <div
                      key={todo._id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[var(--beige-hex)] rounded-lg border-2 border-gray-200 dark:border-[var(--light-brown-hex)] shadow-pixel"
                    >
                      {/* 3. Refactor Buttons */}
                      <button
                        onClick={() => handleToggleTodo(todo._id, !todo.completed)}
                        className={`p-2 rounded-full ${
                          todo.completed ? 'bg-pixel-green dark:bg-[var(--accent-pastel-blue-hex)]' : 'bg-gray-300 dark:bg-gray-500'
                        } shadow-sm`}
                      >
                        {/* 5. Icons */}
                        <FiCheck className="text-white dark:text-[var(--dark-brown-hex)]" />
                      </button>
                      <div className="flex-1">
                        {/* 2. Text Colors */}
                        <h3 className={`text-lg font-pixel ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-[var(--cream-hex)]'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm font-pixel">{todo.description}</p>
                        )}
                        {todo.dueDate && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-pixel">
                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex">
                        {/* 3. Refactor Buttons (Todo Item Action Buttons) */}
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="p-2 text-blue-500 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full mr-1"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo._id)}
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full"
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
            {/* 2. Border colors */}
            <div className="flex-1 md:border-l-2 md:border-gray-200 dark:md:border-[var(--light-brown-hex)] md:pl-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                {/* 2. Text Colors */}
                <h2 className="text-xl font-pixel text-pixel-blue dark:text-[var(--accent-pastel-blue-hex)]">
                  {secondColumnView === 'friends' ? "Friends' Tasks" : "Finished Tasks"}
                </h2>
                
                {/* 3. Refactor Buttons (Toggle Second Column Button) */}
                <button
                  onClick={toggleSecondColumnView}
                  className="px-4 py-2 bg-pixel-pink border-2 border-pixel-purple text-pixel-purple dark:bg-[var(--accent-pastel-pink-hex)] dark:border-[var(--accent-pastel-blue-hex)] dark:text-[var(--dark-brown-hex)] font-pixel rounded-md shadow-pixel pixel-btn flex items-center gap-2 text-sm transition-all hover:bg-pixel-purple hover:text-white dark:hover:bg-[var(--accent-pastel-blue-hex)] dark:hover:text-white active:translate-y-[0px]"
                  style={{
                    imageRendering: 'pixelated',
                    // Using shadow-pixel class for base shadow, dark variant will apply.
                    // Explicit box-shadow here might override or conflict. Let shadow-pixel handle it.
                  }}
                >
                  {/* 5. Icons - text color of parent button should handle this */}
                  {secondColumnView === 'friends' ? <FiCheckSquare /> : <FiUsers />}
                  {secondColumnView === 'friends' ? "Show Finished" : "Show Friends"}
                </button>
              </div>
              
              {secondColumnView === 'friends' ? (
                // Friends' Tasks View
                <div className="space-y-4">
                  {sortedFriendsTodos.length === 0 ? (
                    // 2. Text Colors
                    <p className="text-gray-500 dark:text-gray-400 font-pixel text-center py-6">No friend tasks found.</p>
                  ) : (
                    sortedFriendsTodos.map((todo) => (
                      // 2. Refactor Static Backgrounds (Todo Items)
                      <div
                        key={todo._id}
                        className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-[var(--beige-hex)] rounded-lg border-2 border-blue-100 dark:border-[var(--light-brown-hex)] shadow-pixel"
                      >
                        {/* 3. Refactor Buttons */}
                        <div className={`p-2 rounded-full ${
                          todo.completed ? 'bg-pixel-green dark:bg-[var(--accent-pastel-blue-hex)]' : 'bg-gray-300 dark:bg-gray-500'
                        } shadow-sm`}>
                          {/* 5. Icons */}
                          <FiCheck className="text-white dark:text-[var(--dark-brown-hex)]" />
                        </div>
                        <div className="flex-1">
                          {/* 2. Text Colors */}
                          <h3 className={`text-lg font-pixel ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-[var(--cream-hex)]'}`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm font-pixel">{todo.description}</p>
                          )}
                          {todo.dueDate && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-pixel">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {/* 2. Text Colors */}
                          <p className="text-blue-400 dark:text-blue-300 text-sm font-pixel">
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
                    // 2. Text Colors
                    <p className="text-gray-500 dark:text-gray-400 font-pixel text-center py-6">You haven&apos;t completed any tasks yet.</p>
                  ) : (
                    sortedCompletedTodos.map((todo) => (
                      // 2. Refactor Static Backgrounds (Todo Items)
                      <div
                        key={todo._id}
                        className="flex items-center gap-4 p-4 bg-green-50 dark:bg-[var(--beige-hex)] rounded-lg border-2 border-green-100 dark:border-[var(--light-brown-hex)] shadow-pixel"
                      >
                        {/* 3. Refactor Buttons */}
                        <div className="p-2 rounded-full bg-pixel-green dark:bg-[var(--accent-pastel-blue-hex)] shadow-sm">
                          {/* 5. Icons */}
                          <FiCheck className="text-white dark:text-[var(--dark-brown-hex)]" />
                        </div>
                        <div className="flex-1">
                          {/* 2. Text Colors */}
                          <h3 className="text-lg font-pixel line-through text-gray-500 dark:text-gray-400">
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm font-pixel">{todo.description}</p>
                          )}
                          {todo.dueDate && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-pixel">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </p>
                          )}
                          {/* 2. Text Colors */}
                          <p className="text-green-500 dark:text-green-300 text-sm font-pixel">
                            Completed on: {new Date(todo.updatedAt || todo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex">
                          {/* 3. Refactor Buttons (Todo Item Action Buttons) */}
                          <button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full"
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
          {/* 2. Refactor Static Backgrounds (Modals) */}
          <div className="bg-white dark:bg-[var(--light-brown-hex)] rounded-lg shadow-pixel p-6 max-w-md w-full border-2 border-transparent dark:border-[var(--beige-hex)]">
            <div className="flex justify-between items-center mb-4">
              {/* 2. Text Colors */}
              <h2 className="text-xl font-pixel text-pixel-purple dark:text-[var(--cream-hex)]">Edit Task</h2>
              <button 
                onClick={() => setEditingTodo(null)}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                {/* 2. Text Colors */}
                <label className="block text-sm font-pixel mb-1 text-gray-700 dark:text-gray-300">Title</label>
                {/* 4. Refactor Inputs */}
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-md font-pixel pixel-input"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                {/* 2. Text Colors */}
                <label className="block text-sm font-pixel mb-1 text-gray-700 dark:text-gray-300">Description (optional)</label>
                {/* 4. Refactor Inputs */}
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-md font-pixel pixel-input"
                  autoComplete="off"
                />
              </div>
              <div>
                {/* 2. Text Colors */}
                <label className="block text-sm font-pixel mb-1 text-gray-700 dark:text-gray-300">Due Date (optional)</label>
                {/* 4. Refactor Inputs */}
                <input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-md font-pixel pixel-input"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                {/* 3. Refactor Buttons (Modal Buttons) */}
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-md shadow-pixel pixel-btn font-pixel text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pixel-button font-pixel text-sm" // Use pixel-button
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
          {/* 2. Refactor Static Backgrounds (Modals) */}
          <div className="bg-white dark:bg-[var(--light-brown-hex)] rounded-lg shadow-pixel p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border-2 border-transparent dark:border-[var(--beige-hex)]">
            <div className="flex justify-between items-center mb-4">
              {/* 2. Text Colors */}
              <h2 className="text-xl font-pixel text-pixel-purple dark:text-[var(--cream-hex)]">Find Friends</h2>
              <button 
                onClick={() => setShowUserList(false)}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              {/* 4. Refactor Inputs */}
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-md font-pixel pixel-input"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            
            {error && (
              // 2. Text Colors
              <div className="text-red-500 dark:text-red-400 mb-4 font-pixel text-sm">{error}</div>
            )}
            
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                // 2. Text Colors
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 font-pixel text-sm">No users found</p>
              ) : (
                filteredUsers.map(user => (
                  // 2. Border colors
                  <div 
                    key={user._id} 
                    className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    {/* 2. Text Colors */}
                    <span className="font-pixel text-sm text-gray-800 dark:text-[var(--cream-hex)]">{user.username}</span>
                    
                    {isCurrentUser(user._id) ? (
                      // 2. Text Colors
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-pixel">You</span>
                    ) : isFriend(user._id) ? (
                      // 2. Text Colors
                      <span className="text-xs text-pixel-green dark:text-[var(--accent-pastel-pink-hex)] font-pixel">Already friends</span>
                    ) : (
                      // 3. Refactor Buttons (Modal Buttons)
                      <button
                        onClick={() => handleAddFriend(user.username)}
                        className="px-2 py-1 bg-pixel-green text-white dark:bg-[var(--accent-pastel-pink-hex)] dark:text-[var(--dark-brown-hex)] rounded-md text-xs font-pixel shadow-pixel pixel-btn flex items-center gap-1"
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