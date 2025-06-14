// src/app/layout.tsx (or wherever your RootLayout lives)
import { ToastContainer } from "react-toastify";
import "./styles/globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import { metadata } from "./metadata";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Providers>
          <Navbar />
          <main className="main-content min-h-screen md:ml-64">{children}</main>
          {/* Toast notifications */}
          <ToastContainer position="top-right" autoClose={3000} />

          {/* Portal root for context menus, modals, tooltips, etc. */}
          {/* This div sits at the end of <body>, outside clipped containers */}
          <div id="menu-portal-root" />
        </Providers>
      </body>
    </html>
  );
}
