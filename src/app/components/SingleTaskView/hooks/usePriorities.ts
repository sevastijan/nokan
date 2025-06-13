import { useQuery } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { getPriorities } from "@/app/lib/api";
import {
  setPriorities,
  setLoading,
  setError,
} from "@/app/store/slices/prioritiesSlice";
import { Priority } from "@/app/components/SingleTaskView/types";

export const usePriorities = () => {
  const dispatch = useAppDispatch();
  const { priorities, loading, error } = useAppSelector(
    (state) => state.priorities
  );

  const { isLoading, error: queryError } = useQuery<Priority[], Error>({
    queryKey: ["priorities"],
    queryFn: async () => {
      dispatch(setLoading());
      try {
        const data = await getPriorities(); // Zakładamy, że getPriorities zwraca Priority[]
        dispatch(setPriorities(data));
        return data;
      } catch (err: any) {
        dispatch(setError(err.message || "Failed to fetch priorities"));
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return {
    priorities,
    loading: loading || isLoading,
    error: error || queryError?.message,
  };
};
