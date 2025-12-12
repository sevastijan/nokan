import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { Session } from 'next-auth';
import { User } from '@/app/types/globalTypes';
import { UserRole } from '../apiSlice';

const VALID_ROLES: UserRole[] = ['OWNER', 'PROJECT_MANAGER', 'MEMBER', 'CLIENT'];
const DEFAULT_ROLE: UserRole = 'MEMBER';

const isValidUserRole = (role: unknown): role is UserRole => {
     return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
};

export const userEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     getCurrentUser: builder.query<User, Session>({
          async queryFn(session) {
               try {
                    const email = session.user?.email?.trim();

                    if (!email) {
                         return {
                              error: {
                                   status: 'VALIDATION_ERROR',
                                   error: 'Email address is required in session',
                              },
                         };
                    }

                    const { data: existingUser, error: fetchError } = await getSupabase().from('users').select('*').eq('email', email).maybeSingle();

                    if (fetchError) {
                         throw new Error(`Failed to fetch user: ${fetchError.message}`);
                    }

                    if (existingUser) {
                         return { data: existingUser as User };
                    }

                    const { data: createdUser, error: createError } = await getSupabase()
                         .from('users')
                         .insert({
                              email,
                              name: session.user?.name?.trim() || null,
                              image: session.user?.image?.trim() || null,
                         })
                         .select('*')
                         .single();

                    if (createError) {
                         throw new Error(`Failed to create user: ${createError.message}`);
                    }

                    if (!createdUser) {
                         throw new Error('User creation returned no data');
                    }

                    return { data: createdUser as User };
               } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    console.error('[getCurrentUser] Error:', errorMessage);

                    return {
                         error: {
                              status: 'FETCH_ERROR',
                              error: errorMessage,
                         },
                    };
               }
          },
          providesTags: (_result, _error, session) => {
               const email = session?.user?.email;
               return email ? [{ type: 'UserRole', id: email }] : [];
          },
     }),

     getUserRole: builder.query<UserRole, string>({
          async queryFn(email) {
               try {
                    const trimmedEmail = email?.trim();

                    if (!trimmedEmail) {
                         console.warn('[getUserRole] No email provided, returning default role');
                         return { data: DEFAULT_ROLE };
                    }

                    const { data, error } = await getSupabase().from('users').select('role').eq('email', trimmedEmail).maybeSingle();

                    if (error) {
                         console.error('[getUserRole] Database error:', error.message);
                         return { data: DEFAULT_ROLE };
                    }

                    if (!data) {
                         console.warn('[getUserRole] User not found, returning default role');
                         return { data: DEFAULT_ROLE };
                    }

                    const role = data.role;

                    if (!isValidUserRole(role)) {
                         console.warn(`[getUserRole] Invalid role "${role}" for ${trimmedEmail}, returning default`);
                         return { data: DEFAULT_ROLE };
                    }

                    return { data: role };
               } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('[getUserRole] Unexpected error:', errorMessage);
                    return { data: DEFAULT_ROLE };
               }
          },
          providesTags: (_result, _error, email) => {
               const trimmedEmail = email?.trim();
               return trimmedEmail ? [{ type: 'UserRole', id: trimmedEmail }] : [];
          },
     }),

     getAllUsers: builder.query<User[], void>({
          async queryFn() {
               try {
                    const { data, error } = await getSupabase().from('users').select('id, name, email, image');

                    if (error) throw error;

                    const users: User[] = (data || []).map((u) => ({
                         id: u.id,
                         name: u.name,
                         email: u.email,
                         image: u.image || undefined,
                    }));

                    return { data: users };
               } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    console.error('[getAllUsers] Error:', message);
                    return { error: { status: 'FETCH_ERROR', error: message } };
               }
          },
          providesTags: (result) => (result ? [...result.map((user) => ({ type: 'User' as const, id: user.id })), { type: 'User' as const, id: 'LIST' }] : [{ type: 'User' as const, id: 'LIST' }]),
     }),

     setUserRole: builder.mutation<void, { userId: string; role: UserRole }>({
          async queryFn({ userId, role }) {
               if (!isValidUserRole(role)) {
                    return { error: { status: 'VALIDATION_ERROR', error: `Invalid role: ${role}` } };
               }

               try {
                    const { error } = await getSupabase().from('users').update({ role }).eq('id', userId);
                    if (error) throw error;
                    return { data: undefined };
               } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    console.error('[setUserRole] Error:', message);
                    return { error: { status: 'UPDATE_ERROR', error: message } };
               }
          },
          invalidatesTags: [{ type: 'User' as const, id: 'LIST' }],
     }),
});
