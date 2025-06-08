import { useState, useEffect } from 'react';
import { getAllBoardsForUser } from '../lib/api';

interface Board {
  id: string;
  title: string;
}

export const useBoards = (userEmail: string | null) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      fetchUserBoards(userEmail);
    }
  }, [userEmail]);

  const fetchUserBoards = async (email: string) => {
    try {
      setLoading(true);
      const userBoards = await getAllBoardsForUser(email);
      setBoards(userBoards);
      if (userBoards.length > 0) {
        setSelectedBoardId(userBoards[0].id);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    boards,
    selectedBoardId,
    setSelectedBoardId,
    loading,
    refetchBoards: () => userEmail && fetchUserBoards(userEmail)
  };
};