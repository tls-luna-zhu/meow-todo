'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiCheck, FiUserPlus, FiLogOut, FiUsers, FiX } from 'react-icons/fi';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTodos();
      fetchFriends();
    }
  }, [status, router]);

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
    } catch (error) {
      setError('Failed to fetch todos');
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Error fetching friends:', error);
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      setError('Failed to delete todo');
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
    } catch (error) {
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
    } catch (error) {
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
      <div className="min-h-screen bg-pixel-pink flex items-center justify-center">
        <div className="text-2xl font-pixel text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pixel-pink p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-pixel p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-pixel text-pixel-purple">My MeowTODO List</h1>
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

          <div className="flex gap-4 mb-6 justify-between items-center">
            <h2 className="text-xl font-pixel text-pixel-green">Friends</h2>
            <button
              onClick={handleOpenUserList}
              className="px-4 py-2 bg-pixel-green text-white rounded-md shadow-pixel pixel-btn flex items-center gap-2 font-pixel text-sm"
            >
              <FiUsers /> Find Friends
            </button>
          </div>

          {/* Current Friends List */}
          <div className="mb-6 space-y-2">
            {friends.length === 0 ? (
              <p className="text-gray-500 font-pixel text-sm">You haven't added any friends yet.</p>
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

          <div className="space-y-4">
            {todos.length === 0 ? (
              <p className="text-gray-500 font-pixel text-center py-6">No todos yet. Add one above!</p>
            ) : (
              todos.map((todo) => (
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
                    <p className="text-gray-400 text-sm font-pixel">
                      By: <span className="font-pixel">{todo.user.username}</span>
                    </p>
                  </div>
                  {todo.user._id === session?.user?.id && (
                    <button
                      onClick={() => handleDeleteTodo(todo._id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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