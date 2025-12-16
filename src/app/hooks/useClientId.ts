import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/app/lib/api';

export function useClientId() {
     const { data: session } = useSession();
     const [clientId, setClientId] = useState<string | null>(null);

     useEffect(() => {
          if (session?.user?.email) {
               supabase
                    .from('users')
                    .select('id')
                    .eq('email', session.user.email)
                    .single()
                    .then(({ data }) => {
                         if (data?.id) setClientId(data.id);
                    });
          }
     }, [session?.user?.email]);

     return clientId;
}
