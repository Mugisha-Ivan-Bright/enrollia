import { useLogin } from "@refinedev/core";
import { Button, Form, Input, message, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";

const { Text, Title } = Typography;

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const { mutate: login } = useLogin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = (values: { email: string; password: string }) => {
    setLoading(true);
    login(values, {
      onSuccess: (data) => {
        setLoading(false);
        if (data?.success) {
          navigate("/dashboard");
        } else {
          message.error("Invalid credentials. Please check your email and password and try again.");
        }
      },
      onError: () => {
        setLoading(false);
        message.error("Invalid credentials. Please check your email and password and try again.");
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#E8F7F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(960px, 95vw)",
          borderRadius: 24,
          background: "#FFFFFF",
          boxShadow: "0 8px 48px rgba(0,168,150,0.10)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
        }}
        className="login-grid"
      >
        <div
          style={{
            background: "#F0FAF9",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
          }}
          className="login-left"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
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
              }}
            >
              E
            </div>
            <span style={{ color: "#1D3557", fontWeight: 700, fontSize: 20 }}>
              Enrollia.
            </span>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{ color: "#1D3557", fontWeight: 700, fontSize: 32, lineHeight: 1.3 }}>
              Streamline Your
            </div>
            <div style={{ color: "#1D3557", fontWeight: 700, fontSize: 32, lineHeight: 1.3 }}>
              Student
            </div>
            <div style={{ color: "#00A896", fontWeight: 700, fontSize: 32, lineHeight: 1.3 }}>
              Enrollment.
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
            <svg
              viewBox="0 0 400 300"
              style={{ width: "100%", height: "auto" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="400" height="300" fill="#F0FAF9" />
              <path d="M200 60 L320 140 L320 240 L200 260 L80 240 L80 140 Z" fill="#00A896" opacity="0.15" />
              <path d="M200 80 L300 150 L300 230 L200 250 L100 230 L100 150 Z" fill="#00A896" opacity="0.25" />
              <path d="M200 100 L280 160 L280 220 L200 240 L120 220 L120 160 Z" fill="#00A896" opacity="0.4" />
              <rect x="185" y="140" width="30" height="40" rx="4" fill="#00A896" />
              <rect x="160" y="120" width="20" height="80" rx="3" fill="#00A896" opacity="0.6" />
              <rect x="220" y="130" width="20" height="60" rx="3" fill="#00A896" opacity="0.6" />
              <circle cx="200" cy="110" r="15" fill="#1D3557" />
              <path d="M140 220 Q200 180 260 220" fill="none" stroke="#1D3557" strokeWidth="2" opacity="0.3" />
              <circle cx="100" cy="90" r="8" fill="#00A896" opacity="0.3" />
              <circle cx="310" cy="80" r="12" fill="#00A896" opacity="0.2" />
              <circle cx="340" cy="180" r="6" fill="#00A896" opacity="0.25" />
              <circle cx="70" cy="170" r="10" fill="#00A896" opacity="0.15" />
              <text x="200" y="280" textAnchor="middle" fill="#6C757D" fontSize="11">Student Enrollment Management</text>
            </svg>
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            padding: "56px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Title level={2} style={{ fontSize: 26, fontWeight: 700, color: "#1D3557", margin: 0 }}>
            Welcome to Enrollia
          </Title>
          <Text
            style={{
              fontSize: 13,
              color: "#6C757D",
              marginBottom: 32,
              display: "block",
              marginTop: 4,
            }}
          >
            RCA Institution Admin Portal
          </Text>

          <div
            style={{
              background: "#FFF3CD",
              border: "1px solid #FFE69C",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: 13,
              color: "#856404",
            }}
          >
            <strong>Demo Credentials</strong><br />
            Email: <code>info@refine.dev</code><br />
            Password: <code>refine-supabase</code>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            initialValues={{
              email: "info@refine.dev",
              password: "refine-supabase",
            }}
          >
            <Form.Item
              label="Email address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                size="large"
                placeholder="admin@rca.edu"
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                size="large"
                placeholder="Enter password"
                style={{ borderRadius: 8, height: 48 }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                background: "#00A896",
                border: "none",
                borderRadius: 8,
                height: 48,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Sign In
            </Button>
          </Form>

          <Text
            style={{
              fontSize: 12,
              color: "#ADB5BD",
              textAlign: "center",
              marginTop: 32,
              display: "block",
            }}
          >
            &copy; RCA Institution. Admin access only.
          </Text>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-grid {
            grid-template-columns: 1fr !important;
          }
          .login-left {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
