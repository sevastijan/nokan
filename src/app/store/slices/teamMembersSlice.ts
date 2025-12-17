import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TeamMember } from '@/app/types/globalTypes';

type TeamMembersState = {
     teamMembers: TeamMember[];
     loading: boolean;
     error: string | null;
};

const initialState: TeamMembersState = {
     teamMembers: [],
     loading: false,
     error: null,
};

const teamMembersSlice = createSlice({
     name: 'teamMembers',
     initialState,
     reducers: {
          setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
               state.teamMembers = action.payload;
               state.loading = false;
               state.error = null;
          },
          setLoading: (state) => {
               state.loading = true;
               state.error = null;
          },
          setError: (state, action: PayloadAction<string>) => {
               state.loading = false;
               state.error = action.payload;
          },
     },
});

export const { setTeamMembers, setLoading, setError } = teamMembersSlice.actions;
export default teamMembersSlice.reducer;
