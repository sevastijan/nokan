import { useSession } from 'next-auth/react';
import { useCurrentUser } from './useCurrentUser';

export const useDisplayUser = () => {
     const { data: session } = useSession();
     const { currentUser } = useCurrentUser();

     // Priority for avatar: custom_image > image (from Google)
     const displayAvatar = currentUser?.custom_image || currentUser?.image || session?.user?.image || '';

     // Priority for name: custom_name > name (from Google)
     const displayName = currentUser?.custom_name || currentUser?.name || session?.user?.name || 'User';

     const email = currentUser?.email || session?.user?.email || '';

     return {
          displayAvatar,
          displayName,
          email,
          currentUser,
          session,
     };
};
