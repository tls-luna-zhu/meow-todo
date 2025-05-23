#!/bin/bash

# Script to switch from PostgreSQL back to MongoDB implementation

echo "Switching back to MongoDB implementation..."

# Replace Prisma auth options with MongoDB auth options
if [ -f "src/app/api/auth/[...nextauth]/options.ts" ] && [ -f "src/app/api/auth/[...nextauth]/mongodb-options.ts" ]; then
  mv src/app/api/auth/[...nextauth]/options.ts src/app/api/auth/[...nextauth]/prisma-options.ts
  cp src/app/api/auth/[...nextauth]/mongodb-options.ts src/app/api/auth/[...nextauth]/options.ts
  echo "✅ Updated NextAuth options"
fi

# Replace Prisma todos API with MongoDB todos API
if [ -f "src/app/api/todos/route.ts" ] && [ -f "src/app/api/todos/mongodb-route.ts" ]; then
  mv src/app/api/todos/route.ts src/app/api/todos/prisma-route.ts
  cp src/app/api/todos/mongodb-route.ts src/app/api/todos/route.ts
  echo "✅ Updated todos API route"
fi

# Replace Prisma todo ID API with MongoDB todo ID API
if [ -f "src/app/api/todos/[id]/route.ts" ] && [ -f "src/app/api/todos/[id]/mongodb-route.ts" ]; then
  mv src/app/api/todos/[id]/route.ts src/app/api/todos/[id]/prisma-route.ts
  cp src/app/api/todos/[id]/mongodb-route.ts src/app/api/todos/[id]/route.ts
  echo "✅ Updated todo ID API route"
fi

# Replace Prisma signup API with MongoDB signup API
if [ -f "src/app/api/auth/signup/route.ts" ] && [ -f "src/app/api/auth/signup/mongodb-route.ts" ]; then
  mv src/app/api/auth/signup/route.ts src/app/api/auth/signup/prisma-route.ts
  cp src/app/api/auth/signup/mongodb-route.ts src/app/api/auth/signup/route.ts
  echo "✅ Updated signup API route"
fi

# Replace Prisma friends API with MongoDB friends API
if [ -f "src/app/api/friends/route.ts" ] && [ -f "src/app/api/friends/mongodb-route.ts" ]; then
  mv src/app/api/friends/route.ts src/app/api/friends/prisma-route.ts
  cp src/app/api/friends/mongodb-route.ts src/app/api/friends/route.ts
  echo "✅ Updated friends API route"
fi

echo "Migration back to MongoDB completed!"
echo "Make sure to update your .env file with the correct MONGODB_URI for your MongoDB database."