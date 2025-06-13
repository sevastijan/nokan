import { useUserAvatar } from "./utils";
import { User } from "./types";
import UserSelector from "./UserSelector";

interface Props {
  selectedUser: User | null;
  availableUsers: User[];
  onUserSelect: (userId: string | null) => void;
  label?: string;
}

const UserSelectorWithAvatar = ({
  selectedUser,
  availableUsers,
  onUserSelect,
  label,
}: Props) => {
  return (
    <UserSelector
      selectedUser={selectedUser}
      availableUsers={availableUsers}
      onUserSelect={onUserSelect}
      label={label}
    />
  );
};

export default UserSelectorWithAvatar;
