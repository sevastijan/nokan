import { redirect } from 'next/navigation';
import { getSupabase } from '@/app/lib/supabase';
import AuthButton from './GoogleLogin/AuthButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
     const supabase = getSupabase();

     const {
          data: { session },
     } = await supabase.auth.getSession();

     if (session) {
          redirect('/dashboard');
     }

     return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
               <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 -right-32 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />
               </div>

               <div className="relative z-10 w-full max-w-5xl">
                    <div className="text-center mb-16">
                         <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-purple-500 to-blue-500 tracking-tight">NOKAN</h1>
                         <p className="mt-6 text-2xl md:text-3xl font-medium text-slate-300">
                              Manage tasks, projects, and teams — <span className="text-purple-400 font-bold">completely free</span>.
                         </p>
                         <p className="mt-3 text-lg md:text-xl text-slate-400">Simple, fast, and intuitive Kanban for everyone.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                         <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                              <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                   </svg>
                              </div>
                              <h3 className="text-xl font-semibold text-slate-100 mb-2">Intuitive Kanban</h3>
                              <p className="text-slate-400 text-sm">Drag and drop tasks between columns with ease</p>
                         </div>

                         <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                             strokeLinecap="round"
                                             strokeLinejoin="round"
                                             strokeWidth={2}
                                             d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                        />
                                   </svg>
                              </div>
                              <h3 className="text-xl font-semibold text-slate-100 mb-2">Team Collaboration</h3>
                              <p className="text-slate-400 text-sm">Add members, assign tasks, and work together</p>
                         </div>

                         <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 text-center">
                              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                   <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                   </svg>
                              </div>
                              <h3 className="text-xl font-semibold text-slate-100 mb-2">Lightning Fast</h3>
                              <p className="text-slate-400 text-sm">Built for performance — instant response</p>
                         </div>
                    </div>

                    <div className="max-w-md mx-auto">
                         <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl p-10">
                              <h2 className="text-2xl font-bold text-slate-100 text-center mb-8">Get Started in Seconds</h2>

                              <AuthButton />

                              <p className="mt-6 text-center text-sm text-slate-500">No account? Sign in with Google — we’ll create one automatically.</p>
                         </div>

                         <p className="text-center mt-8 text-xs text-slate-600">Open-source • Completely free • No limits</p>
                    </div>
               </div>
          </div>
     );
}
