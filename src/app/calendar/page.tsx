// app/calendar/page.tsx
"use client";

import Calendar from "@/app/components/Calendar";

const CalendarPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-4 border">
        <h1 className="text-2xl font-semibold">My Calendar </h1>
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
