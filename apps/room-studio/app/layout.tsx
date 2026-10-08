import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Room Studio — Plan it. Feel it.",
  description:
    "A connected 2D floor plan and 3D interior studio. Shape your rooms, arrange furniture and explore the light.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
