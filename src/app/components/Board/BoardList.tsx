"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BoardModal from "./BoardModal";
import BoardDropdown from "./BoardDropdown";
import Loader from "../Loader";

interface Board {
  id: string;
  title: string;
  owner: string;
}

/**
 * Board list component that displays user's boards with CRUD operations
 * @returns JSX element containing the board list interface
 */
const BoardList = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  /**
   * Fetch boards when user is authenticated
   */
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchBoards();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  /**
   * Fetch all boards from API
   */
  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/dashboards");
      const data = await response.json();

      if (Array.isArray(data)) {
        setBoards(data);
      } else {
        setBoards([]);
      }
    } catch (error) {
      setError("Failed to fetch boards");
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new board
   * @param title - The title of the new board
   */
  const createBoard = async (title: string) => {
    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newBoard = await response.json();
      setBoards([...boards, newBoard]);
      setCreateModalOpen(false);
    } catch (error) {
      setError("Failed to create board");
    }
  };

  /**
   * Edit an existing board
   * @param title - The new title for the board
   */
  const editBoard = async (title: string) => {
    if (!selectedBoard) return;

    try {
      const response = await fetch(`/api/dashboards/${selectedBoard.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedBoard = await response.json();
      setBoards(
        boards.map((board) =>
          board.id === selectedBoard.id
            ? { ...board, title: updatedBoard.title }
            : board
        )
      );
      setEditModalOpen(false);
      setSelectedBoard(null);
    } catch (error) {
      setError("Failed to edit board");
    }
  };

  /**
   * Delete a board
   */
  const deleteBoard = async () => {
    if (!selectedBoard) return;

    try {
      const response = await fetch(`/api/dashboards/${selectedBoard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setBoards(boards.filter((board) => board.id !== selectedBoard.id));
      setDeleteModalOpen(false);
      setSelectedBoard(null);
    } catch (error) {
      setError("Failed to delete board");
    }
  };

  /**
   * Navigate to board page
   * @param boardId - The ID of the board to open
   */
  const openBoard = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  /**
   * Handle edit button click
   * @param board - The board to edit
   */
  const handleEditClick = (board: Board) => {
    setSelectedBoard(board);
    setEditModalOpen(true);
  };

  /**
   * Handle delete button click
   * @param board - The board to delete
   */
  const handleDeleteClick = (board: Board) => {
    setSelectedBoard(board);
    setDeleteModalOpen(true);
  };

  if (status === "loading" || loading) {
    return <Loader text="Loading board..." />;
  }

  if (!session) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400">Please log in to view your boards</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Your Boards</h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className={`bg-blue-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-700 transition-all duration-300 ${
            boards.length === 0 && !loading
              ? "animate-pulse shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50"
              : ""
          }`}
        >
          Create Board
        </button>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => (
          <div
            key={board.id}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer hover:bg-gray-750 relative"
          >
            <div className="flex items-start justify-between">
              <div onClick={() => openBoard(board.id)} className="flex-1">
                <h3 className="text-lg font-medium text-white">
                  {board.title}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Owner: {board.owner}
                </p>
              </div>
              <BoardDropdown
                onEdit={() => handleEditClick(board)}
                onDelete={() => handleDeleteClick(board)}
              />
            </div>
          </div>
        ))}
      </div>

      {boards.length === 0 && !loading && (
        <div className="text-center p-8">
          <div className="text-gray-400 mb-4">
            No boards found. Create your first board!
          </div>
        </div>
      )}

      <BoardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createBoard}
        title="Create Board"
        mode="create"
      />

      <BoardModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBoard(null);
        }}
        onSubmit={editBoard}
        initialTitle={selectedBoard?.title || ""}
        title="Edit Board"
        mode="edit"
      />

      <BoardModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedBoard(null);
        }}
        onSubmit={() => {}}
        onDelete={deleteBoard}
        initialTitle={selectedBoard?.title || ""}
        title="Delete Board"
        mode="delete"
      />
    </div>
  );
};

export default BoardList;
