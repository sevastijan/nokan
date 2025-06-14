import { ToastContainer } from "react-toastify";
import "./styles/globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import "react-toastify/dist/ReactToastify.css";

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
          <main className="main-content min-h-screen md:ml-64 ">
            {children}
          </main>
          <ToastContainer
            position="top-right"
            autoClose={2500}
            className="nokan-toastify"
            toastClassName=""
          />
        </Providers>
      </body>
    </html>
  );
}
