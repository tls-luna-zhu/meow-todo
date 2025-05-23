import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Todo from '@/models/Todo';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit to 10
    const skip = (page - 1) * limit;

    // Get the current user and their friends
    const user = await User.findById(session.user.id).populate('friends');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const friendIds = user.friends ? user.friends.map((friend: any) => friend._id) : [];
    const userAndFriendIds = [session.user.id, ...friendIds];

    // Get todos from the current user and their friends with pagination
    const todos = await Todo.find({
      user: { $in: userAndFriendIds }
    })
    .populate('user', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count for pagination
    const totalCount = await Todo.countDocuments({
      user: { $in: userAndFriendIds }
    });

    return NextResponse.json({
      todos,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
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

    await connectDB();

    const todo = await Todo.create({
      title,
      description,
      dueDate,
      user: session.user.id,
    });

    const populatedTodo = await Todo.findById(todo._id).populate('user', 'username');

    return NextResponse.json(populatedTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
} 