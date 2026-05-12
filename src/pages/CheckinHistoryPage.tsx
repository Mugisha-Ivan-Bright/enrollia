import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [termsMap, setTermsMap] = useState<Map<string, string>>(new Map());
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    Promise.all([
      supabaseClient
        .from("checkins")
        .select("*, students(full_name, student_id, year_of_study, photo_url)")
        .order("checked_in_at", { ascending: false }),
      supabaseClient.from("terms").select("id, name"),
    ]).then(([checkinsRes, termsRes]) => {
      setCheckins(checkinsRes.data || []);
      setTerms(termsRes.data || []);
      const map = new Map<string, string>();
      (termsRes.data || []).forEach((t) => map.set(t.id, t.name));
      setTermsMap(map);
      setLoading(false);
    });
  }, []);

  const filteredData = useMemo(
    () =>
      checkins.filter((c) => {
        if (search) {
          const q = search.toLowerCase();
          const s = c.students;
          if (
            !s?.full_name?.toLowerCase().includes(q) &&
            !s?.student_id?.toLowerCase().includes(q)
          )
            return false;
        }
        if (sessionFilter && c.session_label !== sessionFilter) return false;
        if (termFilter && c.term_id !== termFilter) return false;
        if (dateRange?.[0] && dateRange?.[1]) {
          const d = dayjs(c.checked_in_at);
          if (d.isBefore(dateRange[0]) || d.isAfter(dateRange[1])) return false;
        }
        return true;
      }),
    [checkins, search, sessionFilter, termFilter, dateRange]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sessionFilter, termFilter, dateRange]);

  const exportCSV = async () => {
    if (!checkins.length) {
      message.warning("No data to export");
      return;
    }
    const headers = [
      "Student ID",
      "Student Name",
      "Year",
      "Term",
      "Items",
      "Session",
      "Date & Time",
    ];
    const rows = checkins.map((c: any) =>
      [
        c.students?.student_id || "",
        `"${c.students?.full_name || ""}"`,
        c.students?.year_of_study || "",
        termsMap.get(c.term_id) || "",
        `"${(c.items || []).join(", ")}"`,
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
      key: "student",
      sorter: (a: any, b: any) =>
        a.students?.full_name?.localeCompare(b.students?.full_name),
      render: (_: any, r: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            size={36}
            src={r.students?.photo_url}
            style={{
              background: r.students?.photo_url ? "transparent" : "#E0F5F2",
              color: "#00A896",
            }}
          >
            {r.students?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              {r.students?.full_name}
            </Text>
            <br />
            <Text style={{ fontSize: 12, color: "#6C757D" }}>
              {r.students?.student_id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Year",
      key: "year",
      width: 90,
      render: (_: any, r: any) => (
        <Tag color="#00A896" style={{ borderRadius: 12, margin: 0 }}>
          {r.students?.year_of_study}
        </Tag>
      ),
    },
    {
      title: "Term",
      dataIndex: "term_id",
      width: 140,
      render: (termId: string) => (
        <Tag
          color="default"
          style={{ borderRadius: 12, fontSize: 11, margin: 0 }}
        >
          {termsMap.get(termId) || "—"}
        </Tag>
      ),
    },
    {
      title: "Items",
      dataIndex: "items",
      width: 200,
      render: (items: string[]) =>
        items?.length ? (
          <Space size={4} wrap>
            {items.map((item) => (
              <Tag
                key={item}
                color="success"
                style={{ borderRadius: 12, fontSize: 11, margin: 0 }}
              >
                {item}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text style={{ color: "#ADB5BD", fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: "Session",
      dataIndex: "session_label",
      sorter: (a: any, b: any) =>
        a.session_label?.localeCompare(b.session_label),
      render: (s: string) => (
        <Tag color={sessionColors[s] || "#00A896"}>{s}</Tag>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "checked_in_at",
      sorter: (a: any, b: any) =>
        dayjs(a.checked_in_at).unix() - dayjs(b.checked_in_at).unix(),
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
            <Input
              placeholder="Search by name or ID..."
              prefix={<SearchOutlined style={{ color: "#ADB5BD" }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Select
              placeholder="Session"
              value={sessionFilter}
              onChange={setSessionFilter}
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
          <Col xs={12} sm={8} md={6} lg={4}>
            <Select
              placeholder="Term"
              value={termFilter}
              onChange={setTermFilter}
              allowClear
              style={{ width: "100%" }}
              options={terms.map((t) => ({
                label: t.name,
                value: t.id,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
            />
          </Col>
        </Row>

        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => navigate(`/students/${record.student_id}`),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredData.length,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setPageSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"],
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} records`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};
