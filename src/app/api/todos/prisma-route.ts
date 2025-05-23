import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/prisma-options';
import { findUserById } from '@/models/prisma/User';
import { getUserAndFriendsTodos, createTodo } from '@/models/prisma/Todo';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user and their friends
    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const friendIds = user.friends ? user.friends.map(friend => friend.id) : [];

    // Get todos from the current user and their friends
    const todos = await getUserAndFriendsTodos(session.user.id, friendIds);

    return NextResponse.json(todos);
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

    const todo = await createTodo({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: session.user.id,
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}