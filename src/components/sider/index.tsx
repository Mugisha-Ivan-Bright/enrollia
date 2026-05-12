import { useMenu, useLogout } from "@refinedev/core";
import { Layout, Menu, Button, Tooltip } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <DashboardOutlined />,
  Students: <TeamOutlined />,
  "Check-in": <CheckCircleOutlined />,
  History: <HistoryOutlined />,
  "Term Settings": <SettingOutlined />,
};

export const Sider: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { menuItems, selectedKey } = useMenu();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const isHistory = location.pathname === "/checkins/history";
  const activeKey = isHistory ? "/checkins/history" : selectedKey;

  const items = menuItems
    .filter((item: any) => item.name !== "checkins" || !item.list?.includes("history"))
    .filter((item: any) => item.name !== "profile")
    .map((item: any) => {
      const label = item.meta?.label || item.name;
      return {
        key: item.list || item.route || item.name,
        icon: iconMap[label] || item.meta?.icon,
        label,
      };
    });

  const historyItem = {
    key: "/checkins/history",
    icon: <HistoryOutlined />,
    label: "History",
  };

  items.push(historyItem);

  return (
    <Layout.Sider
      width={220}
      collapsedWidth={72}
      collapsed={collapsed}
      theme="light"
      style={{
        background: "#FFFFFF",
        borderRight: "1px solid #E9ECEF",
        boxShadow: "2px 0 16px rgba(0,168,150,0.06)",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        overflow: "auto",
        zIndex: 10,
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 20px",
          gap: 10,
          borderBottom: "1px solid #E9ECEF",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#00A896",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFF",
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          E
        </div>
        {!collapsed && (
          <span
            style={{
              color: "#1D3557",
              fontWeight: 700,
              fontSize: 18,
              whiteSpace: "nowrap",
            }}
          >
            Enrollia.
          </span>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={items}
        style={{
          borderRight: 0,
          padding: "8px 0",
          background: "#FFF",
        }}
        onClick={({ key }) => navigate(key)}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid #E9ECEF",
          padding: "8px 0",
          background: "#FFF",
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[]}
          items={[
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: "Logout",
              onClick: () => logout(),
            },
          ]}
          style={{ borderRight: 0, background: "#FFF" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4px 16px",
          }}
        >
          <Tooltip title={collapsed ? "Expand" : "Collapse"}>
            <Button
              type="text"
              size="small"
              icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: "#ADB5BD" }}
            />
          </Tooltip>
        </div>
      </div>
    </Layout.Sider>
  );
};
