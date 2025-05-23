#!/bin/bash

# Script to switch from PostgreSQL to SQLite for local development

echo "Switching to SQLite for local development..."

# Update Prisma schema to use SQLite
sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
sed -i 's/url      = env("DATABASE_URL")/url      = "file:\.\/dev.db"/' prisma/schema.prisma

echo "✅ Updated Prisma schema to use SQLite"

# Generate Prisma client
npx prisma generate

echo "Migration to SQLite completed!"
echo "You can now run 'npm run dev' to start the development server."