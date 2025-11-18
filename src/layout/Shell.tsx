// src/layout/Shell.tsx
import React from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
};

export default Shell;