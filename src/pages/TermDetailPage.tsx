import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  PercentageOutlined,
  SearchOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabaseClient } from "../providers/supabase-client";

const { Text } = Typography;

export const TermDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [term, setTerm] = useState<any>(null);
  const [termItems, setTermItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<string | null>(null);
  const [itemFilterStatus, setItemFilterStatus] = useState<"has" | "missing" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      supabaseClient.from("terms").select("*").eq("id", id).single(),
      supabaseClient.from("term_items").select("*").eq("term_id", id).order("item_name"),
      supabaseClient.from("students").select("*").order("full_name"),
      supabaseClient.from("checkins").select("*").eq("term_id", id),
    ]).then(([termRes, itemsRes, studentsRes, checkinsRes]) => {
      if (termRes.error) {
        setTerm(null);
      } else {
        setTerm(termRes.data);
      }
      setTermItems(itemsRes.data || []);
      setStudents(studentsRes.data || []);
      setCheckins(checkinsRes.data || []);
      setLoading(false);
    });
  }, [id]);

  const checkinMap = useMemo(
    () => new Map(checkins.map((c) => [c.student_id, c])),
    [checkins]
  );
  const hasNoItems = termItems.length === 0;

  const isCheckedIn = (studentId: string) => {
    const checkin = checkinMap.get(studentId);
    if (!checkin) return false;
    if (hasNoItems) return true;
    return (checkin.items?.length || 0) > 0;
  };

  const hasItem = (studentId: string, itemName: string) =>
    checkinMap.get(studentId)?.items?.includes(itemName) || false;

  const totalStudents = students.length;
  const checkedInCount = hasNoItems
    ? checkins.length
    : checkins.filter((c) => (c.items?.length || 0) > 0).length;
  const pendingCount = totalStudents - checkedInCount;
  const completionRate =
    totalStudents > 0 ? Math.round((checkedInCount / totalStudents) * 100) : 0;

  const chartData = useMemo(
    () =>
      termItems.map((item) => {
        const completed = students.filter((s) => hasItem(s.id, item.item_name)).length;
        return {
          name: item.item_name,
          Completed: completed,
          Missing: students.length - completed,
        };
      }),
    [termItems, students, checkins]
  );

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        if (search) {
          const q = search.toLowerCase();
          if (
            !s.full_name?.toLowerCase().includes(q) &&
            !s.student_id?.toLowerCase().includes(q)
          )
            return false;
        }
        if (yearFilter && s.year_of_study !== yearFilter) return false;
        if (itemFilter && itemFilterStatus === "has" && !hasItem(s.id, itemFilter))
          return false;
        if (itemFilter && itemFilterStatus === "missing" && hasItem(s.id, itemFilter))
          return false;
        return true;
      }),
    [students, search, yearFilter, itemFilter, itemFilterStatus]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter, itemFilter, itemFilterStatus]);

  const years = useMemo(() => {
    const set = new Set(students.map((s) => s.year_of_study));
    return Array.from(set).sort();
  }, [students]);

  const itemColumns = hasNoItems
    ? []
    : termItems.map((item) => ({
        title: (
          <Text style={{ fontSize: 12, color: "#1D3557", fontWeight: 600 }}>
            {item.item_name}
          </Text>
        ),
        key: `item_${item.id}`,
        width: 100,
        align: "center" as const,
        render: (_: any, record: any) =>
          hasItem(record.id, item.item_name) ? (
            <CheckOutlined style={{ color: "#00A896" }} />
          ) : (
            <CloseOutlined style={{ color: "#FF6B6B", fontSize: 12 }} />
          ),
      }));

  const columns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: string, __: any, i: number) => i + 1,
    },
    {
      title: "Student",
      key: "student",
      width: 280,
      sorter: (a: any, b: any) => a.full_name?.localeCompare(b.full_name),
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={36}
            src={record.photo_url}
            style={{
              background: record.photo_url ? "transparent" : "#E0F5F2",
              color: "#00A896",
            }}
          >
            {record.full_name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              {record.full_name}
            </Text>
            <br />
            <Text style={{ fontSize: 12, color: "#6C757D" }}>
              {record.student_id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Year",
      dataIndex: "year_of_study",
      width: 90,
      render: (y: string) => (
        <Tag color="#00A896" style={{ borderRadius: 12, margin: 0 }}>
          {y}
        </Tag>
      ),
    },
    ...itemColumns,
    {
      title: "Status",
      key: "status",
      width: 120,
      align: "center" as const,
      render: (_: any, record: any) =>
        isCheckedIn(record.id) ? (
          <Tag color="#00A896" icon={<CheckOutlined />} style={{ borderRadius: 12 }}>
            Checked in
          </Tag>
        ) : (
          <Tag style={{ borderRadius: 12, border: "1px solid #D9D9D9", color: "#BFBFBF" }}>
            Pending
          </Tag>
        ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #E9ECEF",
            borderTop: "3px solid #00A896",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!term) {
    return (
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
        }}
      >
        <Empty description="Term not found" />
      </Card>
    );
  }

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
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/terms")}
                style={{ color: "#6C757D" }}
              />
              <div>
                <Text
                  strong
                  style={{ fontSize: 22, color: "#1D3557", display: "block" }}
                >
                  {term.name}
                </Text>
                <Text style={{ color: "#ADB5BD", fontSize: 13 }}>
                  Dashboard &gt; Terms &gt; {term.name}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            {term.is_active ? (
              <Tag
                color="#00A896"
                icon={<CheckCircleOutlined />}
                style={{ borderRadius: 12 }}
              >
                Active
              </Tag>
            ) : (
              <Tag style={{ borderRadius: 12 }}>Inactive</Tag>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Total Students"
              value={totalStudents}
              prefix={<TeamOutlined style={{ color: "#00A896" }} />}
              valueStyle={{ color: "#1D3557" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Checked In"
              value={checkedInCount}
              prefix={<CheckCircleOutlined style={{ color: "#00A896" }} />}
              valueStyle={{ color: "#00A896" }}
              suffix={
                <Text style={{ color: "#ADB5BD", fontSize: 14 }}>
                  / {totalStudents}
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Pending"
              value={pendingCount}
              prefix={<UserSwitchOutlined style={{ color: "#FF6B6B" }} />}
              valueStyle={{ color: "#FF6B6B" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Completion Rate"
              value={completionRate}
              suffix="%"
              prefix={<PercentageOutlined style={{ color: "#1D3557" }} />}
              valueStyle={{ color: "#1D3557" }}
            />
          </Card>
        </Col>
      </Row>

      {chartData.length > 0 && (
        <Card
          title={
            <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
              Item Completion Overview
            </Text>
          }
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            marginBottom: 16,
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
              <XAxis dataKey="name" tick={{ fill: "#6C757D", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6C757D", fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="Completed"
                stackId="a"
                fill="#00A896"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Missing"
                stackId="a"
                fill="#FF6B6B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card
        title={
          <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
            Students
          </Text>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
          <Row gutter={[12, 12]}>
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
            <Col xs={12} sm={6} md={4} lg={3}>
              <Select
                placeholder="Year"
                value={yearFilter}
                onChange={setYearFilter}
                allowClear
                style={{ width: "100%" }}
                options={years.map((y) => ({ label: y, value: y }))}
              />
            </Col>
            {!hasNoItems && (
              <>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Select
                    placeholder="Filter by item..."
                    value={itemFilter}
                    onChange={(val) => {
                      setItemFilter(val);
                      setItemFilterStatus(null);
                    }}
                    allowClear
                    style={{ width: "100%" }}
                    options={termItems.map((i) => ({
                      label: i.item_name,
                      value: i.item_name,
                    }))}
                  />
                </Col>
                {itemFilter && (
                  <Col>
                    <Space>
                      <Button
                        type={itemFilterStatus === "has" ? "primary" : "default"}
                        onClick={() => setItemFilterStatus("has")}
                        style={{
                          borderRadius: 8,
                          ...(itemFilterStatus === "has"
                            ? { background: "#00A896", borderColor: "#00A896" }
                            : {}),
                        }}
                        size="small"
                      >
                        Has item
                      </Button>
                      <Button
                        type={
                          itemFilterStatus === "missing" ? "primary" : "default"
                        }
                        onClick={() => setItemFilterStatus("missing")}
                        danger={itemFilterStatus === "missing"}
                        size="small"
                        style={{ borderRadius: 8 }}
                      >
                        Missing
                      </Button>
                    </Space>
                  </Col>
                )}
              </>
            )}
          </Row>
        </div>
        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="id"
          loading={loading}
           pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredStudents.length,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setPageSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} students`,
          }}
          scroll={{ x: 500 + termItems.length * 100 }}
          locale={{
            emptyText: <Empty description="No students match your filters" />,
          }}
        />
      </Card>
    </div>
  );
};
