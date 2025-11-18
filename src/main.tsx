// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css"; // keep this BEFORE your own CSS
import "./index.css";
import enUS from "antd/locale/en_US"; // ✅ correct locale import for antd v5
import App from "./App";

// TIP: If you really want Tailwind colors here, add a d.ts for 'tailwindcss/colors'
// or just hardcode the hex you want. Using antd's purple-6 (#722ed1) is safe.
const PRIMARY = "#6D65B9"; // Ant Design purple-6

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
            subMenuItemBg: "#fff", // override submenu item container
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
