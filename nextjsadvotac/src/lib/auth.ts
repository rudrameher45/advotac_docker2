import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('🔐 Google Login Success:', {
        email: user.email,
        name: user.name,
        image: user.image,
        provider: account?.provider
      });
      console.log('✅ User data will be saved in JWT session');
      return true;
    },
    async session({ session, token }) {
      // Add all user data to session
      if (session.user) {
        session.user.id = token.sub!;
        session.user.email = token.email!;
        session.user.name = token.name!;
        session.user.image = token.picture!;
      }
      console.log('📦 Session created with user data:', session.user);
      return session;
    },
    async jwt({ token, user, account }) {
      // Save user data to JWT token on first sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.provider = account?.provider || 'google';
        console.log('💾 User data saved to JWT token:', {
          email: token.email,
          name: token.name,
          provider: token.provider
        });
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl + '/dashboard';
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode to see logs
};
