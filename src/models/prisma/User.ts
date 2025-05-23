import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      friends: true,
    },
  });
}

export async function createUser(data: { username: string; email: string; password: string }) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
      },
    });
    
    console.log('User created successfully:', user.id);
    return user;
  } catch (error) {
    console.error('Error creating user in Prisma:', error);
    throw error;
  }
}

export async function validatePassword(user: { password: string }, inputPassword: string) {
  return bcrypt.compare(inputPassword, user.password);
}

export async function getUserFriends(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      friends: true,
    },
  });
  
  return user?.friends || [];
}

export async function addFriend(userId: string, friendId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      friends: {
        connect: { id: friendId },
      },
    },
    include: {
      friends: true,
    },
  });
}

export async function removeFriend(userId: string, friendId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      friends: {
        disconnect: { id: friendId },
      },
    },
    include: {
      friends: true,
    },
  });
}