import type { Metadata } from "next";
import "./globals.css";
import "./fullstack.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const metadata: Metadata = {
  title: "HireME — Talent finds you",
  description: "A candidate-first hiring platform built for fairer, faster recruitment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
