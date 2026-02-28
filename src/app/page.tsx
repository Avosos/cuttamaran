"use client";

import dynamic from "next/dynamic";

const EditorLayout = dynamic(
  () => import("@/components/editor/editor-layout"),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-screen" style={{ background: "#06060a" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7c5cfc, #e879f9)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
          </svg>
        </div>
        <span style={{ color: "#606075", fontSize: "13px" }}>Loading Cuttamaran...</span>
      </div>
    </div>
  )}
);

export default function Home() {
  return <EditorLayout />;
}
