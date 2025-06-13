"use client";

import { JSX, useEffect } from "react";
import Button from "../Button/Button";
import { FaPlus } from "react-icons/fa";
import { AddTaskFormProps } from "./types";

/**
 * AddTaskForm component renders a button to trigger adding a new task.
 * Calls onOpenAddTask callback with the current column ID when clicked.
 */
const AddTaskForm = ({
  columnId,
  onOpenAddTask,
}: AddTaskFormProps): JSX.Element => {
  return (
    <div className="mt-4">
      <Button
        variant="success"
        size="md"
        fullWidth={true}
        onClick={() => {
          console.log("Add Task button clicked");
          onOpenAddTask(columnId);
        }}
        icon={<FaPlus />}
      >
        Add Task
      </Button>
    </div>
  );
};

export default AddTaskForm;
