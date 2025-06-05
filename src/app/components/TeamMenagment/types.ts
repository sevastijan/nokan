import { User } from "../SingleTaskView/types";

export interface Team {
  id: string;
  name: string;
  created_at: string;
  users: { user_id: string }[];
  board_id?: string; 

}

export interface TeamListProps {
  teams: Team[];
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  availableUsers: User[];
}

export interface TeamListItemProps {
  team: Team;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  availableUsers: User[];
}

export type TeamFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isCreatingTeam: boolean;
  editingTeamId: string | null;
  editedTeamName: string;
  setEditedTeamName: React.Dispatch<React.SetStateAction<string>>;
  editedTeamMembers: string[];
  setEditedTeamMembers: React.Dispatch<React.SetStateAction<string[]>>;
  newTeamName: string;
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>;
  newTeamMembers: string[];
  setNewTeamMembers: React.Dispatch<React.SetStateAction<string[]>>;
  availableUsers: User[];
  boards: Board[];
  selectedBoardId: string;
  setSelectedBoardId: React.Dispatch<React.SetStateAction<string>>;
};

export interface Option {
  value: string;
  label: string;
  image?: string;
}

export interface CustomSelectProps {
  options: Option[];
  value: string[];
  onChange: (newValue: string[]) => void;
  isMulti?: boolean;
}

export interface Board  {
  id: string,
  name: string,
  title: string
}