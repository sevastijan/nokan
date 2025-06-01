import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "../../auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boardId = params.id;
    console.log("Fetching board:", boardId, "for user:", session.user.email);

    // Pobierz board z dashboards table
    const { data: dashboardData, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("id", boardId)
      .eq("owner", session.user.email)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Przekształć dashboard data na board format
    const boardData = {
      id: dashboardData.id,
      title: dashboardData.title,
      owner: dashboardData.owner,
      created_at: dashboardData.created_at,
      columns: [
        {
          id: "todo-" + dashboardData.id,
          title: "To Do",
          tasks: [],
          boardId: dashboardData.id
        },
        {
          id: "inprogress-" + dashboardData.id,
          title: "In Progress", 
          tasks: [],
          boardId: dashboardData.id
        },
        {
          id: "done-" + dashboardData.id,
          title: "Done",
          tasks: [],
          boardId: dashboardData.id
        }
      ]
    };

    console.log("Returning board data:", boardData);
    return NextResponse.json(boardData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}