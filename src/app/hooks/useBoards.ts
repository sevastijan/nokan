import { useMemo } from "react";
import { useGetBoardUsersQuery } from "@/app/store/apiSlice";
import { Board } from "@/app/types/globalTypes";

export const useBoards = (userEmail: string | null) => {
  const skip = !userEmail;
  const {
    data: boards = [],
    isLoading: loading,
    refetch: refetchBoards,
  } = useGetBoardUsersQuery(userEmail ?? "", { skip });

  const selectedBoardId = useMemo(() => boards[0]?.id ?? "", [boards]);

  return {
    boards,
    selectedBoardId,
    loading,
    refetchBoards,
  };
};
