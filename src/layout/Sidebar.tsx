// src/layout/Sidebar.tsx
import React from "react";
import { useProduct, ProductKey } from "../ProductProvider";

type NavItem = {
  id: string;
  label: string;
};

type ProductNav = Record<ProductKey, NavItem[]>;


const navByProduct: ProductNav = {
  control: [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users & Roles" },
    { id: "audit", label: "Audit Log" },
    { id: "billing", label: "Billing" },
  ],
  spa: [
    { id: "booking", label: "Booking Console" },
    { id: "customers", label: "Customers" },
    { id: "staff", label: "Staff" },
    { id: "reporting", label: "Reporting" },
    { id: "daily-report", label: "Daily Report" },
    { id: "resources", label: "Resources" },
    { id: "retail", label: "Retail" },
    { id: "settings", label: "Settings" },
  ],
  pool: [
    { id: "inventory", label: "Inventory" },
    { id: "pricing", label: "Pricing" },
    { id: "cabanas", label: "Cabanas" },
    { id: "reporting", label: "Reporting" },
  ],
  activities: [
    { id: "calendar", label: "Activity Calendar" },
    { id: "waivers", label: "Waivers" },
    { id: "providers", label: "Providers" },
    { id: "reporting", label: "Reporting" },
  ],
  compendium: [
    { id: "pages", label: "Pages" },
    { id: "sections", label: "Sections" },
    { id: "analytics", label: "Analytics" },
  ],
  fnb: [
    { id: "menus", label: "Menus" },
    { id: "orders", label: "Orders" },
    { id: "reporting", label: "Reporting" },
  ],
  restaurant: [
    { id: "res", label: "Reservations" },
    { id: "floorplan", label: "Floorplan" },
    { id: "waitlist", label: "Waitlist" },
    { id: "reporting", label: "Reporting" },
  ],
};

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { product } = useProduct();
  const navItems = navByProduct[product];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 py-4 px-3 flex flex-col gap-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
            activePage === item.id
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-900 hover:bg-slate-50"
          }`}
          onClick={() => onNavigate(item.id)}
        >
          <div className="flex items-center gap-2">
            {/* Placeholder for icons – dev team can swap with real icons/NavIcon later */}
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[13px] ${
                activePage === item.id ? "bg-white/15" : "bg-slate-100"
              }`}
            >
              📋
            </span>
            <span
              className={`text-sm font-medium ${
                activePage === item.id ? "text-white" : "text-slate-900"
              }`}
            >
              {item.label}
            </span>
          </div>
          <span className={`text-xs ${activePage === item.id ? "text-white/70" : "text-slate-400"}`}>⌄</span>
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;