import { useGetIdentity } from "@refinedev/core";
import {
  Avatar,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  MailOutlined,
  SafetyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { supabaseClient } from "../providers/supabase-client";

const { Text } = Typography;

export const AdminProfilePage: React.FC = () => {
  const { data: user } = useGetIdentity<any>();
  const [adminRecord, setAdminRecord] = useState<any>(null);

  useEffect(() => {
    if (!user?.email) return;
    supabaseClient
      .from("admins")
      .select("*")
      .eq("email", user.email)
      .maybeSingle()
      .then(({ data }) => setAdminRecord(data));
  }, [user?.email]);

  const email = user?.email || "admin@rca.edu";
  const fullName = adminRecord?.full_name || email?.split("@")[0] || "Admin";
  const createdAt = adminRecord?.created_at || user?.created_at;

  return (
    <div>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
          maxWidth: 640,
          margin: "0 auto",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            height: 140,
            background: "linear-gradient(135deg, #00A896 0%, #007A6E 50%, #1D3557 100%)",
            borderRadius: "16px 16px 0 0",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 24,
              bottom: 16,
              fontSize: 56,
              fontWeight: 800,
              color: "rgba(255,255,255,0.06)",
              letterSpacing: -2,
            }}
          >
            ADMIN
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: -50,
            paddingBottom: 24,
          }}
        >
          <Avatar
            size={100}
            style={{
              background: "linear-gradient(135deg, #00A896, #007A6E)",
              border: "4px solid #FFF",
              boxShadow: "0 4px 20px rgba(0,168,150,0.25)",
              fontSize: 36,
              fontWeight: 700,
              color: "#FFF",
            }}
          >
            {fullName
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "A"}
          </Avatar>

          <Text
            strong
            style={{ fontSize: 22, color: "#1D3557", marginTop: 12 }}
          >
            {fullName}
          </Text>

          <Space style={{ marginTop: 4 }} size={8}>
            <Tag
              icon={<MailOutlined />}
              style={{
                borderRadius: 20,
                background: "#E0F5F2",
                color: "#007A6E",
                border: "1px solid #B2E8E2",
              }}
            >
              {email}
            </Tag>
            <Tag
              icon={<SafetyOutlined />}
              color="#00A896"
              style={{ borderRadius: 20 }}
            >
              Administrator
            </Tag>
          </Space>

          {createdAt && (
            <Tag
              icon={<CalendarOutlined />}
              style={{
                borderRadius: 20,
                marginTop: 4,
                background: "#FFFBE6",
                border: "1px solid #FFE58F",
                color: "#AD8B00",
              }}
            >
              Member since {dayjs(createdAt).format("MMMM YYYY")}
            </Tag>
          )}
        </div>
      </Card>

      <Card
        title={
          <Space>
            <UserOutlined style={{ color: "#00A896" }} />
            <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
              Account Details
            </Text>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
          maxWidth: 640,
          margin: "16px auto 0",
        }}
      >
        <Descriptions
          column={1}
          labelStyle={{ color: "#6C757D", width: 160 }}
          contentStyle={{ color: "#1D3557", fontWeight: 500 }}
        >
          <Descriptions.Item label="Full Name">{fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">
            <a href={`mailto:${email}`} style={{ color: "#00A896" }}>
              {email}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="Role">System Administrator</Descriptions.Item>
          <Descriptions.Item label="Account Created">
            {createdAt
              ? dayjs(createdAt).format("DD MMMM YYYY · HH:mm")
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Auth Provider">Supabase</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};
