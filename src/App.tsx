import React, { useState } from "react";
import { ProductProvider } from "./ProductProvider";
import ReportTablePage from "./ReportTablePage";
import DailyReportPage from "./DailyReportPage";
import SpaServicesPage from "./SpaServicesPage";
import Shell from "./layout/Shell";

const App: React.FC = () => {
  const [activePage, setActivePage] = useState("daily-report");

  // Direct link: /dynamicpricing opens the Dynamic Pricing page on its own.
  const path = window.location.pathname.replace(/\/+$/, "").toLowerCase();
  if (path === "/dynamicpricing") {
    return (
      <ProductProvider>
        <SpaServicesPage initialTab="dynamic_pricing" />
      </ProductProvider>
    );
  }

  if (activePage === "daily-report") {
    return (
      <ProductProvider>
        <Shell activePage={activePage} onNavigate={setActivePage}>
          <DailyReportPage />
        </Shell>
      </ProductProvider>
    );
  }

  return (
    <ProductProvider>
      <ReportTablePage />
    </ProductProvider>
  );
};

export default App;