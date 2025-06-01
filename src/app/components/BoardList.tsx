"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBoards, addBoard, deleteBoard } from "../lib/api";
import { Board } from "../types/useBoardTypes"; // Import typu Board

/**
 * Component for displaying and managing a list of boards.
 *
 * @returns {JSX.Element} The rendered BoardList component.
 */
const BoardList = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the list of boards from the API on component mount.
   */
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const data = await getBoards();
        setBoards(data);
      } catch (err) {
        console.error("Error fetching boards:", err);
        setError("Failed to load boards.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  /**
   * Handles adding a new board.
   * Validates the input, sends the request to the API, and updates the state.
   */
  const handleAddBoard = async () => {
    if (!newTitle.trim()) return;

    try {
      const newBoard: Board = await addBoard({
        title: newTitle.trim(),
      });
      setBoards((prev) => [...prev, newBoard]);
      setNewTitle("");
    } catch (err: unknown) {
      console.error("Error adding board:", err);

      if (err instanceof Error && err.message.includes("row-level security")) {
        setError("You do not have permission to add a board.");
      } else {
        setError("Failed to add board.");
      }
    }
  };

  /**
   * Handles deleting a board.
   * Sends the delete request to the API and updates the state.
   *
   * @param {string} boardId - The ID of the board to delete.
   */
  const handleDeleteBoard = async (boardId: string) => {
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      console.error("Error deleting board:", err);
      setError("Failed to delete board.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-900 text-gray-100 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
        Your Boards
      </h2>

      <ul className="space-y-4 text-red">
        {boards.map((board) => (
          <li
            key={board.id}
            className="p-4 bg-gray-800 rounded-lg flex justify-between items-center shadow-md"
          >
            <Link
              href={`/board/${board.id}`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {board.title}
            </Link>
            <button
              onClick={() => handleDeleteBoard(board.id)}
              className="text-red-500 hover:text-red-400 ml-4"
              aria-label={`Delete board ${board.title}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex gap-3">
        <input
          type="text"
          placeholder="New board"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-grow bg-gray-800 text-gray-100 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddBoard}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded shadow-md"
          aria-label="Add new board"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default BoardList;
