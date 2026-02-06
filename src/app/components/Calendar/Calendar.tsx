"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarProps, CalendarEvent } from "@/app/types/globalTypes";
import "../Calendar/calendar.css";
import Avatar from "../Avatar/Avatar";

// Convert priority string into a color
const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
    case "urgent":
      return "#ef4444";
    case "medium":
    case "normal":
      return "#eab308";
    case "low":
      return "#10b981";
    default:
      return "#6b7280";
  }
};

const Calendar = ({
  events,
  viewMode = "month",
  onTaskClick,
}: CalendarProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get calendar view based on mode
  const getCalendarView = () => {
    switch (viewMode) {
      case "day":
        return "timeGridDay";
      case "week":
        return "timeGridWeek";
      default:
        return "dayGridMonth";
    }
  };

  // Get toolbar layout
  const getHeaderToolbar = () => {
    if (isMobile) {
      return { left: "prev,next", center: "title", right: "" };
    }
    return {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    };
  };

  const calendarEvents: CalendarEvent[] = (events ?? []).map((task) => {
    const start = (task.start ?? new Date().toISOString()).split("T")[0];

    const end = task.end ? task.end.split("T")[0] : start;

    const priority = task.priority ?? "low";
    return {
      ...task,
      start,
      end,
      priority,
      backgroundColor: getPriorityColor(priority),
      borderColor: getPriorityColor(priority),
      extendedProps: {
        priority,
        assignee: task.assignee ?? null,
        description: task.description ?? "",
      },
    };
  });

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={getCalendarView()}
        events={calendarEvents}
        editable={false}
        droppable={false}
        eventClick={(info) => onTaskClick?.(info.event.id)}
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
        eventClassNames="calendar-event-clickable"
        eventContent={(arg) => (
          <div
            className="custom-event"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick?.(arg.event.id);
            }}
          >
            <div className="event-title font-semibold">{arg.event.title}</div>
            {arg.event.extendedProps.assignee &&
              !isMobile &&
              viewMode === "month" && (
                <div className="event-assignee flex items-center gap-1 mt-1">
                  <Avatar
                    src={arg.event.extendedProps.assignee.image || null}
                    alt={arg.event.extendedProps.assignee.name}
                    size={isMobile ? 16 : 20}
                  />
                  <span className="event-assignee-name text-xs truncate">
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
