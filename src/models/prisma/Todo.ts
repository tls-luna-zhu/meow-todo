import prisma from '@/lib/prisma';

export async function findTodoById(id: string) {
  return prisma.todo.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
}

export async function findTodoByIdAndUserId(id: string, userId: string) {
  return prisma.todo.findFirst({
    where: {
      id,
      userId,
    },
  });
}

export async function getUserTodos(userId: string) {
  return prisma.todo.findMany({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getTodosForUser(targetUserId: string) {
  return prisma.todo.findMany({
    where: {
      userId: targetUserId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getUserAndFriendsTodos(userId: string, friendIds: string[]) {
  return prisma.todo.findMany({
    where: {
      userId: {
        in: [userId, ...friendIds],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createTodo(data: { 
  title: string; 
  description?: string; 
  dueDate?: Date; 
  userId: string;
}) {
  return prisma.todo.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
}

export async function updateTodo(
  id: string, 
  data: { 
    title?: string; 
    description?: string | null; 
    completed?: boolean; 
    dueDate?: Date | null;
  }
) {
  return prisma.todo.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
}

export async function deleteTodo(id: string) {
  return prisma.todo.delete({
    where: { id },
  });
}