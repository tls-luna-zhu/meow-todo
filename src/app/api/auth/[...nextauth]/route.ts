import NextAuth from 'next-auth';
import { authOptions } from './options';

// Create and export the auth handler
const handler = NextAuth(authOptions);

// Only export the route handlers
export { handler as GET, handler as POST }; 