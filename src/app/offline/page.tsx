'use client';

export default function OfflinePage() {
     return (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900">
               <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
               </div>

               <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
                    <h1 className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-5xl font-black tracking-[0.2em] text-transparent">
                         NOKAN
                    </h1>

                    <div className="flex flex-col items-center gap-2">
                         <svg
                              className="h-12 w-12 text-slate-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                         >
                              <path
                                   strokeLinecap="round"
                                   strokeLinejoin="round"
                                   d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                              />
                         </svg>

                         <p className="text-lg font-medium text-slate-300">Brak połączenia</p>
                         <p className="max-w-sm text-sm text-slate-500">
                              Sprawdź połączenie z internetem i spróbuj ponownie.
                         </p>
                    </div>

                    <button
                         onClick={() => window.location.reload()}
                         className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                         Spróbuj ponownie
                    </button>
               </div>
          </div>
     );
}
