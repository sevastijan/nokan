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
          <main className="main-content min-h-screen">{children}</main>
          <ToastContainer position="top-right" autoClose={3000} />
        </Providers>
      </body>
    </html>
  );
}
