import { useGetIdentity, useList, useLogout } from "@refinedev/core";
import {
  Avatar,
  Badge,
  Dropdown,
  Layout as AntdLayout,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  CheckCircleOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router";
import dayjs from "dayjs";

const { Text } = Typography;

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/students/create": "Enroll Student",
  "/checkins": "Check-in",
  "/checkins/history": "Check-in History",
};

export const Header: React.FC = () => {
  const { data: user } = useGetIdentity<any>();
  const { mutate: logout } = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const [liveDot, setLiveDot] = useState(false);

  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] || "Dashboard";

  const { result: checkinsResult } = useList({
    resource: "checkins",
    pagination: { pageSize: 1 },
    filters: [
      { field: "checked_in_at", operator: "gte", value: dayjs().startOf("day").toISOString() },
    ],
    liveMode: "auto",
  });

  useEffect(() => {
    setLiveDot(true);
    const t = setTimeout(() => setLiveDot(false), 2000);
    return () => clearTimeout(t);
  }, [checkinsResult?.total]);

  const dropdownItems = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "My Profile",
        onClick: () => navigate("/profile"),
      },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Logout",
        danger: true,
        onClick: () => logout(),
      },
    ],
  };

  return (
    <AntdLayout.Header
      style={{
        height: 64,
        background: "#FFFFFF",
        borderBottom: "1px solid #E9ECEF",
        boxShadow: "0 2px 8px rgba(0,168,150,0.06)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 600, color: "#1D3557" }}>
        {pageTitle}
        {liveDot && (
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: "#10B981",
              borderRadius: "50%",
              marginLeft: 8,
              animation: "pulse 2s infinite",
              verticalAlign: "middle",
            }}
          />
        )}
      </Text>
      <Space size={20}>
        <Tooltip title="Students checked in today">
          <Badge
            count={checkinsResult?.total || 0}
            style={{ backgroundColor: "#00A896" }}
            showZero
          >
            <CheckCircleOutlined
              style={{ fontSize: 20, color: "#6C757D", cursor: "pointer" }}
            />
          </Badge>
        </Tooltip>
        <Dropdown menu={dropdownItems} placement="bottomRight">
          <Space style={{ cursor: "pointer" }}>
            <Avatar style={{ background: "#00A896" }}>
              {user?.email?.[0]?.toUpperCase() || "A"}
            </Avatar>
            <Text style={{ color: "#6C757D", maxWidth: 160 }} ellipsis>
              {user?.email || "admin@rca.edu"}
            </Text>
          </Space>
        </Dropdown>
      </Space>
    </AntdLayout.Header>
  );
};
