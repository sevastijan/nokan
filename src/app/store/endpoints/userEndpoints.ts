import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
// import { Session } from 'next-auth';
import { User } from '@/app/types/globalTypes';
import { UserRole } from '../apiSlice';

const VALID_ROLES: UserRole[] = ['OWNER', 'PROJECT_MANAGER', 'MEMBER', 'CLIENT'];
const DEFAULT_ROLE: UserRole = 'MEMBER';

/**
 * Type guard to validate if a value is a valid UserRole
 * @param role - The role to validate
 * @returns True if the role is valid
 */
const isValidUserRole = (role: unknown): role is UserRole => {
     return typeof role === 'string' && VALID_ROLES.includes(role as UserRole);
};

export const userEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
     /**
      * Gets or creates the current user from the session
      * @param session - Next-auth session object
      * @returns User object with all fields including custom_name and custom_image
      */
     getCurrentUser: builder.query<User, { user?: { id?: string; email?: string | null; name?: string | null; image?: string | null } }>({
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

                    // Try to fetch existing user
                    const { data: existingUser, error: fetchError } = await getSupabase().from('users').select('*').eq('email', email).maybeSingle();

                    if (fetchError) {
                         throw new Error(`Failed to fetch user: ${fetchError.message}`);
                    }

                    if (existingUser) {
                         return { data: existingUser as User };
                    }

                    // Create new user if doesn't exist
                    const { data: createdUser, error: createError } = await getSupabase()
                         .from('users')
                         .insert({
                              email,
                              google_id: session.user?.id || null,
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
               return email ? [{ type: 'UserRole', id: email }, 'CurrentUser'] : ['CurrentUser'];
          },
     }),

     /**
      * Gets the role of a user by their email
      * @param email - User's email address
      * @returns UserRole enum value
      */
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

     /**
      * Gets all users in the system
      * @returns Array of User objects
      */
     getAllUsers: builder.query<User[], void>({
          async queryFn() {
               try {
                    const { data, error } = await getSupabase().from('users').select('id, name, email, image, custom_name, custom_image, role');

                    if (error) throw error;

                    const users: User[] = (data || []).map((u) => ({
                         id: u.id,
                         name: u.name,
                         email: u.email,
                         image: u.image || undefined,
                         custom_name: u.custom_name || undefined,
                         custom_image: u.custom_image || undefined,
                         role: isValidUserRole(u.role) ? u.role : undefined,
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

     /**
      * Updates a user's role
      * @param userId - The user's ID
      * @param role - The new role to assign
      */
     setUserRole: builder.mutation<null, { userId: string; role: UserRole }>({
          async queryFn({ userId, role }) {
               if (!isValidUserRole(role)) {
                    return { error: { status: 'VALIDATION_ERROR', error: `Invalid role: ${role}` } };
               }

               try {
                    const { error } = await getSupabase().from('users').update({ role }).eq('id', userId);

                    if (error) throw error;
                    return { data: null };
               } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    console.error('[setUserRole] Error:', message);
                    return { error: { status: 'UPDATE_ERROR', error: message } };
               }
          },
          invalidatesTags: [{ type: 'User' as const, id: 'LIST' }],
     }),

     /**
      * Updates user's custom name and/or custom avatar
      * Custom values take priority over OAuth values in the UI
      * @param userId - The user's ID
      * @param updates - Object containing custom_name and/or custom_image
      * @returns Updated User object
      */
     updateUser: builder.mutation<User, { userId: string; updates: { custom_name?: string | null; custom_image?: string | null } }>({
          async queryFn({ userId, updates }) {
               try {
                    // Validate that at least one field is being updated
                    if (updates.custom_name === undefined && updates.custom_image === undefined) {
                         return {
                              error: {
                                   status: 'VALIDATION_ERROR',
                                   error: 'At least one field must be provided for update',
                              },
                         };
                    }

                    // Prepare the update object with only non-undefined fields
                    const updateData: { custom_name?: string | null; custom_image?: string | null } = {};

                    if (updates.custom_name !== undefined) {
                         const trimmed = updates.custom_name?.trim();
                         updateData.custom_name = trimmed || null;
                    }

                    if (updates.custom_image !== undefined) {
                         updateData.custom_image = updates.custom_image || null;
                    }

                    const { data, error } = await getSupabase().from('users').update(updateData).eq('id', userId).select('*').single();

                    if (error) {
                         throw new Error(`Failed to update user: ${error.message}`);
                    }

                    if (!data) {
                         throw new Error('Update returned no data');
                    }

                    return { data: data as User };
               } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('[updateUser] Error:', errorMessage);

                    return {
                         error: {
                              status: 'UPDATE_ERROR',
                              error: errorMessage,
                         },
                    };
               }
          },
          invalidatesTags: (result, error, { userId }) => [
               { type: 'User', id: userId },
               { type: 'User', id: 'LIST' },
               'CurrentUser', // Invalidate getCurrentUser to refresh the cache
          ],
     }),
});
