import nextAuth from 'next-auth/next';
import { authOptions } from '@/auth';

const handler = nextAuth(authOptions);

export { handler as GET, handler as POST };
