import "./styles/globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "NOKODE Task Board",
  description: "Task board application built with Next.js and Redux",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
