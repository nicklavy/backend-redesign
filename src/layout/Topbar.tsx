// src/layout/Topbar.tsx
import React, { useState } from "react";
import { useProduct, ProductKey } from "../ProductProvider";

const productLabels: Record<ProductKey, string> = {
  control: "Control Center",
  spa: "Spa & Wellness",
  pool: "Pool & Beach",
  activities: "Activities",
  compendium: "Digital Compendium",
  fnb: "Food & Beverage",
  restaurant: "Restaurant",
};

const Topbar: React.FC = () => {
  const {
    product,
    setProduct,
    locationsByProduct,
    selectedLocation,
    setSelectedLocation,
  } = useProduct();

  const [open, setOpen] = useState(false); // avatar dropdown open/close

  const locations = locationsByProduct[product];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: (space for back arrow or product name if you want later) */}
        <div className="flex items-center gap-2 min-w-[160px]">
          {/* Placeholder for back arrow if you ever add it */}
        </div>

        {/* Center: Brand */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-teal-400 flex items-center justify-center text-xs font-semibold text-white">
              S
            </div>
            <div className="leading-tight text-center">
              <div className="font-semibold text-sm tracking-wide">
                SOLUNA
              </div>
              <div className="text-[11px] text-slate-500">
                HOTELS &amp; RESORTS
              </div>
            </div>
          </div>
        </div>

        {/* Right: Location selector + avatar */}
        <div className="flex items-center gap-4 min-w-[260px] justify-end relative">
          {/* Location selector (scoped by product) */}
          <div className="relative">
            <select
              className="h-9 min-w-[200px] rounded-lg border border-slate-300 bg-slate-50/60 px-3 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 appearance-none"
              value={selectedLocation.id}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400 text-xs">
              ⌄
            </span>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              type="button"
              className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400"
              onClick={() => setOpen((o) => !o)}
            >
              {/* Replace with real image if you want */}
              <img
                src="https://images.pexels.com/photos/164656/pexels-photo-164656.jpeg?auto=compress&cs=tinysrgb&w=80"
                alt="Admin avatar"
                className="w-full h-full object-cover"
              />
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
                onMouseLeave={() => setOpen(false)}
              >
                {/* User block */}
                <div className="p-4 flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200">
                    <img
                      src="https://images.pexels.com/photos/164656/pexels-photo-164656.jpeg?auto=compress&cs=tinysrgb&w=80"
                      alt="Admin avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold text-slate-900">
                      Willie Nelson
                    </div>
                    <div className="text-xs text-slate-500">Admin Level 2</div>
                    <div className="text-xs text-violet-600 mt-1">
                      willienelson@email.com
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                {/* Product list */}
                <div className="py-2 max-h-72 overflow-y-auto">
                  {(Object.keys(productLabels) as ProductKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setProduct(key);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 hover:bg-slate-50 ${
                        product === key ? "bg-slate-100" : ""
                      }`}
                    >
                      <span className="font-medium text-sm text-slate-900">
                        {productLabels[key]}
                      </span>
                      <span className="text-xs text-slate-500">
                        Settings, controls and dashboard
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-200" />

                {/* Logout button */}
                <div className="p-3">
                  <button
                    type="button"
                    className="w-full h-10 rounded-full bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;