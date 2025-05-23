# MongoDB to PostgreSQL (Neon) Migration Guide

This guide explains how to migrate the Meow Todo application from MongoDB to PostgreSQL using Neon.

## Prerequisites

- Node.js and npm installed
- Access to your MongoDB database
- A Neon PostgreSQL database (sign up at https://neon.tech if you don't have one)

## Step 1: Set Up Neon PostgreSQL

1. Create a Neon account at https://neon.tech
2. Create a new project
3. Create a new database named `meow-todo`
4. Get your connection string from the Neon dashboard

## Step 2: Update Environment Variables

Update your `.env` file with the Neon PostgreSQL connection string:

```
# Replace with your actual Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@your-neon-db-host.neon.tech/meow-todo?sslmode=require"

# NextAuth Secret
NEXTAUTH_SECRET="your-secret-key-here"

# MongoDB URI (kept for reference during migration)
MONGODB_URI="your-mongodb-connection-string"
```

## Step 3: Generate Prisma Client

Run the following command to generate the Prisma client:

```bash
npm run prisma:generate
```

## Step 4: Create Database Schema

Run the following command to create the database schema in PostgreSQL:

```bash
npm run prisma:migrate
```

## Step 5: Migrate Data

Run the migration script to transfer data from MongoDB to PostgreSQL:

```bash
npm run migrate
```

## Step 6: Switch to PostgreSQL

After successful migration, update your application to use the new Prisma models:

### Option 1: Use the Automated Script (Recommended)

Run the following command to automatically switch all API routes to use PostgreSQL:

```bash
npm run use:postgres
# or
yarn use:postgres
```

This script will:
- Replace MongoDB auth options with Prisma auth options
- Replace MongoDB API routes with Prisma API routes
- Keep backups of the MongoDB files for reference

### Option 2: Manual Update

If you prefer to manually update the files:

1. Replace imports from MongoDB models with Prisma models:
   - Replace `import User from '@/models/User'` with imports from `@/models/prisma/User`
   - Replace `import Todo from '@/models/Todo'` with imports from `@/models/prisma/Todo`

2. Update API routes:
   - Replace MongoDB API routes with the Prisma versions
   - Update NextAuth options to use Prisma

3. Remove MongoDB connection code:
   - You can remove or comment out the MongoDB connection code in `src/lib/db.ts`

## Step 7: Test the Application

Test all functionality to ensure the migration was successful:

1. User registration and login
2. Creating, updating, and deleting todos
3. Friend relationships
4. Any other application-specific features

## Step 8: Deploy to Vercel

The application is configured for easy deployment to Vercel:

1. Push your code to GitHub (or another Git provider supported by Vercel)

2. Connect your repository in Vercel and deploy it

3. Set these environment variables in Vercel:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET`: A secure random string for NextAuth.js
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., https://your-app.vercel.app)

The package.json includes these scripts for Vercel deployment:
```json
"postinstall": "prisma generate",
"vercel-build": "prisma migrate deploy && next build"
```

These scripts will automatically:
1. Generate the Prisma client during installation
2. Run database migrations during the build process
3. Build the Next.js application

## Troubleshooting

- If you encounter any issues with the migration script, check the error messages and ensure your MongoDB connection is working.
- If the Prisma schema doesn't match your data model, update the schema in `prisma/schema.prisma` and run `npm run prisma:migrate` again.
- For authentication issues, check that the NextAuth configuration is correctly using the Prisma models.

## Rollback Plan

If you need to roll back to MongoDB:

### Option 1: Use the Automated Script (Recommended)

Run the following command to automatically switch back to MongoDB:

```bash
npm run use:mongodb
# or
yarn use:mongodb
```

This script will restore all the MongoDB API routes from the backups created during the switch to PostgreSQL.

### Option 2: Manual Rollback

1. Keep your MongoDB database intact during testing
2. Revert code changes that switched to Prisma
3. Update your environment variables to use MongoDB again