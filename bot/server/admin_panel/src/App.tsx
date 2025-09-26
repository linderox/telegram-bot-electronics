import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router";

import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import UsersList from './pages/Users/UsersList';
import UsersAiChat from './pages/Assistent/UsersAiChat';
import AssistentSettings from './pages/Assistent/Settings';

import Menu from './pages/Menu/Menu';
import LogsPage from './pages/Settings/Logs';
import SettingsPage from './pages/Settings/Settings';


export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<UsersList />} />

            <Route path="/users-list" element={<UsersList />} />
            <Route path="/ai-chat" element={<UsersAiChat />} />
            <Route path="/ai-settings" element={<AssistentSettings />} />

            <Route path="/menu-settings" element={<Menu />} />

            <Route path="/logs" element = {<LogsPage />}/>
            <Route path="/settings" element = {<SettingsPage />}/>
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
