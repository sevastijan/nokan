/**
 *
 * Main API slice using Redux Toolkit Query (RTK Query) with fakeBaseQuery.
 * Handles all interactions with the Supabase backend.
 */
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { boardEndpoints } from './endpoints/boardEndpoints';
import { columnEndpoints } from './endpoints/columnEndpoints';
import { taskEndpoints } from './endpoints/taskEndpoints';
import { teamEndpoints } from './endpoints/teamEndpoints';
import { notificationEndpoints } from './endpoints/notificationEndpoints';
import { userEndpoints } from './endpoints/userEndpoints';
import { templateEndpoints } from './endpoints/templateEndpoints';

/**
 * UserRole type in your application.
 */
export type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER';

/**
 * The main API slice using RTK Query with fakeBaseQuery.
 */
export const apiSlice = createApi({
     reducerPath: 'api',
     baseQuery: fakeBaseQuery(),
     tagTypes: ['Board', 'Column', 'Task', 'TeamMember', 'UserRole', 'TeamsList', 'Team', 'TasksWithDates', 'Notification', 'Boards', 'Tasks'],
     endpoints: (builder) => ({
          ...boardEndpoints(builder),
          ...columnEndpoints(builder),
          ...taskEndpoints(builder),
          ...teamEndpoints(builder),
          ...notificationEndpoints(builder),
          ...userEndpoints(builder),
          ...templateEndpoints(builder),
     }),
});

/**
 * Export hooks for each endpoint.
 */
export const {
     useAddBoardMutation,
     useAddBoardTemplateMutation,
     useAddColumnMutation,
     useAddNotificationMutation,
     useAddStarterTaskMutation,
     useAddTaskMutation,
     useAddTeamMutation,
     useCreateBoardFromTemplateMutation,
     useDeleteNotificationMutation,
     useDeleteTeamMutation,
     useGetBoardQuery,
     useGetCurrentUserQuery,
     useGetMyBoardsQuery,
     useGetNotificationsQuery,
     useGetTaskByIdQuery,
     useGetTasksWithDatesQuery,
     useGetTeamMembersByBoardIdQuery,
     useGetTeamsQuery,
     useGetUserRoleQuery,
     useMarkNotificationReadMutation,
     useRemoveBoardMutation,
     useRemoveColumnMutation,
     useRemoveTaskMutation,
     useUpdateBoardTitleMutation,
     useUpdateColumnOrderMutation,
     useUpdateColumnTitleMutation,
     useUpdateTaskMutation,
     useUpdateTaskCompletionMutation,
     useUpdateTaskDatesMutation,
     useUpdateTeamMutation,
     useUploadAttachmentMutation,
     useGetBoardsByTeamIdQuery,
     useUpdateTeamBoardsMutation,
     useGetMyTeamsQuery,
     useGetUserBoardsQuery,
     useGetTasksByBoardsAndDateQuery,
} = apiSlice;
