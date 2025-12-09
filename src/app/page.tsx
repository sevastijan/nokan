'use client';

import AuthButton from './GoogleLogin/AuthButton';

export default function Home() {
     return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6">
               <div className="bg-slate-800/80 border border-slate-700/50 rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-8 max-w-md w-full">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 text-center drop-shadow-lg">Nokan Taskboard</h1>
                    <p className="text-lg md:text-xl text-slate-300 text-center max-w-lg">
                         Zarządzaj zadaniami, projektami i zespołem &ndash; <b>za darmo</b>.
                         <br />
                         Prosty, szybki i intuicyjny kanban dla każdego.
                    </p>
                    <AuthButton />
                    <div className="text-xs text-slate-500 pt-2 text-center">Nie masz konta? Zaloguj się przez Google – utworzymy je automatycznie.</div>
               </div>
          </div>
     );
}
