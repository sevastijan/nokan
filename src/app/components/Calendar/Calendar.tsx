"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarProps, CalendarEvent } from "@/app/types/globalTypes";
import "../Calendar/calendar.css";
import Avatar from "../Avatar/Avatar";

const Calendar = ({
  events,
  viewMode = "month",
  onTaskClick,
}: CalendarProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Determine if the device is mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Convert priority string into a corresponding color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
      case "urgent":
        return "#ef4444";
      case "medium":
      case "normal":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // Choose calendar view based on view mode
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
    const baseLeft = "prev,next today";
    const baseCenter = "title";

    if (isMobile) {
      return { left: "prev,next", center: "title", right: "" };
    }

    return {
      left: baseLeft,
      center: baseCenter,
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    };
  };

  // Transform tasks into FullCalendar-compatible events
  const calendarEvents: CalendarEvent[] = (events ?? []).map((task) => {
    const start = task.start ?? new Date().toISOString();

    const rawEnd = task.end ?? task.start ?? new Date().toISOString();
    const endDate = new Date(rawEnd);
    endDate.setDate(endDate.getDate() + 1); // Make exclusive per FullCalendar rules

    const end = endDate.toISOString().split("T")[0];
    const priority = task.priority ?? "low";

    return {
      id: task.id,
      title: task.title ?? "Unnamed Task",
      start,
      end,
      priority,
      assignee: task.assignee ?? null,
      description: task.description ?? "",
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
