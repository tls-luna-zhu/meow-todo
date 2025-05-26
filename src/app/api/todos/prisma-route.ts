import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { findUserById } from '@/models/prisma/User';
import { getTodosForUser, createTodo } from '@/models/prisma/Todo'; // Removed getUserAndFriendsTodos

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get('userId');

    let todos;

    if (requestedUserId) {
      // If a specific userId is requested, check authorization
      if (requestedUserId !== currentUserId) {
        const user = await findUserById(currentUserId);
        if (!user) {
          return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
        }
        const friendIds = user.friends ? user.friends.map(friend => friend.id) : [];
        if (!friendIds.includes(requestedUserId)) {
          return NextResponse.json({ error: 'Unauthorized to view these tasks' }, { status: 403 });
        }
      }
      // If authorized (either self or a friend)
      todos = await getTodosForUser(requestedUserId);
    } else {
      // If no specific userId is requested, fetch tasks for the current user only
      todos = await getTodosForUser(currentUserId);
    }

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