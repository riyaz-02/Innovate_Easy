import NextAuth from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '../../../lib/supabaseClient';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials?.email || '',
          password: credentials?.password || '',
        });
        if (error || !data.user) return null;
        return { id: data.user.id, email: data.user.email, name: data.user.user_metadata.name };
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }),
  pages: {
    signIn: '/login',
    signOut: '/logout',
  },
  session: { strategy: 'jwt' as 'jwt' },
};

export default NextAuth(authOptions);