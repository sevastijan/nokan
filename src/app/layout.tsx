import "./styles/globals.css";
import { Providers } from "./providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
