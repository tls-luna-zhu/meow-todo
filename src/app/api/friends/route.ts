import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';

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