"use client";

import { useState, useEffect, JSX } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getTasksWithDates, updateTaskDates } from "../../lib/api";
import { CalendarProps, CalendarEvent } from "@/app/types/globalTypes";
import "../Calendar/calendar.css";
import Loader from "../Loader";
import Avatar from "../Avatar/Avatar";

const Calendar = ({
  boardId,
  onTaskClick,
  viewMode = "month",
}: CalendarProps): JSX.Element => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (boardId) {
      loadCalendarEvents();
    }
  }, [boardId]);

  // Ładowanie eventów z API
  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      const tasks = await getTasksWithDates(boardId);

      const calendarEvents: CalendarEvent[] = tasks
        .filter((task) => !!task.start_date)
        .map((task) => ({
          id: task.id,
          title: task.title ?? "Unnamed Task",
          start: task.start_date ?? new Date().toISOString(),
          end: task.end_date ?? task.start_date ?? new Date().toISOString(),
          backgroundColor: getPriorityColor(task.priorities?.label ?? "low"),
          borderColor: getPriorityColor(task.priorities?.label ?? "low"),
          extendedProps: {
            description: task.description ?? "",
            priority: task.priorities?.label ?? "low",
            status: "todo",
            assignee: task.assignee ?? null,
          },
        }));

      console.log("Calendar events:", calendarEvents); // Debug
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Failed to load calendar events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Obsługa przeciągania eventów
  const handleEventDrop = async (info: any) => {
    try {
      const taskId = info.event.id;
      const newDate = info.event.start;

      // Użyj updateTaskDates z dwoma parametrami
      await updateTaskDates(
        taskId,
        newDate.toISOString(),
        newDate.toISOString()
      );

      // Aktualizuj lokalny stan
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === taskId
            ? { ...event, start: newDate, end: newDate }
            : event
        )
      );
    } catch (error) {
      console.error("Failed to update task date:", error);
      // Cofnij zmianę w przypadku błędu
      info.revert();
    }
  };

  // Obsługa kliknięcia w event
  const handleEventClick = (info: any) => {
    if (onTaskClick) {
      onTaskClick(info.event.id);
    }
  };

  // Funkcja do określenia koloru na podstawie priorytetu
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
      case "urgent":
        return "#ef4444"; // czerwony
      case "medium":
      case "normal":
        return "#f59e0b"; // pomarańczowy
      case "low":
        return "#10b981"; // zielony
      default:
        return "#6b7280"; // szary
    }
  };

  const getCalendarView = () => {
    switch (viewMode) {
      case "day":
        return "timeGridDay";
      case "week":
        return "timeGridWeek";
      case "month":
      default:
        return "dayGridMonth";
    }
  };

  const getHeaderToolbar = () => {
    const baseLeft = "prev,next today";
    const baseCenter = "title";

    if (isMobile) {
      return {
        left: "prev,next",
        center: "title",
        right: "",
      };
    }

    switch (viewMode) {
      case "day":
        return {
          left: baseLeft,
          center: baseCenter,
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        };
      case "week":
        return {
          left: baseLeft,
          center: baseCenter,
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        };
      case "month":
      default:
        return {
          left: baseLeft,
          center: baseCenter,
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        };
    }
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <Loader text="Loading calendar..." />
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={getCalendarView()}
        events={events}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        height="auto"
        locale="en"
        headerToolbar={getHeaderToolbar()}
        eventDisplay="block"
        dayMaxEvents={viewMode === "month" ? 3 : false}
        moreLinkClick="popover"
        firstDay={1}
        weekends={true}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={true}
        nowIndicator={viewMode !== "month"}
        eventContent={(arg) => (
          <div
            className="custom-event"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Event content clicked:", arg.event.id);
              if (onTaskClick) {
                onTaskClick(arg.event.id);
              }
            }}
          >
            <div className="event-title">{arg.event.title}</div>
            {arg.event.extendedProps.assignee &&
              !isMobile &&
              viewMode === "month" && (
                <div className="event-assignee">
                  <Avatar
                    src={arg.event.extendedProps.assignee.image || null}
                    alt={arg.event.extendedProps.assignee.name}
                    size={isMobile ? 16 : 20}
                  />
                  <span className="event-assignee-name">
                    {arg.event.extendedProps.assignee.name}
                  </span>
                </div>
              )}
          </div>
        )}
        eventClassNames="calendar-event-clickable"
      />
    </div>
  );
};

export default Calendar;
