import { Providers } from "./providers";
import "../styles/globals.css";

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
      <body className="bg-gray-900 text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
