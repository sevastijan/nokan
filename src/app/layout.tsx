// src/app/layout.tsx
import "./styles/globals.css";
import { Providers } from "./providers";
import ClientLayout from "./ClientLayout";
import "react-toastify/dist/ReactToastify.css";

// Force dynamic rendering for all pages - no static generation during build
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Nokan Taskboard",
  description: "Taskboard application",
};

/**
 * RootLayout is a Server Component.
 * It wraps everything with Providers, then delegates rendering to ClientLayout,
 * which handles session-based rendering of Navbar and content margin.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100">
        <Providers>
          {/* ClientLayout is a client-only component that uses useSession */}
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
