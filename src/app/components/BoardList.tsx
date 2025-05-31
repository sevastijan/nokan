"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBoards, addBoard, deleteBoard } from "../lib/api";

const BoardList = () => {
  const [boards, setBoards] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleAddBoard = async () => {
    if (!newTitle.trim()) return;

    try {
      console.log("Adding board with title:", newTitle.trim()); // Debugowanie
      const newBoard = await addBoard({ title: newTitle.trim() });
      console.log("Board added successfully:", newBoard); // Debugowanie
      setBoards((prev) => [...prev, newBoard]);
      setNewTitle("");
    } catch (err: any) {
      console.error("Error adding board:", err);

      if (err.message?.includes("row-level security")) {
        setError("You do not have permission to add a board.");
      } else {
        setError("Failed to add board.");
      }
    }
  };

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
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Your Boards</h2>

      <ul>
        {boards.map((board) => (
          <li key={board.id} className="mb-2 flex justify-between items-center">
            <Link
              href={`/board/${board.id}`}
              className="text-blue-600 underline"
            >
              {board.title}
            </Link>
            <button
              onClick={() => handleDeleteBoard(board.id)}
              className="text-red-600 ml-4"
              aria-label={`Delete board ${board.title}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="New board"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-grow border border-gray-300 rounded px-3 py-1"
        />
        <button
          onClick={handleAddBoard}
          className="bg-blue-600 text-white px-4 rounded"
          aria-label="Add new board"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default BoardList;
