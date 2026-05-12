import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { liveProvider } from "@refinedev/supabase";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header, Sider } from "./components";
import { ColorModeContextProvider } from "./contexts/color-mode";
import authProvider from "./providers/auth";
import { dataProvider } from "./providers/data";
import { supabaseClient } from "./providers/supabase-client";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsListPage } from "./pages/StudentsListPage";
import { StudentShowPage } from "./pages/StudentShowPage";
import { CheckinPage } from "./pages/CheckinPage";
import { CheckinHistoryPage } from "./pages/CheckinHistoryPage";
import { TermSettingsPage, TermDetailPage, AdminProfilePage } from "./pages";

import {
  CheckCircleOutlined,
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerProvider}
                notificationProvider={useNotificationProvider}
                resources={[
                  {
                    name: "dashboard",
                    list: "/dashboard",
                    meta: { label: "Dashboard", icon: <DashboardOutlined /> },
                  },
                  {
                    name: "students",
                    list: "/students",
                    show: "/students/:id",
                    meta: {
                      label: "Students",
                      icon: <TeamOutlined />,
                    },
                  },
                  {
                    name: "checkins",
                    list: "/checkins",
                    meta: {
                      label: "Check-in",
                      icon: <CheckCircleOutlined />,
                    },
                  },
                  {
                    name: "terms",
                    list: "/terms",
                    meta: {
                      label: "Term Settings",
                      icon: <SettingOutlined />,
                    },
                  },
                  {
                    name: "profile",
                    list: "/profile",
                    meta: {
                      label: "Profile",
                      icon: <UserOutlined />,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "8L9MvE-RfIG5B-Y5ZXDw",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <ThemedLayout Header={Header} Sider={Sider}>
                            <div style={{ marginLeft: 220, padding: 24 }}>
                              <Outlet />
                            </div>
                          </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="dashboard" />}
                    />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/students" element={<StudentsListPage />} />
                    <Route path="/students/:id" element={<StudentShowPage />} />
                    <Route path="/checkins" element={<CheckinPage />} />
                    <Route
                      path="/checkins/history"
                      element={<CheckinHistoryPage />}
                    />
                    <Route path="/terms" element={<TermSettingsPage />} />
                    <Route path="/terms/:id" element={<TermDetailPage />} />
                    <Route path="/profile" element={<AdminProfilePage />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<LoginPage />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
