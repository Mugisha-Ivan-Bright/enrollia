import { useTable } from "@refinedev/antd";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabaseClient } from "../providers/supabase-client";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const sessionColors: Record<string, string> = {
  "Morning Exam": "blue",
  "Afternoon Exam": "orange",
  "Evening Exam": "purple",
  General: "#00A896",
};

export const CheckinHistoryPage: React.FC = () => {
  const { tableProps } = useTable({
    resource: "checkins",
    sorters: { mode: "server" },
    filters: { mode: "server" },
    pagination: { pageSize: 25 },
    meta: { select: "*, students(full_name, student_id, programme, photo_url)" },
  });

  const exportCSV = async () => {
    const { data } = await supabaseClient
      .from("checkins")
      .select("*, students(full_name, student_id)")
      .order("checked_in_at", { ascending: false });

    if (!data?.length) {
      message.warning("No data to export");
      return;
    }

    const headers = ["Student ID", "Student Name", "Session", "Date & Time"];
    const rows = data.map((c: any) =>
      [
        c.students?.student_id || "",
        `"${c.students?.full_name || ""}"`,
        c.session_label,
        dayjs(c.checked_in_at).format("DD/MM/YYYY HH:mm"),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin_history_${dayjs().format("YYYYMMDD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: string, __: any, i: number) => i + 1,
    },
    {
      title: "Student",
      dataIndex: "students",
      sorter: true,
      render: (s: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#E0F5F2",
              color: "#00A896",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {s?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              {s?.full_name}
            </Text>
            <br />
            <Text style={{ fontSize: 12, color: "#6C757D" }}>
              {s?.student_id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Session",
      dataIndex: "session_label",
      sorter: true,
      render: (s: string) => (
        <Tag color={sessionColors[s] || "#00A896"}>{s}</Tag>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "checked_in_at",
      sorter: true,
      render: (d: string) => (
        <Text style={{ color: "#1D3557" }}>
          {dayjs(d).format("DD MMM YYYY, h:mm A")}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
          marginBottom: 16,
        }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Text
              strong
              style={{ fontSize: 22, color: "#1D3557", display: "block" }}
            >
              Check-in History
            </Text>
            <Text style={{ color: "#ADB5BD", fontSize: 13 }}>
              Dashboard &gt; Check-ins &gt; History
            </Text>
          </Col>
          <Col>
            <Button icon={<DownloadOutlined />} onClick={exportCSV}>
              Export CSV
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
        }}
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder="Search by student name..."
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Select
              placeholder="Session"
              allowClear
              style={{ width: "100%" }}
              options={[
                { label: "Morning Exam", value: "Morning Exam" },
                { label: "Afternoon Exam", value: "Afternoon Exam" },
                { label: "Evening Exam", value: "Evening Exam" },
                { label: "General", value: "General" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker style={{ width: "100%" }} />
          </Col>
        </Row>

        <Table
          {...tableProps}
          columns={columns}
          rowKey="id"
          scroll={{ x: 700 }}
          pagination={
            tableProps.pagination
              ? {
                  ...tableProps.pagination,
                  showSizeChanger: true,
                  pageSizeOptions: ["25", "50", "100"],
                  showTotal: (total: number, range: number[]) =>
                    `Showing ${range[0]}-${range[1]} of ${total} records`,
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
};
