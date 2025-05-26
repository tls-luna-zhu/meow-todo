import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Todo from '@/models/Todo';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const id = params.id;
  
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    const todo = await Todo.findOne({
      _id: id,
      user: session.user.id,
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // Update only the fields that are provided
    if (updates.completed !== undefined) {
      todo.completed = updates.completed;
    }
    if (updates.title !== undefined) {
      // Ensure title is not empty if provided
      if (updates.title.trim() === '') {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      todo.title = updates.title;
    }
    if (updates.description !== undefined) {
      todo.description = updates.description || ''; // Allow empty string for description
    }
    
    // Handle dueDate update with validation
    if (updates.dueDate !== undefined) {
      if (updates.dueDate === null || updates.dueDate === '') {
        todo.dueDate = null;
      } else if (typeof updates.dueDate === 'string') {
        if (isNaN(new Date(updates.dueDate).getTime())) {
          return NextResponse.json(
            { error: 'Invalid dueDate format. Please use a valid date string.' },
            { status: 400 }
          );
        }
        todo.dueDate = new Date(updates.dueDate);
      } else {
        // If dueDate is provided but not a string, null, or empty string (e.g. a number)
        return NextResponse.json(
          { error: 'Invalid dueDate format. Please use a string, null, or empty string.' },
          { status: 400 }
        );
      }
    }
    
    await todo.save();

    const updatedTodo = await Todo.findById(todo._id).populate('user', 'username');

    return NextResponse.json(updatedTodo);
  } catch (error: any) {
    console.error('Error updating todo:', error.message, { stack: error.stack });
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const id = params.id;
  
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todo = await Todo.findOneAndDelete({
      _id: id,
      user: session.user.id,
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting todo:', error.message, { stack: error.stack });
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}