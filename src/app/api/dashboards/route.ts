import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "../auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("owner", session.user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST request received");
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    
    if (!session?.user?.email) {
      console.log("No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);
    const { title } = body;

    if (!title || typeof title !== "string") {
      console.log("Invalid title:", title);
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    console.log("Inserting board with title:", title.trim(), "owner:", session.user.email);

    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .insert({
        title: title.trim(),
        owner: session.user.email,
      })
      .select()
      .single();

    console.log("Board insert result:", { boardData, boardError });

    if (boardError) {
      console.error("Board creation error:", boardError);
      return NextResponse.json({ error: "Failed to create board", details: boardError }, { status: 500 });
    }

    // Dodaj domyślne kolumny
    const defaultColumns = [
      { title: "To Do", order: 0, board_id: boardData.id },
      { title: "In Progress", order: 1, board_id: boardData.id },
      { title: "Done", order: 2, board_id: boardData.id }
    ];

    console.log("Inserting columns:", defaultColumns);

    const { error: columnsError } = await supabase
      .from("columns")
      .insert(defaultColumns);

    if (columnsError) {
      console.error("Columns creation error:", columnsError);
    }

    return NextResponse.json(boardData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}