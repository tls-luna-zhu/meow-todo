import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Todo from '@/models/Todo';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    const todo = await Todo.findOne({
      _id: params.id,
      user: session.user.id,
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // Update only the fields that are provided
    if (updates.completed !== undefined) todo.completed = updates.completed;
    if (updates.title) todo.title = updates.title;
    if (updates.description !== undefined) todo.description = updates.description;
    if (updates.dueDate !== undefined) todo.dueDate = updates.dueDate;
    
    await todo.save();

    const updatedTodo = await Todo.findById(todo._id).populate('user', 'username');

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todo = await Todo.findOneAndDelete({
      _id: params.id,
      user: session.user.id,
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}