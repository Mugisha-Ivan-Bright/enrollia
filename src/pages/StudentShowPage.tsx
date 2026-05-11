import { useDelete, useInvalidate, useList } from "@refinedev/core";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Dropdown,
  Empty,
  Popconfirm,
  Result,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Timeline,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  MoreOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UndoOutlined,
  BookOutlined,
  CalendarOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  UserOutlined,
  HistoryOutlined,
  DownloadOutlined,
  BarChartOutlined,
  ContactsOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { supabaseClient } from "../providers/supabase-client";
import { StudentEditDrawer } from "../components/student-edit-drawer";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const sessionColors: Record<string, string> = {
  "Morning Exam": "#3B82F6",
  "Afternoon Exam": "#F59E0B",
  "Evening Exam": "#8B5CF6",
  General: "#00A896",
};

const chipStyle: React.CSSProperties = {
  borderRadius: 20,
  padding: "4px 12px",
  background: "#E0F5F2",
  color: "#007A6E",
  border: "1px solid #B2E8E2",
  fontSize: 12,
  fontWeight: 500,
  cursor: "default",
};

function getInitials(name: string): string {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function statusToAntd(status: string): "success" | "error" | "default" | "warning" {
  const map: Record<string, "success" | "error" | "default" | "warning"> = {
    active: "success",
    inactive: "default",
    suspended: "error",
  };
  return map[status] || "default";
}

export const StudentShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { mutate: deleteMutate } = useDelete();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabaseClient
      .from("students")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch student:", error);
          setStudent(null);
        } else {
          setStudent(data);
        }
        setLoading(false);
      });
  }, [id, refreshKey]);

  const { result: checkinResult } = useList({
    resource: "checkins",
    filters: [{ field: "student_id", operator: "eq", value: id }],
    sorters: [{ field: "checked_in_at", order: "desc" }],
    pagination: { pageSize: 200 },
  });

  const totalCheckins = checkinResult?.total || 0;
  const checkinData = checkinResult?.data || [];

  const thisMonthCheckins = useMemo(
    () =>
      checkinData.filter((c: any) =>
        dayjs(c.checked_in_at).isAfter(dayjs().startOf("month"))
      ).length,
    [checkinData]
  );

  const lastCheckin = checkinData[0] || null;

  const handleUndoCheckin = async (checkinId: string) => {
    const { error } = await supabaseClient
      .from("checkins")
      .delete()
      .eq("id", checkinId);
    if (error) {
      message.error(error.message);
    } else {
      message.success("Check-in removed");
      invalidate({ resource: "checkins", invalidates: ["list"] });
    }
  };

  const exportStudentCheckins = async () => {
    const { data } = await supabaseClient
      .from("checkins")
      .select("*, students(full_name, student_id)")
      .eq("student_id", id)
      .order("checked_in_at", { ascending: false });

    if (!data?.length) {
      message.warning("No check-in history to export");
      return;
    }

    const headers = ["Date & Time", "Session", "Student Name"];
    const rows = data.map((c: any) =>
      [
        dayjs(c.checked_in_at).format("DD/MM/YYYY HH:mm"),
        c.session_label,
        `"${c.students?.full_name || ""}"`,
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin_history_${student?.student_id}_${dayjs().format("YYYYMMDD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    deleteMutate(
      {
        resource: "students",
        id: id as string,
        successNotification: () => ({
          message: "Student deleted",
          type: "success",
        } as any),
      },
      { onSuccess: () => navigate("/students") }
    );
  };

  const dropdownMenu = {
    items: [
      {
        key: "suspend",
        label: "Suspend Student",
        icon: <StopOutlined />,
        onClick: () => {
          supabaseClient
            .from("students")
            .update({ status: "suspended" })
            .eq("id", id)
            .then(() => {
              message.success("Student suspended");
              invalidate({ resource: "students", invalidates: ["detail"] });
            });
        },
      },
      { type: "divider" as const },
      {
        key: "delete",
        label: "Delete Student",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          const modal = confirm("Delete this student? This action cannot be undone.");
          if (modal) handleDelete();
        },
      },
    ],
  };

  const timelineItems = useMemo(() => {
    if (!student) return [];
    const items: any[] = [
      {
        color: "#00A896",
        label: dayjs(student.enrolled_at).format("DD MMM YYYY · HH:mm"),
        children: (
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              Student Enrolled
            </Text>
            <br />
            <Text style={{ color: "#6C757D", fontSize: 12 }}>
              Added to {student.year_of_study} by admin
            </Text>
          </div>
        ),
      },
    ];

    for (const c of checkinData) {
      items.push({
        color: "#10B981",
        dot: <CheckCircleOutlined style={{ color: "#10B981" }} />,
        label: dayjs(c.checked_in_at).format("DD MMM YYYY · HH:mm"),
        children: (
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              Checked In
            </Text>
            <br />
            <Text style={{ color: "#6C757D", fontSize: 12 }}>
              {c.session_label} session
            </Text>
          </div>
        ),
      });
    }

    return items;
  }, [student, checkinData]);

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
        <span
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

  if (!student) {
    return (
      <Result
        status="404"
        title="Student Not Found"
        subTitle="This student record does not exist or has been deleted."
        extra={
          <Button
            type="primary"
            style={{ background: "#00A896", border: "none", borderRadius: 8 }}
            onClick={() => navigate("/students")}
          >
            Back to Students
          </Button>
        }
      />
    );
  }

  const checkinColumns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: string, __: any, i: number) => i + 1,
    },
    {
      title: "Date",
      dataIndex: "checked_in_at",
      render: (v: string) => (
        <Text style={{ color: "#1D3557" }}>
          {dayjs(v).format("dddd, DD MMM YYYY")}
        </Text>
      ),
    },
    {
      title: "Time",
      dataIndex: "checked_in_at",
      render: (v: string) => (
        <Text style={{ color: "#6C757D" }}>
          {dayjs(v).format("HH:mm A")}
        </Text>
      ),
    },
    {
      title: "Session",
      dataIndex: "session_label",
      render: (v: string) => (
        <Tag color={sessionColors[v] || "#00A896"} style={{ borderRadius: 20 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: string, r: any) => (
        <Popconfirm
          title="Remove this check-in?"
          okText="Remove"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleUndoCheckin(r.id)}
        >
          <Button type="text" size="small" danger icon={<UndoOutlined />}>
            Undo
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/students")}
          style={{
            color: "#00A896",
            fontWeight: 500,
            padding: "4px 0",
          }}
        >
          Back to Students
        </Button>

        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditDrawerOpen(true)}
            style={{
              borderRadius: 8,
              borderColor: "#00A896",
              color: "#00A896",
            }}
          >
            Edit Profile
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{ borderRadius: 8 }}
          >
            Print
          </Button>
          <Dropdown menu={dropdownMenu} trigger={["click"]}>
            <Button icon={<MoreOutlined />} style={{ borderRadius: 8 }} />
          </Dropdown>
        </Space>
      </div>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
          overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            width: "100%",
            height: 180,
            background:
              "linear-gradient(135deg, #00A896 0%, #007A6E 40%, #1D3557 100%)",
            position: "relative",
            overflow: "hidden",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext y='28' font-size='20' opacity='0.15'%3E%F0%9F%8E%93%3C/text%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 32,
              bottom: 20,
              fontSize: 64,
              fontWeight: 800,
              color: "rgba(255,255,255,0.08)",
              letterSpacing: -2,
              textTransform: "uppercase",
            }}
          >
            {student.year_of_study}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: -60,
            marginLeft: 40,
            zIndex: 10,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <Avatar
              size={120}
              src={student.photo_url}
              style={{
                border: "4px solid #FFFFFF",
                boxShadow: "0 4px 20px rgba(0,168,150,0.25)",
                background: student.photo_url
                  ? "transparent"
                  : "linear-gradient(135deg, #00A896, #007A6E)",
                color: "#fff",
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              {getInitials(student.full_name)}
            </Avatar>
          </div>
        </div>

        <div style={{ paddingLeft: 40, paddingTop: 12, paddingBottom: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#1D3557",
                fontWeight: 700,
                fontSize: 28,
              }}
            >
              {student.full_name}
            </Title>

            {student.status === "active" && (
              <Tag
                color="#00A896"
                icon={<CheckCircleOutlined />}
                style={{
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "2px 10px",
                }}
              >
                Active
              </Tag>
            )}
            {student.status === "suspended" && (
              <Tag
                color="#DC3545"
                icon={<StopOutlined />}
                style={{
                  borderRadius: 20,
                  fontWeight: 600,
                  padding: "2px 10px",
                }}
              >
                Suspended
              </Tag>
            )}
            {student.status === "inactive" && (
              <Tag
                color="#6C757D"
                icon={<MinusCircleOutlined />}
                style={{
                  borderRadius: 20,
                  fontWeight: 600,
                  padding: "2px 10px",
                }}
              >
                Inactive
              </Tag>
            )}

            <Tag
              icon={<CalendarOutlined />}
              style={{
                borderRadius: 20,
                background: "#F0FAF9",
                color: "#007A6E",
                border: "1px solid #B2E8E2",
              }}
            >
              Enrolled {dayjs(student.enrolled_at).format("YYYY")}
            </Tag>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 4,
              flexWrap: "wrap",
            }}
          >
            <Text style={{ color: "#6C757D", fontSize: 13 }}>
              <IdcardOutlined style={{ marginRight: 4 }} />
              <Text
                copyable
                style={{ color: "#6C757D", fontFamily: "monospace" }}
              >
                {student.student_id}
              </Text>
            </Text>
            <Text style={{ color: "#6C757D" }}>·</Text>
            <Text style={{ color: "#6C757D", fontSize: 13 }}>
              <BookOutlined style={{ marginRight: 4, color: "#00A896" }} />
              {student.year_of_study}
            </Text>
            <Text style={{ color: "#6C757D" }}>·</Text>
            <Text style={{ color: "#6C757D", fontSize: 13 }}>
              <EnvironmentOutlined style={{ marginRight: 4, color: "#00A896" }} />
              Kigali, Rwanda
            </Text>
          </div>
        </div>

        <div style={{ paddingLeft: 40, paddingBottom: 20, paddingTop: 4 }}>
          <Space wrap size={[8, 8]}>
            <Tag icon={<BookOutlined />} style={chipStyle}>
              {student.year_of_study}
            </Tag>
            <Tag icon={<BankOutlined />} style={chipStyle}>
              Full-Time
            </Tag>
            <Tag
              icon={<MailOutlined />}
              style={{ ...chipStyle, cursor: "pointer" }}
              onClick={() =>
                (window.location.href = `mailto:${student.email}`)
              }
            >
              {student.email}
            </Tag>
            {student.phone && (
              <Tag icon={<PhoneOutlined />} style={chipStyle}>
                {student.phone}
              </Tag>
            )}
            <Tag
              icon={<CheckCircleOutlined />}
              style={{ ...chipStyle, background: "#F0FAF9", color: "#007A6E" }}
            >
              {totalCheckins} Check-ins
            </Tag>
            {lastCheckin && (
              <Tag
                icon={<ClockCircleOutlined />}
                style={{ ...chipStyle, background: "#FFFBE6", borderColor: "#FFE58F", color: "#AD8B00" }}
              >
                Last seen: {dayjs(lastCheckin.checked_in_at).fromNow()}
              </Tag>
            )}
          </Space>
        </div>

        <Tabs
          defaultActiveKey="profile"
          tabBarStyle={{
            paddingLeft: 40,
            marginBottom: 0,
            borderBottom: "1px solid #E9ECEF",
          }}
          tabBarGutter={32}
          indicator={{ size: 40 }}
          items={[
            {
              key: "profile",
              label: (
                <span>
                  <UserOutlined /> Profile Details
                </span>
              ),
              children: (
                <Row gutter={[24, 24]} style={{ padding: "24px 40px" }}>
                  <Col xs={24} lg={14}>
                    <Card
                      title={
                        <span>
                          <BookOutlined style={{ color: "#00A896", marginRight: 8 }} />
                          Academic Information
                        </span>
                      }
                      bordered={false}
                      style={{
                        borderRadius: 12,
                        background: "#FAFFFE",
                      }}
                    >
                      <Descriptions
                        column={1}
                        labelStyle={{ color: "#6C757D", width: 160 }}
                        contentStyle={{ color: "#1D3557", fontWeight: 500 }}
                      >
                        <Descriptions.Item label="Student ID">
                          <Text copyable code>
                            {student.student_id}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Full Name">
                          {student.full_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Year of Study">
                          <Tag color="#00A896">{student.year_of_study}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          <Badge
                            status={statusToAntd(student.status)}
                            text={capitalize(student.status)}
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="Date of Enrollment">
                          {dayjs(student.enrolled_at).format("DD MMMM YYYY")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Academic Year">
                          {student.year_of_study} of Programme
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {student.notes && (
                      <Card
                        title={
                          <span>
                            <FileTextOutlined
                              style={{ color: "#00A896", marginRight: 8 }}
                            />
                            Notes
                          </span>
                        }
                        bordered={false}
                        style={{
                          borderRadius: 12,
                          marginTop: 16,
                          background: "#FAFFFE",
                        }}
                      >
                        <Text style={{ color: "#2C3E50", margin: 0 }}>
                          {student.notes}
                        </Text>
                      </Card>
                    )}
                  </Col>

                  <Col xs={24} lg={10}>
                    <Card
                      title={
                        <span>
                          <ContactsOutlined
                            style={{ color: "#00A896", marginRight: 8 }}
                          />
                          Contact
                        </span>
                      }
                      bordered={false}
                      style={{
                        borderRadius: 12,
                        background: "#FAFFFE",
                      }}
                    >
                      <Space direction="vertical" style={{ width: "100%" }} size={12}>
                        <div>
                          <MailOutlined
                            style={{ color: "#00A896", marginRight: 8 }}
                          />
                          <a
                            href={`mailto:${student.email}`}
                            style={{ color: "#1D3557" }}
                          >
                            {student.email}
                          </a>
                        </div>
                        {student.phone && (
                          <div>
                            <PhoneOutlined
                              style={{ color: "#00A896", marginRight: 8 }}
                            />
                            <span style={{ color: "#1D3557" }}>
                              {student.phone}
                            </span>
                          </div>
                        )}
                      </Space>
                    </Card>

                    <Card
                      title={
                        <span>
                          <BarChartOutlined
                            style={{ color: "#00A896", marginRight: 8 }}
                          />
                          Attendance Summary
                        </span>
                      }
                      bordered={false}
                      style={{
                        borderRadius: 12,
                        marginTop: 16,
                        background: "#FAFFFE",
                      }}
                    >
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Statistic
                            title="Total Check-ins"
                            value={totalCheckins}
                            prefix={
                              <CheckCircleOutlined
                                style={{ color: "#00A896" }}
                              />
                            }
                            valueStyle={{
                              color: "#00A896",
                              fontSize: 24,
                            }}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="This Month"
                            value={thisMonthCheckins}
                            prefix={
                              <CalendarOutlined
                                style={{ color: "#3B82F6" }}
                              />
                            }
                            valueStyle={{
                              color: "#3B82F6",
                              fontSize: 24,
                            }}
                          />
                        </Col>
                        <Col span={24}>
                          <div style={{ marginTop: 8 }}>
                            <Text
                              style={{
                                color: "#6C757D",
                                fontSize: 12,
                              }}
                            >
                              Last check-in
                            </Text>
                            <br />
                            <Text
                              style={{
                                color: "#1D3557",
                                fontWeight: 500,
                              }}
                            >
                              {lastCheckin
                                ? dayjs(lastCheckin.checked_in_at).format(
                                    "DD MMM YYYY · HH:mm"
                                  )
                                : "No check-ins yet"}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "checkins",
              label: (
                <span>
                  <CheckCircleOutlined /> Check-in History
                  <Badge
                    count={totalCheckins}
                    style={{ marginLeft: 6, backgroundColor: "#00A896" }}
                    overflowCount={999}
                  />
                </span>
              ),
              children: (
                <div style={{ padding: "24px 40px" }}>
                  <Row
                    justify="space-between"
                    align="middle"
                    style={{ marginBottom: 16 }}
                  >
                    <Text style={{ color: "#6C757D" }}>
                      <CheckCircleOutlined
                        style={{ color: "#00A896", marginRight: 6 }}
                      />
                      {totalCheckins} total check-ins for this student
                    </Text>
                    <Button
                      icon={<DownloadOutlined />}
                      size="small"
                      onClick={exportStudentCheckins}
                      style={{
                        borderRadius: 8,
                        borderColor: "#00A896",
                        color: "#00A896",
                      }}
                    >
                      Export History
                    </Button>
                  </Row>

                  {checkinData.length > 0 ? (
                    <Table
                      dataSource={checkinData}
                      columns={checkinColumns}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showTotal: (t: number) => `${t} check-ins`,
                      }}
                      scroll={{ x: 600 }}
                    />
                  ) : (
                    <Empty description="This student has no check-in records yet" />
                  )}
                </div>
              ),
            },
            {
              key: "activity",
              label: (
                <span>
                  <HistoryOutlined /> Activity Log
                </span>
              ),
              children: (
                <div style={{ padding: "24px 40px" }}>
                  <Text
                    style={{
                      color: "#6C757D",
                      display: "block",
                      marginBottom: 20,
                    }}
                  >
                    Full history of all actions taken on this student's record.
                  </Text>
                  <Timeline mode="left" items={timelineItems} />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <StudentEditDrawer
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setRefreshKey((k) => k + 1);
          invalidate({ resource: "students", invalidates: ["detail", "list"] });
        }}
        student={student}
      />
    </div>
  );
};
