import { withAuth } from 'next-auth/middleware';

export default withAuth({
     pages: {
          signIn: '/api/auth/signin',
     },
});

export const config = {
     matcher: [
          '/dashboard/:path*',
          '/board/:path*',
          '/calendar/:path*',
          '/chat/:path*',
          '/profile/:path*',
          '/team-management/:path*',
          '/submissions/:path*',
     ],
};
