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
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
