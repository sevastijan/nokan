"use client";

import AuthButton from "./GoogleLogin/AuthButton";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-gray-950 p-6">
      <div className="bg-black/50 rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-8 max-w-[430] w-full]">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center drop-shadow-lg">
          Nokan Taskboard
        </h1>
        <p className="text-lg md:text-xl text-purple-200 text-center max-w-lg">
          Zarządzaj zadaniami, projektami i zespołem &ndash; <b>za darmo</b>.
          <br />
          Prosty, szybki i intuicyjny kanban dla każdego.
        </p>
        <AuthButton />
        <div className="text-xs text-gray-400 pt-2 text-center">
          Nie masz konta? Zaloguj się przez Google – utworzymy je automatycznie.
        </div>
      </div>
    </div>
  );
}
