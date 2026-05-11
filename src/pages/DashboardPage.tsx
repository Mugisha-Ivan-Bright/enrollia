import { useCustom, useList } from "@refinedev/core";
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  Grid,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const SESSION_COLORS: Record<string, string> = {
  "Morning Exam": "#00A896",
  "Afternoon Exam": "#3B82F6",
  "Evening Exam": "#8B5CF6",
  General: "#10B981",
};

const greeting = () => {
  const h = dayjs().hour();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const { result: statsResult } = useCustom({
    url: "get_dashboard_stats",
    method: "get",
    meta: { select: "*" },
  });
  const stats = statsResult?.data || {};

  const { result: enrollResult } = useList({
    resource: "students",
    pagination: { pageSize: 6 },
    sorters: [{ field: "enrolled_at", order: "desc" }],
  });

  const { result: checkinResult } = useList({
    resource: "checkins",
    pagination: { pageSize: 6 },
    sorters: [{ field: "checked_in_at", order: "desc" }],
    meta: { select: "*, students(full_name, student_id)" },
  });

  const { result: weeklyResult } = useList({
    resource: "checkins",
    filters: [
      {
        field: "checked_in_at",
        operator: "gte",
        value: dayjs().subtract(7, "day").startOf("day").toISOString(),
      },
    ],
    pagination: { pageSize: 200 },
    sorters: [{ field: "checked_in_at", order: "asc" }],
  });

  const weeklyChartData = useMemo(() => {
    const days = (weeklyResult?.data || []) as any[];
    if (!days.length) return [];
    const dayMap: Record<string, Record<string, any>> = {};
    for (const c of days) {
      const key = dayjs(c.checked_in_at).format("ddd");
      if (!dayMap[key]) {
        dayMap[key] = { date: key };
      }
      const label = c.session_label || "General";
      dayMap[key][label] = (dayMap[key][label] || 0) + 1;
    }
    return Object.values(dayMap);
  }, [weeklyResult?.data]);

  const enrollColumns = [
    {
      title: "Student",
      render: (_: string, r: any) => (
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
              flexShrink: 0,
            }}
          >
            {r.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              {r.full_name}
            </Text>
            <br />
            <Text style={{ fontSize: 12, color: "#6C757D" }}>
              {r.student_id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Year",
      dataIndex: "year_of_study",
      render: (y: string) => <Tag color="#00A896">{y}</Tag>,
    },
    {
      title: "Enrolled",
      dataIndex: "enrolled_at",
      render: (d: string) => (
        <Text style={{ color: "#6C757D", fontSize: 13 }}>
          {dayjs(d).fromNow()}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => {
        const colors: Record<string, string> = {
          active: "#00A896",
          inactive: "#6C757D",
          suspended: "#DC3545",
        };
        const bg: Record<string, string> = {
          active: "#E0F5F2",
          inactive: "#F0F0F0",
          suspended: "#FDECEA",
        };
        return (
          <Tag color={colors[s]} style={{ background: bg[s], border: "none" }}>
            {s?.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        style={{
          borderRadius: 12,
          borderLeft: "4px solid #00A896",
          marginBottom: 16,
        }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0, color: "#1D3557" }}>
              {greeting()}, Admin 👋
            </Title>
            <Text style={{ color: "#6C757D" }}>
              Here's what's happening at RCA today.
            </Text>
          </Col>
          <Col>
            <Tag color="#00A896">{dayjs().format("dddd, D MMMM YYYY")}</Tag>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              borderTop: "3px solid #00A896",
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Total Students"
              value={stats?.total_students || 0}
              prefix={<TeamOutlined style={{ color: "#00A896", fontSize: 24 }} />}
              valueStyle={{ color: "#1D3557", fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              borderTop: "3px solid #3B82F6",
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Enrolled This Month"
              value={stats?.this_month || 0}
              prefix={<UserAddOutlined style={{ color: "#3B82F6", fontSize: 24 }} />}
              valueStyle={{ color: "#1D3557", fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              borderTop: "3px solid #10B981",
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Statistic
              title="Checked In Today"
              value={stats?.checked_in_today || 0}
              prefix={<CheckCircleOutlined style={{ color: "#10B981", fontSize: 24 }} />}
              valueStyle={{ color: "#1D3557", fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              borderTop: "3px solid #F59E0B",
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/checkins")}
          >
            <Statistic
              title="Not Yet Checked In"
              value={(stats?.total_students || 0) - (stats?.checked_in_today || 0)}
              prefix={<ClockCircleOutlined style={{ color: "#F59E0B", fontSize: 24 }} />}
              valueStyle={{ color: "#1D3557", fontSize: 32, fontWeight: 700 }}
            />
            <Text style={{ color: "#00A896", fontSize: 13 }}>
              View pending &rarr;
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card
            title={
              <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
                Recent Enrollments
              </Text>
            }
            extra={
              <Text
                style={{ color: "#00A896", cursor: "pointer" }}
                onClick={() => navigate("/students")}
              >
                View all &rarr;
              </Text>
            }
            style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,168,150,0.08)" }}
          >
            <Table
              dataSource={enrollResult?.data || []}
              columns={enrollColumns}
              rowKey="id"
              pagination={false}
              size="small"
              showHeader={false}
              onRow={(record) => ({
                onClick: () => navigate(`/students/${record.id}`),
                style: { cursor: "pointer" },
              })}
              scroll={{ x: screens.xs ? 500 : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title={
              <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
                Weekly Check-in Trends
              </Text>
            }
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
              marginBottom: 16,
            }}
          >
            {weeklyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={weeklyChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#6C757D" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#6C757D" }} />
                  <ReTooltip />
                  {Object.keys(SESSION_COLORS).map((session) => (
                    <Area
                      key={session}
                      type="monotone"
                      dataKey={session}
                      stackId="1"
                      stroke={SESSION_COLORS[session]}
                      fill={SESSION_COLORS[session]}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#ADB5BD" }}>No check-in data this week</Text>
              </div>
            )}
          </Card>

          <Card
            title={
              <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
                Recent Activity
              </Text>
            }
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
            }}
          >
            <Timeline
              items={(checkinResult?.data || []).slice(0, 5).map((c: any) => ({
                dot: <CheckCircleOutlined style={{ color: "#00A896", fontSize: 14 }} />,
                children: (
                  <div>
                    <Text strong style={{ color: "#1D3557" }}>
                      {c.students?.full_name || "Unknown"}
                    </Text>
                    <Text style={{ color: "#6C757D", marginLeft: 4 }}>
                      checked in for {c.session_label}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 12, color: "#ADB5BD" }}>
                      {dayjs(c.checked_in_at).fromNow()}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
