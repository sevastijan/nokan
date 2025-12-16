import { useGetTeamMembersByBoardIdQuery } from '@/app/store/apiSlice';
import { User } from '@/app/types/globalTypes';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

interface UseTeamMembersForBoardResult {
     teamMembers: User[];
     loading: boolean;
     error: string | null;
}

// Helper function do sprawdzania czy to FetchBaseQueryError
function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
     return typeof error === 'object' && error !== null && 'status' in error;
}

function hasMessage(data: unknown): data is { message: string } {
     return typeof data === 'object' && data !== null && !Array.isArray(data) && 'message' in data && typeof (data as Record<string, unknown>).message === 'string';
}

export const useTeamMembersForBoard = (boardId: string | null): UseTeamMembersForBoardResult => {
     const {
          data: teamMembers = [],
          isFetching,
          error,
     } = useGetTeamMembersByBoardIdQuery(boardId ?? '', {
          skip: !boardId,
     });

     let errorMessage: string | null = null;

     if (error) {
          if (isFetchBaseQueryError(error)) {
               const errorData = error.data;
               if (hasMessage(errorData)) {
                    errorMessage = errorData.message;
               } else {
                    errorMessage = 'Failed to load team members';
               }
          } else {
               // SerializedError
               const serializedError = error as SerializedError;
               errorMessage = serializedError.message ?? 'Failed to load team members';
          }
     }

     return {
          teamMembers,
          loading: isFetching,
          error: errorMessage,
     };
};
