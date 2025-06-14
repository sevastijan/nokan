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
      } catch (err: any) {
        dispatch(setError(err.message || 'Failed to fetch board templates'));
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Data is kept in cache for 10 minutes before garbage collection
  });

  return {
    templates,
    loading: loading || isLoading,
    error: error || queryError?.message,
  };
};