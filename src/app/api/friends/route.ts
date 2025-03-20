import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the friend to add
    const friend = await User.findOne({ username });
    if (!friend) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the current user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Check if they're already friends
    if (user.friends.includes(friend._id)) {
      return NextResponse.json(
        { error: 'Already friends with this user' },
        { status: 400 }
      );
    }

    // Add friend to both users
    user.friends.push(friend._id);
    friend.friends.push(user._id);

    await Promise.all([user.save(), friend.save()]);

    return NextResponse.json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json(
      { error: 'Failed to add friend' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .populate('friends', 'username');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user.friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const friendId = url.searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the current user and the friend
    const user = await User.findById(session.user.id);
    const friend = await User.findById(friendId);

    if (!user) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    if (!friend) {
      return NextResponse.json(
        { error: 'Friend not found' },
        { status: 404 }
      );
    }

    // Remove from each other's friends list
    user.friends = user.friends.filter((id: mongoose.Types.ObjectId) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id: mongoose.Types.ObjectId) => id.toString() !== session.user.id);

    await Promise.all([user.save(), friend.save()]);

    return NextResponse.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
} 