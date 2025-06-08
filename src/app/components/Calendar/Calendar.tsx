"use client";

import { useState, useEffect, JSX } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getTasksWithDates, updateTaskDates } from "../../lib/api";
import { CalendarProps, CalendarEvent } from "./types";
import "../Calendar/calendar.css";
import Loader from "../Loader";
import Avatar from "../Avatar/Avatar"; // Import the Avatar component

/**
 * Calendar component for displaying tasks with dates in a monthly/weekly view
 * Supports drag-and-drop functionality to update task dates
 * @param {CalendarProps} props - Component props
 * @returns {JSX.Element} Calendar component
 */
const Calendar = ({ boardId, onTaskClick }: CalendarProps): JSX.Element => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarEvents();
  }, [boardId]);

  /**
   * Loads and transforms tasks with dates into calendar events
   * Fetches tasks from the API and converts them to FullCalendar format
   */
  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      const tasks = (await getTasksWithDates(boardId)) as any[];

      if (!tasks || tasks.length === 0) {
        setEvents([]);
        return;
      }

      const calendarEvents: CalendarEvent[] = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        start: task.start_date,
        end: task.end_date
          ? new Date(new Date(task.end_date).getTime() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : undefined,
        backgroundColor: getPriorityColor(task.priorities?.color),
        borderColor: getPriorityColor(task.priorities?.color),
        extendedProps: {
          description: task.description,
          priority: task.priorities?.label,
          assignee: task.assignee,
        },
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Returns priority color or default blue if not provided
   * @param {string} [priorityColor] - Priority color from database
   * @returns {string} Color hex code
   */
  const getPriorityColor = (priorityColor?: string): string => {
    return priorityColor || "#3788d8";
  };

  /**
   * Handles drag-and-drop events to update task dates
   * Updates both start and end dates when an event is moved
   * @param {any} info - FullCalendar event drop information
   */
  const handleEventDrop = async (info: any) => {
    try {
      const startDate = info.event.start.toISOString().split("T")[0];
      const endDate = info.event.end
        ? new Date(info.event.end.getTime() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : startDate;

      await updateTaskDates(info.event.id, startDate, endDate);
      await loadCalendarEvents();
    } catch (error) {
      console.error("Error updating task dates:", error);
      info.revert();
    }
  };

  /**
   * Handles click events on calendar tasks
   * Triggers parent callback to open task details
   * @param {any} info - FullCalendar event click information
   */
  const handleEventClick = (info: any) => {
    if (onTaskClick) {
      onTaskClick(info.event.id);
    }
  };

  if (loading) {
    return <Loader text="Loading calendar.." />;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Task Calendar</h2>
        <p>Drag tasks to change their dates</p>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        height="600px"
        locale="en"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        eventDisplay="block"
        dayMaxEvents={3}
        eventContent={(arg) => (
          <div className="custom-event">
            <div className="event-title">{arg.event.title}</div>
            {arg.event.extendedProps.assignee && (
              <div className="event-assignee">
                <Avatar
                  src={arg.event.extendedProps.assignee.image || null}
                  alt={arg.event.extendedProps.assignee.name}
                  size={20}
                />
                <span className="event-assignee-name">
                  {arg.event.extendedProps.assignee.name}
                </span>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default Calendar;
