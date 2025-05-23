import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/options';

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

    // Find the friend to add
    const friend = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!friend) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { User_A: true, User_B: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Check if they're already friends
    const alreadyFriends = [...user.User_A, ...user.User_B].some(f => f.id === friend.id);
    if (alreadyFriends) {
      return NextResponse.json(
        { error: 'Already friends with this user' },
        { status: 400 }
      );
    }

    // Add friend to both users using Prisma's connect
    await prisma.user.update({
      where: { id: user.id },
      data: {
        User_A: {
          connect: { id: friend.id }
        }
      }
    });

    await prisma.user.update({
      where: { id: friend.id },
      data: {
        User_B: {
          connect: { id: user.id }
        }
      }
    });

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        User_A: {
          select: {
            id: true,
            username: true
          }
        },
        User_B: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Combine both friend lists
    const friends = [...user.User_A, ...user.User_B];
    return NextResponse.json(friends);
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

    // Get the current user and the friend
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    const friend = await prisma.user.findUnique({
      where: { id: friendId }
    });

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

    // Remove from each other's friends list using Prisma's disconnect
    await prisma.user.update({
      where: { id: user.id },
      data: {
        User_A: {
          disconnect: { id: friend.id }
        },
        User_B: {
          disconnect: { id: friend.id }
        }
      }
    });

    await prisma.user.update({
      where: { id: friend.id },
      data: {
        User_A: {
          disconnect: { id: user.id }
        },
        User_B: {
          disconnect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}