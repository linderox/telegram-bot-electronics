import React from 'react';

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/flatpickr.css";
import '@xyflow/react/dist/style.css';
import 'react-toastify/dist/ReactToastify.css';
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { init } from "./init.ts";
import { retrieveLaunchParams, viewport } from "@telegram-apps/sdk-react";

const root = createRoot(document.getElementById("root")!);

(async () => {
  try {
    // Инициализируем Telegram Mini App только в production
    if (import.meta.env.PROD) {
      const launchParams = retrieveLaunchParams();
      const { tgWebAppPlatform: platform } = launchParams;
      const debug = false;

      await init({
        debug,
        eruda: debug && ['ios', 'android'].includes(platform),
        mockForMacOS: platform === 'macos',
      });

      // Расширяем окно для десктопной версии
      if (['macos', 'win', 'linux'].includes(platform)) {
        viewport.expand();
      }
    }

    root.render(
      <StrictMode>
        <ThemeProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </ThemeProvider>
      </StrictMode>
    );
  } catch {
    root.render(<div>Ошибка при загрузке приложения</div>);
  }
})();