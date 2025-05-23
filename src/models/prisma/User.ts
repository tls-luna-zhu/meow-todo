import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      User_A: true,
      User_B: true,
    },
  });

  if (!user) return null;

  // Combine User_A and User_B to get all friends
  const friends = [...user.User_A, ...user.User_B];
  
  return {
    ...user,
    friends,
  };
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
      User_A: true,
      User_B: true,
    },
  });
  
  if (!user) return [];
  
  // Combine User_A and User_B to get all friends
  return [...user.User_A, ...user.User_B];
}

export async function addFriend(userId: string, friendId: string) {
  // Connect users in the UserFriends relation
  await prisma.user.update({
    where: { id: userId },
    data: {
      User_A: {
        connect: { id: friendId },
      },
    },
  });

  // Return the updated user with friends
  return findUserById(userId);
}

export async function removeFriend(userId: string, friendId: string) {
  // Disconnect from User_A relation
  await prisma.user.update({
    where: { id: userId },
    data: {
      User_A: {
        disconnect: { id: friendId },
      },
    },
  });

  // Disconnect from User_B relation
  await prisma.user.update({
    where: { id: userId },
    data: {
      User_B: {
        disconnect: { id: friendId },
      },
    },
  });

  // Return the updated user with friends
  return findUserById(userId);
}