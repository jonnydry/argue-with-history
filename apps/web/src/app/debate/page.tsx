"use client";

import dynamic from "next/dynamic";

const DebatePageContent = dynamic(
  () => import("./DebatePageContent").then((m) => m.default),
  { ssr: false }
);

export default function DebatePage() {
  return <DebatePageContent />;
}
