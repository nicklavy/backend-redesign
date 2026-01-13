// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css"; // keep this BEFORE your own CSS
import "./index.css";
import enUS from "antd/locale/en_US";
import App from "./App";

// you can keep using this as your brand color
const PRIMARY = "#2a4388ff";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={enUS}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: PRIMARY,
          borderRadius: 4,
          fontSize: 14,
        },
        components: {
          Menu: {
            subMenuItemBg: "#fff",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);