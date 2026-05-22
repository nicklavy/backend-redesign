// src/layout/Shell.tsx
import React from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

type ShellProps = {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
};

const Shell: React.FC<ShellProps> = ({ children, activePage, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
};

export default Shell;