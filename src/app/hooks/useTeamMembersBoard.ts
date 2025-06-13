import { useGetTeamMembersByBoardIdQuery } from "@/app/store/apiSlice";
import { TeamMember } from "@/app/types/globalTypes";

interface UseTeamMembersForBoardResult {
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
}

export const useTeamMembersForBoard = (
  boardId: string | null
): UseTeamMembersForBoardResult => {
  const {
    data: teamMembers = [],
    isFetching,
    error: queryError,
  } = useGetTeamMembersByBoardIdQuery(boardId ?? "", {
    skip: !boardId,
  });

  return {
    teamMembers,
    loading: isFetching,
    error: queryError ? (queryError as Error).message : null,
  };
};
