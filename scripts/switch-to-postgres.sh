#!/bin/bash

# Script to switch from MongoDB to PostgreSQL implementation

echo "Switching to PostgreSQL implementation..."

# Replace MongoDB auth options with Prisma auth options
if [ -f "src/app/api/auth/[...nextauth]/options.ts" ] && [ -f "src/app/api/auth/[...nextauth]/prisma-options.ts" ]; then
  mv src/app/api/auth/[...nextauth]/options.ts src/app/api/auth/[...nextauth]/mongodb-options.ts
  cp src/app/api/auth/[...nextauth]/prisma-options.ts src/app/api/auth/[...nextauth]/options.ts
  echo "✅ Updated NextAuth options"
fi

# Replace MongoDB todos API with Prisma todos API
if [ -f "src/app/api/todos/route.ts" ] && [ -f "src/app/api/todos/prisma-route.ts" ]; then
  mv src/app/api/todos/route.ts src/app/api/todos/mongodb-route.ts
  cp src/app/api/todos/prisma-route.ts src/app/api/todos/route.ts
  echo "✅ Updated todos API route"
fi

# Replace MongoDB todo ID API with Prisma todo ID API
if [ -f "src/app/api/todos/[id]/route.ts" ] && [ -f "src/app/api/todos/[id]/prisma-route.ts" ]; then
  mv src/app/api/todos/[id]/route.ts src/app/api/todos/[id]/mongodb-route.ts
  cp src/app/api/todos/[id]/prisma-route.ts src/app/api/todos/[id]/route.ts
  echo "✅ Updated todo ID API route"
fi

# Replace MongoDB signup API with Prisma signup API
if [ -f "src/app/api/auth/signup/route.ts" ] && [ -f "src/app/api/auth/signup/prisma-route.ts" ]; then
  mv src/app/api/auth/signup/route.ts src/app/api/auth/signup/mongodb-route.ts
  cp src/app/api/auth/signup/prisma-route.ts src/app/api/auth/signup/route.ts
  echo "✅ Updated signup API route"
fi

# Replace MongoDB friends API with Prisma friends API
if [ -f "src/app/api/friends/route.ts" ] && [ -f "src/app/api/friends/prisma-route.ts" ]; then
  mv src/app/api/friends/route.ts src/app/api/friends/mongodb-route.ts
  cp src/app/api/friends/prisma-route.ts src/app/api/friends/route.ts
  echo "✅ Updated friends API route"
fi

# Ensure .env and .env.local have the correct DATABASE_URL
if [ -f ".env" ]; then
  # Check if DATABASE_URL is already set to PostgreSQL
  if ! grep -q "postgresql://" .env; then
    echo 'DATABASE_URL="postgresql://neondb_owner:npg_sk1dUfvE2qNC@ep-blue-sun-a1zkzapv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"' > .env
    echo "✅ Updated .env with PostgreSQL connection string"
  fi
fi

if [ -f ".env.local" ]; then
  # Check if DATABASE_URL is already set to PostgreSQL
  if ! grep -q "postgresql://" .env.local; then
    echo 'DATABASE_URL="postgresql://neondb_owner:npg_sk1dUfvE2qNC@ep-blue-sun-a1zkzapv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"' > .env.local
    echo "✅ Updated .env.local with PostgreSQL connection string"
  fi
fi

# Generate Prisma client
npx prisma generate

echo "Migration to PostgreSQL completed!"
echo "Database URL has been set to use Neon PostgreSQL."
echo "If you need to migrate data from MongoDB, run 'npm run migrate'."