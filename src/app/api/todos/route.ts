import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Todo from '@/models/Todo';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the current user and their friends
    const user = await User.findById(session.user.id).populate('friends');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const friendIds = user.friends ? user.friends.map((friend: any) => friend._id) : [];

    // Get todos from the current user and their friends
    const todos = await Todo.find({
      user: { $in: [session.user.id, ...friendIds] }
    }).populate('user', 'username').sort({ createdAt: -1 });

    return NextResponse.json(todos);
  } catch (error: any) {
    console.error('Error fetching todos:', error.message, { stack: error.stack });
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, dueDate } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const todoData: any = {
      title,
      description,
      user: session.user.id,
    };

    if (dueDate) {
      if (isNaN(new Date(dueDate).getTime())) {
        return NextResponse.json(
          { error: 'Invalid dueDate format. Please use a valid date string.' },
          { status: 400 }
        );
      }
      todoData.dueDate = new Date(dueDate);
    } else if (dueDate === '' || dueDate === null) {
      // Allow explicitly setting dueDate to null or unsetting it
      todoData.dueDate = null; 
    }


    await connectDB();

    const todo = await Todo.create(todoData);

    const populatedTodo = await Todo.findById(todo._id).populate('user', 'username');

    return NextResponse.json(populatedTodo, { status: 201 });
  } catch (error: any) {
    console.error('Error creating todo:', error.message, { stack: error.stack });
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
} 