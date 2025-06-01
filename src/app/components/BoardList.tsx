"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Board {
  id: string;
  title: string;
  owner: string;
}

export default function BoardList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchBoards();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/dashboards");
      const data = await response.json();
      console.log("Boards from API:", data);

      // Sprawdź czy data to tablica przed ustawieniem
      if (Array.isArray(data)) {
        setBoards(data);
      } else {
        setBoards([]);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
      setError("Failed to fetch boards");
      setBoards([]); // Ustaw pustą tablicę przy błędzie
    } finally {
      setLoading(false);
    }
  };

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
      // Usuń sprawdzanie Array.isArray, bo teraz zwracamy pojedynczy obiekt
      setBoards([...boards, newBoard]);
    } catch (error) {
      console.error("Error creating board:", error);
      setError("Failed to create board");
    }
  };

  const openBoard = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-400">Loading boards...</div>
      </div>
    );
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Boards</h2>
        <button
          onClick={() => {
            const title = prompt("Enter board title:");
            if (title) createBoard(title);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
            onClick={() => openBoard(board.id)}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer hover:bg-gray-750"
          >
            <h3 className="text-lg font-medium text-white">{board.title}</h3>
            <p className="text-gray-400 text-sm mt-1">Owner: {board.owner}</p>
          </div>
        ))}
      </div>

      {boards.length === 0 && !loading && (
        <div className="text-center p-8">
          <div className="text-gray-400">
            No boards found. Create your first board!
          </div>
        </div>
      )}
    </div>
  );
}
