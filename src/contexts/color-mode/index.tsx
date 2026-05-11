import { ConfigProvider } from "antd";
import type { PropsWithChildren } from "react";

const themeConfig = {
  token: {
    colorPrimary: "#00A896",
    colorPrimaryHover: "#008F7E",
    colorPrimaryActive: "#007A6E",
    colorBgLayout: "#E8F7F5",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorTextHeading: "#1D3557",
    colorText: "#2C3E50",
    colorTextSecondary: "#6C757D",
    colorTextDisabled: "#ADB5BD",
    colorBorder: "#DEE2E6",
    colorBorderSecondary: "#E9ECEF",
    borderRadius: 8,
    borderRadiusLG: 16,
    fontFamily: "'Inter', 'DM Sans', sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
  },
  components: {
    Button: {
      primaryShadow: "none",
    },
    Card: {
      boxShadow: "0 4px 24px rgba(0, 168, 150, 0.08)",
    },
    Table: {
      headerBg: "#F8FAFB",
    },
  },
};

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>;
};
