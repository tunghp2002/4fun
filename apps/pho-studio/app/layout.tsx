import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: "Phố Studio — Không gian Việt, góc nhìn mới",
  description:
    "Dựng một góc Việt Nam từ địa điểm thật. Khám phá cảnh 3D, chọn ánh sáng, lưu góc nhìn và xuất ảnh hoặc mô hình.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f9f4",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
