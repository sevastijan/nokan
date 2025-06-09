import { createClient } from "@supabase/supabase-js";
import { BoardTemplate, Task } from "../types/useBoardTypes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches a board by its ID, including its columns and tasks
 * @param {string} id - The ID of the board
 * @returns {Promise<Object>} The board data
 * @throws {Error} Throws if board is not found or query fails
 */
export async function getBoardById(id: string) {
  const { data, error } = await supabase
    .from("boards")
    .select(`
      id,
      title,
      columns (
        id,
        title,
        order,
        board_id,
        tasks (
          id,
          title,
          order,
          description,
          priority,
          images,
          user_id,
          column_id,
          created_at,
          updated_at,
          start_date,
          end_date,
          assignee:users!tasks_user_id_fkey(id, name, email, image),
          priorities(id, label, color)
        )
      )
    `)
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Board with id ${id} not found`);
  }

  return data[0];
}

/**
 * Gets user UUID by email address
 * @param {string} email - User's email address
 * @returns {Promise<string | null>} User UUID or null if not found
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error fetching user UUID:", error);
    return null;
  }

  return data?.id || null;
}

/**
 * Fetches all boards
 * @returns {Promise<Array>} List of all boards
 * @throws {Error} Throws if query fails
 */
export async function getBoards() {
  const { data, error } = await supabase.from("boards").select("*");

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Adds a new board
 * @param {Object} params - Board details
 * @param {string} params.title - Title of the board
 * @returns {Promise<Object>} The newly created board
 * @throws {Error} Throws if insert fails or no data returned
 */
export const addBoard = async ({ title }: { title: string }) => {
  const { data, error } = await supabase
    .from("boards")
    .insert([{ title }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from the database.");
  }

  return data[0];
};

/**
 * Adds a new column to a board
 * @param {string} boardId - ID of the board
 * @param {string} title - Title of the column
 * @param {number} order - Order/index of the column
 * @returns {Promise<Object>} The newly created column
 * @throws {Error} Throws if insert fails
 */
export async function addColumn(boardId: string, title: string, order: number) {
  const { data, error } = await supabase
    .from("columns")
    .insert([{ board_id: boardId, title, order }])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

/**
 * Adds a new task to a column
 * @param {string} columnId - ID of the column
 * @param {string} title - Title of the task
 * @param {number} order - Order/index of the task
 * @param {string} [priority] - Optional priority ID
 * @param {string} [userId] - Optional user ID for assignee
 * @returns {Promise<Object>} The newly created task with related data
 * @throws {Error} Throws if column doesn't exist or insert fails
 */
export const addTask = async (
  columnId: string,
  title: string,
  order: number,
  priority?: string,
  userId?: string
) => {
  // Validate column existence
  const { data: columnExists, error: columnError } = await supabase
    .from("columns")
    .select("id")
    .eq("id", columnId)
    .single();

  if (columnError || !columnExists) {
    throw new Error(`Column with ID ${columnId} does not exist`);
  }

  const taskData: any = {
    column_id: columnId,
    title,
    order,
    priority: priority || null,
    user_id: userId || null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Updates the title of a board
 * @param {string} boardId - ID of the board to update
 * @param {string} newTitle - New title of the board
 * @throws {Error} Throws if update fails
 */
export async function updateBoardTitle(boardId: string, newTitle: string) {
  const { error } = await supabase
    .from("boards")
    .update({ title: newTitle })
    .eq("id", boardId);

  if (error) {
    throw error;
  }
}

/**
 * Updates the title of a task
 * @param {string} taskId - ID of the task to update
 * @param {string} newTitle - New title of the task
 * @throws {Error} Throws if update fails
 */
export async function updateTaskTitle(taskId: string, newTitle: string) {
  const { error } = await supabase
    .from("tasks")
    .update({ title: newTitle })
    .eq("id", taskId);

  if (error) {
    throw error;
  }
}

/**
 * Updates the title of a column
 * @param {string} columnId - ID of the column to update
 * @param {string} newTitle - New title of the column
 * @throws {Error} Throws if update fails
 */
export async function updateColumnTitle(columnId: string, newTitle: string) {
  const { error } = await supabase
    .from("columns")
    .update({ title: newTitle })
    .eq("id", columnId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a column by its ID
 * @param {string} columnId - ID of the column to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteColumn(columnId: string) {
  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a task by its ID
 * @param {string} taskId - ID of the task to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    throw error;
  }
}

/**
 * Deletes a board by its ID
 * @param {string} boardId - ID of the board to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteBoard(boardId: string) {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    throw error;
  }
}

/**
 * Fetches a single task by its ID with related assignee and priority
 * @param {string} taskId - ID of the task
 * @returns {Promise<Object>} Task data with related info
 * @throws {Error} Throws if query fails
 */
export async function getTaskById(taskId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .eq("id", taskId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates details of a task
 * @param {string} taskId - ID of the task
 * @param {Object} updates - Fields to update
 * @param {string} [updates.title] - New task title
 * @param {string} [updates.description] - New task description
 * @param {string|null} [updates.priority] - New priority ID or null
 * @param {Array<string>} [updates.images] - New list of image URLs
 * @returns {Promise<Object>} Updated task with related data
 * @throws {Error} Throws if update fails
 */
export async function updateTaskDetails(
  taskId: string,
  updates: { title?: string; description?: string; priority?: string | null; images?: string[] }
) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates task dates for calendar functionality
 * @param {string} taskId - ID of the task
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Updated task with related data
 * @throws {Error} Throws if update fails
 */
export async function updateTaskDates(
  taskId: string,
  startDate: string | null,
  endDate: string | null
) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      start_date: startDate,
      end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select(`
      *,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Fetches all tasks with dates for calendar view
 * @param {string} boardId - ID of the board
 * @returns {Promise<Array>} Tasks with date information
 * @throws {Error} Throws if query fails
 */
export async function getTasksWithDates(boardId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      priority,
      start_date,
      end_date,
      column_id,
      assignee:users!tasks_user_id_fkey(id, name, email, image),
      priorities(id, label, color),
      columns!inner(board_id)
    `)
    .eq("columns.board_id", boardId)
    .not("start_date", "is", null);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Fetches all priorities
 * @returns {Promise<Array>} List of priorities
 * @throws {Error} Throws if query fails
 */
export async function getPriorities() {
  const { data, error } = await supabase
    .from("priorities")
    .select("*")
    .order("id");

  if (error) {
    throw new Error("Failed to fetch priorities");
  }

  return data || [];
}

/**
 * Adds a new priority
 * @param {string} label - Priority label
 * @param {string} color - Priority color
 * @returns {Promise<Object>} Created priority
 * @throws {Error} Throws if insert fails or no data returned
 */
export async function addPriority(label: string, color: string) {
  
  // Generate a unique text ID
  const id = `priority_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { data, error } = await supabase
    .from("priorities")
    .insert([{ id, label, color }])
    .select()
    .single();

  if (error) {
    console.error("Supabase error details:", error);
    throw new Error(`Failed to add priority: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from the database");
  }

  return data;
}

/**
 * Updates a priority
 * @param {string} id - Priority ID
 * @param {string} label - Priority label
 * @param {string} color - Priority color
 * @returns {Promise<Object>} Updated priority
 * @throws {Error} Throws if update fails
 */
export async function updatePriority(id: string, label: string, color: string) {
  
  const { data, error } = await supabase
    .from("priorities")
    .update({ label, color })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase error details:", error);
    throw new Error(`Failed to update priority: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from the database");
  }

  return data;
}

/**
 * Checks if priority is used by any tasks
 * @param {string} priorityId - Priority ID to check
 * @returns {Promise<boolean>} True if priority is used by tasks
 */
export async function isPriorityInUse(priorityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("priority", priorityId)
    .limit(1);

  if (error) {
    console.error("Error checking priority usage:", error);
    return true; // Assume it's in use to be safe
  }

  return (data && data.length > 0);
}

/**
 * Deletes a priority by its ID - only if not used by any tasks
 * @param {string} id - Priority ID
 * @throws {Error} Throws if deletion fails or priority is in use
 */
export async function deletePriority(id: string) {
  console.log("Deleting priority with id:", id);
  
  // First check if priority is used by any tasks
  const inUse = await isPriorityInUse(id);
  if (inUse) {
    throw new Error("Cannot delete priority - it is being used by one or more tasks");
  }
  
  const { error } = await supabase
    .from("priorities")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase error details:", error);
    throw new Error(`Failed to delete priority: ${error.message}`);
  }
  
  console.log("Successfully deleted priority with id:", id);
}

/**
 * Updates a task with new data
 * @param {string} taskId - Task ID
 * @param {Object} taskData - Updated task data
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.priority] - Task priority
 * @returns {Promise<Task>} Updated task object
 * @throws {Error} Throws if update fails
 */
export const updateTask = async (taskId: string, taskData: {
  title: string;
  description?: string;
  priority?: string;
}): Promise<Task> => {
  const { data, error } = await supabase
    .from("tasks")
    .update(taskData)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update task");
  }

  return data;
};

/**
 * Creates attachments storage bucket
 * @returns {Promise<Object>} Bucket creation result
 * @throws {Error} Throws if bucket creation fails
 */
export async function createAttachmentsBucket() {
  const { data, error } = await supabase.storage.createBucket('attachments', {
    public: false,
    allowedMimeTypes: ['image/*', 'application/pdf', 'text/*', 'application/*'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error && error.message !== 'Bucket already exists') {
    console.error('Error creating bucket:', error);
    throw error;
  }

  return data;
}

/**
 * Fetches all teams
 * @returns {Promise<Array>} List of all teams
 * @throws {Error} Throws if query fails
 */
export async function getTeams() {
  const { data, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      created_at,
      board_id,
      users: team_members (
        user_id
      )
    `);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Adds a new team
 * @param {string} name - Name of the team
 * @param {string[]} userIds - Array of user IDs in the team
 * @param {string} boardId - ID of the board
 * @returns {Promise<Object>} The newly created team
 * @throws {Error} Throws if insert fails
 */
export async function addTeam(
  name: string,
  userIds: string[],
  boardId: string
) {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .insert([{ name }])
    .select()
    .single();

  if (teamError) {
    throw teamError;
  }

  if (!teamData) {
    throw new Error("Failed to create team");
  }

  // Insert team members into team_members table
  const teamId = teamData.id;
  const teamMembers = userIds.map((userId) => ({
    team_id: teamId,
    user_id: userId,
  }));

  const { data: memberData, error: memberError } = await supabase
    .from("team_members")
    .insert(teamMembers);

  if (memberError) {
    // If adding members fails, delete the team to maintain consistency
    await deleteTeam(teamId);
    throw memberError;
  }

  // Assign team to board
  if (boardId) {
    await addTeamToBoard(boardId, teamId);
  }

  return teamData;
}

/**
 * Updates a team
 * @param {string} teamId - ID of the team to update
 * @param {string} name - New name of the team
 * @param {string[]} userIds - Array of user IDs in the team
 * @param {string} boardId - ID of the board
 * @returns {Promise<Object>} The updated team
 * @throws {Error} Throws if update fails
 */
export async function updateTeam(
  teamId: string,
  name: string,
  userIds: string[],
  boardId: string
) {
  const { error } = await supabase
    .from("teams")
    .update({ name, board_id: boardId }) 
    .eq("id", teamId);

  if (error) throw error;

  await supabase.from("team_members").delete().eq("team_id", teamId);
  if (userIds.length > 0) {
    const inserts = userIds.map((userId) => ({
      team_id: teamId,
      user_id: userId,
    }));
    await supabase.from("team_members").insert(inserts);
  }
}

/**
 * Deletes a team by its ID
 * @param {string} teamId - ID of the team to delete
 * @throws {Error} Throws if deletion fails
 */
export async function deleteTeam(teamId: string) {
  // First, delete team members
  const { error: deleteMembersError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId);

  if (deleteMembersError) {
    throw deleteMembersError;
  }

  // Then, delete the team
  const { error: deleteTeamError } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (deleteTeamError) {
    throw deleteTeamError;
  }
}

/**
 * Adds a team to a board
 * @param {string} boardId - ID of the board
 * @param {string} teamId - ID of the team to add
 * @returns {Promise<Object>} Insertion result
 * @throws {Error} Throws if insertion fails
 */
export async function addTeamToBoard(boardId: string, teamId: string) {
  const { data, error } = await supabase
    .from("board_access")
    .insert([{ board_id: boardId, team_id: teamId }]);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Gets all boards for a user - both owned and accessible via teams
 * @param {string} userEmail - User's email address
 * @returns {Promise<Array>} All boards accessible to the user
 * @throws {Error} Throws if query fails
 */
export async function getAllBoardsForUser(userEmail: string) {
  
  const userId = await getUserIdByEmail(userEmail);
  if (!userId) {
    return [];
  }

  const { data: ownedBoards, error: ownedError } = await supabase
    .from("boards")
    .select("*")
    .eq("owner", userEmail);

  if (ownedError) {
    console.error("Error fetching owned boards:", ownedError);
  }

  const { data: teamMemberships, error: teamError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (teamError) {
    console.error("Error fetching team memberships:", teamError);
    return ownedBoards || [];
  }

  const teamIds = (teamMemberships || []).map(tm => tm.team_id);

  if (teamIds.length === 0) {
    return ownedBoards || [];
  }

  // Get board access through teams
  const { data: boardAccess, error: accessError } = await supabase
    .from("board_access")
    .select("board_id")
    .in("team_id", teamIds);

  if (accessError) {
    console.error("Error fetching board access:", accessError);
    return ownedBoards || [];
  }

  const accessibleBoardIds = (boardAccess || []).map(ba => ba.board_id);

  if (accessibleBoardIds.length === 0) {
    return ownedBoards || [];
  }

  // Get the actual board data
  const { data: accessibleBoards, error: boardsError } = await supabase
    .from("boards")
    .select("*")
    .in("id", accessibleBoardIds);

  if (boardsError) {
    console.error("Error fetching accessible boards:", boardsError);
    return ownedBoards || [];
  }

  // Combine owned and accessible boards, remove duplicates
  const allBoards = [...(ownedBoards || []), ...(accessibleBoards || [])];
  const uniqueBoards = allBoards.filter((board, index, self) => 
    index === self.findIndex(b => b.id === board.id)
  );

  return uniqueBoards;
}

/**
 * Fetches all board templates
 * @returns {Promise<Array>} List of all templates
 * @throws {Error} Throws error if the query fails
 */
export async function getBoardTemplates(): Promise<BoardTemplate[]> {
  const { data, error } = await supabase
    .from("board_templates")
    .select(`
      id,
      name,
      description,
      is_custom,
      created_at,
      updated_at,
      template_columns (
        id,
        template_id,
        title,
        order
      )
    `)
    .order('is_custom', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching board templates:", error);
    throw error;
  }

  return data?.map(template => ({
    ...template,
    columns: template.template_columns || []
  })) || [];
}

/**
 * Adds a new board template
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Template name
 * @param {string} templateData.description - Template description
 * @param {Array} templateData.columns - Template columns
 * @returns {Promise<Object>} Newly created template
 * @throws {Error} Throws error if adding fails
 */
export async function addBoardTemplate(templateData: {
  name: string;
  description: string;
  columns: { title: string; order: number }[];
}): Promise<BoardTemplate> {
  // Insert template
  const { data: template, error: templateError } = await supabase
    .from("board_templates")
    .insert([{
      name: templateData.name,
      description: templateData.description,
      is_custom: true
    }])
    .select()
    .single();

  if (templateError) {
    console.error("Error adding board template:", templateError);
    throw templateError;
  }

  // Insert template columns
  const columnsToInsert = templateData.columns.map(col => ({
    template_id: template.id,
    title: col.title,
    order: col.order
  }));

  const { data: columns, error: columnsError } = await supabase
    .from("template_columns")
    .insert(columnsToInsert)
    .select();

  if (columnsError) {
    console.error("Error adding template columns:", columnsError);
    throw columnsError;
  }

  return {
    ...template,
    columns: columns || []
  };
}

/**
 * Creates a board from a selected template
 * @param {string} title - Board title
 * @param {string} templateId - Template ID
 * @param {string} userEmail - User email
 * @returns {Promise<Object>} Newly created board
 * @throws {Error} Throws error if creation fails
 */
export async function createBoardFromTemplate(
  title: string,
  templateId: string,
  userEmail: string
) {
  // Fetch the template
  const { data: template, error: templateError } = await supabase
    .from("board_templates")
    .select(`
      id,
      name,
      template_columns (
        title,
        order
      )
    `)
    .eq("id", templateId)
    .single();

  if (templateError) {
    console.error("Error fetching template:", templateError);
    throw templateError;
  }

  // Create board
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert([{ 
      title,
      owner: userEmail
    }])
    .select()
    .single();

  if (boardError) {
    console.error("Error creating board:", boardError);
    throw boardError;
  }

  // Insert columns from the template
  if (template.template_columns && template.template_columns.length > 0) {
    const columnsToInsert = template.template_columns.map((col: any) => ({
      board_id: board.id,
      title: col.title,
      order: col.order
    }));

    const { error: columnsError } = await supabase
      .from("columns")
      .insert(columnsToInsert);

    if (columnsError) {
      console.error("Error creating columns:", columnsError);
      throw columnsError;
    }
  }

  return board;
}

/**
 * Deletes a board template (only custom ones)
 * @param {string} templateId - ID of the template to delete
 * @throws {Error} Throws error if deletion fails
 */
export async function deleteBoardTemplate(templateId: string) {
  // Check if the template is custom
  const { data: template, error: checkError } = await supabase
    .from("board_templates")
    .select("is_custom")
    .eq("id", templateId)
    .single();

  if (checkError) {
    console.error("Error checking template:", checkError);
    throw checkError;
  }

  if (!template.is_custom) {
    throw new Error("Default templates cannot be deleted");
  }

  // Delete template columns
  const { error: columnsError } = await supabase
    .from("template_columns")
    .delete()
    .eq("template_id", templateId);

  if (columnsError) {
    console.error("Error deleting template columns:", columnsError);
    throw columnsError;
  }

  // Delete the template
  const { error: templateError } = await supabase
    .from("board_templates")
    .delete()
    .eq("id", templateId);

  if (templateError) {
    console.error("Error deleting template:", templateError);
    throw templateError;
  }
}
