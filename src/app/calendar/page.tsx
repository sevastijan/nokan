'use client';

import Calendar from '@/app/components/Calendar/Calendar';

const CalendarPage = () => {
     return (
          <div className="min-h-screen bg-slate-900">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent pointer-events-none" />
               <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
                    <Calendar />
               </main>
          </div>
     );
};

export default CalendarPage;
