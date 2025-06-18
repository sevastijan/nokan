// app/calendar/page.tsx
"use client";

import React from "react";
import Calendar from "@/app/components/Calendar";

const CalendarPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <h1 className="text-2xl font-semibold">Mój Kalendarz</h1>
      </header>
      <main className="p-4">
        <div className="max-w-7xl mx-auto">
          <Calendar />
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
