/**
 * Main API slice using Redux Toolkit Query (RTK Query) with fakeBaseQuery.
 * Handles all interactions with the Supabase backend.
 * Includes chat + chat management endpoints.
 */
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { boardEndpoints } from './endpoints/boardEndpoints';
import { columnEndpoints } from './endpoints/columnEndpoints';
import { taskEndpoints } from './endpoints/taskEndpoints';
import { teamEndpoints } from './endpoints/teamEndpoints';
import { notificationEndpoints } from './endpoints/notificationEndpoints';
import { userEndpoints } from './endpoints/userEndpoints';
import { templateEndpoints } from './endpoints/templateEndpoints';
import { submissionEndpoints } from './endpoints/submissionEndpoints';
import { clientManagementEndpoints } from './endpoints/clientManagementEndpoints';
import { preferencesEndpoints } from './endpoints/preferencesEndpoints';
import { collaboratorEndpoints } from './endpoints/collaboratorEndpoints';
import { apiTokenEndpoints } from './endpoints/apiTokenEndpoints';
import { taskSnapshotEndpoints } from './endpoints/taskSnapshotEndpoints';
import { chatEndpoints } from './endpoints/chatEndpoints';
import { crmEndpoints } from './endpoints/crmEndpoints';
import { slackEndpoints } from './endpoints/slackEndpoints';
import { wikiEndpoints } from './endpoints/wikiEndpoints';

/**
 * UserRole type in your application.
 */
export type UserRole = 'OWNER' | 'PROJECT_MANAGER' | 'MEMBER' | 'CLIENT';

/**
 * The main API slice using RTK Query with fakeBaseQuery.
 */
export const apiSlice = createApi({
     reducerPath: 'api',
     baseQuery: fakeBaseQuery(),
     tagTypes: [
          'Board',
          'BoardOrder',
          'Column',
          'Task',
          'TeamMember',
          'UserRole',
          'TeamsList',
          'Team',
          'TasksWithDates',
          'Notification',
          'NotificationPreferences',
          'Boards',
          'Tasks',
          'Submission',
          'Client',
          'BoardClient',
          'ClientBoard',
          'Priority',
          'User',
          'TaskCollaborators',
          'BoardMember',
          'CurrentUser',
          'BoardNotes',
          'ApiToken',
          'UserTasks',
          'TaskSnapshot',
          'ChatChannel',
          'ChatChannelList',
          'ChatMessages',
          'ChatMembers',
          'CrmCompany',
          'CrmContact',
          'CrmDeal',
          'CrmDealPartner',
          'CrmActivity',
          'CrmExchangeRate',
          'CrmDealSource',
          'AppSettings',
          'SlackIntegration',
          'WikiPage',
     ],
     endpoints: (builder) => ({
          ...boardEndpoints(builder),
          ...columnEndpoints(builder),
          ...taskEndpoints(builder),
          ...teamEndpoints(builder),
          ...notificationEndpoints(builder),
          ...userEndpoints(builder),
          ...templateEndpoints(builder),
          ...submissionEndpoints(builder),
          ...clientManagementEndpoints(builder),
          ...preferencesEndpoints(builder),
          ...collaboratorEndpoints(builder),
          ...apiTokenEndpoints(builder),
          ...taskSnapshotEndpoints(builder),
          ...chatEndpoints(builder),
          ...crmEndpoints(builder),
          ...slackEndpoints(builder),
          ...wikiEndpoints(builder),
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
     useGetClientSubmissionsQuery,
     useUpdateSubmissionMutation,
     useDeleteSubmissionMutation,
     useCreateSubmissionMutation,
     useAssignClientToBoardMutation,
     useGetClientBoardsQuery,
     useGetAllClientsQuery,
     useGetAllBoardsQuery,
     useGetClientBoardAssignmentsQuery,
     useRemoveClientFromBoardMutation,
     useGetPrioritiesQuery,
     useGetClientBoardsWithDetailsQuery,
     useGetAllSubmissionsQuery,
     useGetAllUsersQuery,
     useSetUserRoleMutation,
     useGetNotificationPreferencesQuery,
     useUpdateNotificationPreferencesMutation,
     useGetTaskCollaboratorsQuery,
     useAddTaskCollaboratorMutation,
     useRemoveTaskCollaboratorMutation,
     useUpdateTaskCollaboratorsMutation,
     useAddMemberToBoardMutation,
     useGetBoardMembersQuery,
     useRemoveMemberFromBoardMutation,
     useUpdateUserMutation,
     useGetBoardNotesQuery,
     useSaveBoardNotesMutation,
     useGetBoardOrderQuery,
     useSaveBoardOrderMutation,
     useGetFavoriteBoardsQuery,
     useGetBoardAvatarsQuery,
     useToggleBoardFavoriteMutation,
     useReorderFavoriteBoardsMutation,
     // Subtask hooks
     useGetSubtasksQuery,
     useAddSubtaskMutation,
     useUpdateSubtaskCompletionMutation,
     useRemoveSubtaskMutation,
     useReorderSubtasksMutation,
     useUpdateTaskTypeMutation,
     // API Token hooks
     useGetApiTokensQuery,
     useCreateApiTokenMutation,
     useUpdateApiTokenMutation,
     useRevokeApiTokenMutation,
     // User Tasks hook
     useGetUserTasksQuery,
     // Task Snapshot hooks
     useGetTaskSnapshotsQuery,
     useRestoreTaskSnapshotMutation,
     // Chat hooks
     useGetUserChannelsQuery,
     useGetChannelMessagesQuery,
     useGetThreadMessagesQuery,
     useGetChannelMembersQuery,
     useCreateDmChannelMutation,
     useCreateGroupChannelMutation,
     useSendMessageMutation,
     useEditMessageMutation,
     useDeleteMessageMutation,
     useToggleReactionMutation,
     useMarkChannelReadMutation,
     useAddChannelMemberMutation,
     useRemoveChannelMemberMutation,
     // Chat management hooks
     useRenameChannelMutation,
     usePinMessageMutation,
     useUnpinMessageMutation,
     useGetPinnedMessagesQuery,
     // CRM hooks
     useGetCrmCompaniesQuery,
     useGetCrmCompanyByIdQuery,
     useCreateCrmCompanyMutation,
     useUpdateCrmCompanyMutation,
     useDeleteCrmCompanyMutation,
     useGetCrmContactsByCompanyQuery,
     useCreateCrmContactMutation,
     useUpdateCrmContactMutation,
     useDeleteCrmContactMutation,
     useGetCrmDealsQuery,
     useGetCrmDealByIdQuery,
     useCreateCrmDealMutation,
     useUpdateCrmDealMutation,
     useDeleteCrmDealMutation,
     useGetCrmDealPartnersQuery,
     useAddCrmDealPartnerMutation,
     useRemoveCrmDealPartnerMutation,
     useGetCrmActivitiesQuery,
     useCreateCrmActivityMutation,
     useDeleteCrmActivityMutation,
     useLinkCrmDealToBoardMutation,
     useSetCrmDealContactsMutation,
     useGetCrmExchangeRatesQuery,
     useGetCrmDealSourcesQuery,
     useAddCrmDealSourceMutation,
     // Slack hooks
     useGetAppSettingsQuery,
     useSaveAppSettingMutation,
     useGetSlackIntegrationQuery,
     useDisconnectSlackMutation,
     // Wiki hooks
     useGetWikiPagesQuery,
     useGetWikiBoardPagesQuery,
     useGetWikiPageByIdQuery,
     useCreateWikiPageMutation,
     useCreateWikiBoardPageMutation,
     useUpdateWikiPageMutation,
     useDeleteWikiPageMutation,
     useReorderWikiPagesMutation,
} = apiSlice;
