import "./styles/globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Nokan Taskboard",
  description: "Taskboard application",
};

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
          <main className="p-4 md:p-0 md:ml-64 min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
