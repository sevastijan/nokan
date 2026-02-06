import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { getBoardTemplates } from '@/app/lib/api';
import { setTemplates, setLoading, setError } from '@/app/store/slices/templatesSlice';

export const useBoardTemplates = () => {
     const dispatch = useAppDispatch();
     const { templates, loading, error } = useAppSelector((state) => state.templates);

     const { isLoading, error: queryError } = useQuery({
          queryKey: ['boardTemplates'],
          queryFn: async () => {
               dispatch(setLoading());
               try {
                    const data = await getBoardTemplates();
                    dispatch(setTemplates(data));
                    return data;
               } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to fetch board templates';
                    dispatch(setError(message));
                    throw err; // re-throw to let React Query handle the error state
               }
          },
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes
     });

     return {
          templates,
          loading: loading || isLoading,
          error: error || (queryError instanceof Error ? queryError.message : queryError),
     };
};
