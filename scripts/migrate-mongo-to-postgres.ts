import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB models
import MongoUser from '../src/models/User';
import MongoTodo from '../src/models/Todo';

// Initialize Prisma client
const prisma = new PrismaClient();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meow-todo';

async function main() {
  console.log('Starting migration from MongoDB to PostgreSQL...');
  
  // Connect to MongoDB
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  try {
    // Migrate users
    console.log('Migrating users...');
    const mongoUsers = await MongoUser.find({});
    console.log(`Found ${mongoUsers.length} users in MongoDB`);
    
    const userMap = new Map(); // Map MongoDB _id to PostgreSQL id
    
    for (const mongoUser of mongoUsers) {
      const prismaUser = await prisma.user.create({
        data: {
          email: mongoUser.email,
          username: mongoUser.username,
          password: mongoUser.password, // Password is already hashed
          createdAt: mongoUser.createdAt || new Date(),
        },
      });
      
      userMap.set(mongoUser._id.toString(), prismaUser.id);
      console.log(`Migrated user: ${mongoUser.username}`);
    }
    
    // Update user friends
    console.log('Updating user friends...');
    for (const mongoUser of mongoUsers) {
      if (mongoUser.friends && mongoUser.friends.length > 0) {
        const prismaUserId = userMap.get(mongoUser._id.toString());
        const friendIds = mongoUser.friends.map((friendId: mongoose.Types.ObjectId) => 
          userMap.get(friendId.toString())
        ).filter(Boolean);
        
        if (friendIds.length > 0) {
          await prisma.user.update({
            where: { id: prismaUserId },
            data: {
              friends: {
                connect: friendIds.map(id => ({ id })),
              },
            },
          });
          console.log(`Updated friends for user: ${mongoUser.username}`);
        }
      }
    }
    
    // Migrate todos
    console.log('Migrating todos...');
    const mongoTodos = await MongoTodo.find({});
    console.log(`Found ${mongoTodos.length} todos in MongoDB`);
    
    for (const mongoTodo of mongoTodos) {
      const userId = userMap.get(mongoTodo.user.toString());
      
      if (!userId) {
        console.warn(`Skipping todo "${mongoTodo.title}" - user not found`);
        continue;
      }
      
      await prisma.todo.create({
        data: {
          title: mongoTodo.title,
          description: mongoTodo.description || null,
          completed: mongoTodo.completed || false,
          createdAt: mongoTodo.createdAt || new Date(),
          dueDate: mongoTodo.dueDate || null,
          userId,
        },
      });
      
      console.log(`Migrated todo: ${mongoTodo.title}`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await prisma.$disconnect();
    await mongoose.disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });