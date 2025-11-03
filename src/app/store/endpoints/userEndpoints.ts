import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { supabase } from '@/app/lib/supabase';
import { Session } from 'next-auth';
import { User } from '@/app/types/globalTypes';

export type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER';

export const userEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getCurrentUser: builder.query<User, Session>({
          async queryFn(session) {
               try {
                    const email = session.user?.email || '';
                    if (!email) {
                         throw new Error('No email in session');
                    }
                    const { data: existing, error: fetchErr } = await supabase.from('users').select('*').eq('email', email).single();
                    if (fetchErr && !fetchErr.message?.includes('No rows')) {
                         throw fetchErr;
                    }
                    if (existing) {
                         return { data: existing };
                    }
                    const { data: created, error: createErr } = await supabase
                         .from('users')
                         .insert({
                              email,
                              name: session.user?.name,
                              image: session.user?.image,
                         })
                         .select('*')
                         .single();
                    if (createErr || !created) {
                         throw createErr || new Error('Failed to create user row');
                    }
                    return { data: created };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getCurrentUser] error:', error);
                    return {
                         error: { status: 'CUSTOM_ERROR', error: error.message },
                    };
               }
          },
          providesTags: (_result, _error, session) => (session?.user?.email ? [{ type: 'UserRole', id: session.user.email }] : []),
     }),

     getUserRole: builder.query<UserRole, string>({
          async queryFn(email) {
               try {
                    const { data, error } = await supabase.from('users').select('role').eq('email', email).single();
                    if (error) {
                         return { data: 'MEMBER' };
                    }
                    const role = data?.role as UserRole | null;
                    return {
                         data: role === 'OWNER' || role === 'PROJECT_MANAGER' ? role : 'MEMBER',
                    };
               } catch (err) {
                    const error = err as Error;
                    console.error('[apiSlice.getUserRole] error:', error);
                    return { error: { status: 'CUSTOM_ERROR', error: error.message } };
               }
          },
          providesTags: (_result, _error, email) => [{ type: 'UserRole', id: email }],
     }),
});
