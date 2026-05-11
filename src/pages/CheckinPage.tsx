import { useCreate, useDelete, useInvalidate, useList } from "@refinedev/core";
import {
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CheckOutlined,
  SearchOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef, useCallback } from "react";
import dayjs from "dayjs";
import { supabaseClient } from "../providers/supabase-client";

const { Text } = Typography;

const sessionColors: Record<string, string> = {
  "Morning Exam": "blue",
  "Afternoon Exam": "orange",
  "Evening Exam": "purple",
  General: "#00A896",
};

export const CheckinPage: React.FC = () => {
  const invalidate = useInvalidate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionLabel, setSessionLabel] = useState("General");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: createCheckin } = useCreate({});
  const { mutate: deleteCheckin } = useDelete({});

  const { result: todayResult } = useList({
    resource: "checkins",
    filters: [
      { field: "checked_in_at", operator: "gte", value: dayjs().startOf("day").toISOString() },
    ],
    sorters: [{ field: "checked_in_at", order: "desc" }],
    meta: { select: "*, students(full_name, student_id, year_of_study, photo_url)" },
  });

  const todayData = todayResult?.data || [];

  const checkedInIds = new Set(todayData.map((c: any) => c.student_id));

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(async () => {
        if (value.length < 2) {
          setSearchResults([]);
          return;
        }

        const { data } = await supabaseClient
          .from("students")
          .select("*")
          .or(`full_name.ilike.%${value}%,student_id.ilike.%${value}%`)
          .limit(5);

        setSearchResults(data || []);
      }, 400);
    },
    []
  );

  const handleCheckin = (student: any) => {
    setCheckingIn(student.id);
    createCheckin(
      {
        resource: "checkins",
        values: {
          student_id: student.id,
          checked_in_at: new Date().toISOString(),
          session_label: sessionLabel,
        },
      },
      {
        onSuccess: () => {
          message.success(`${student.full_name} checked in for ${sessionLabel}`);
          setSearchResults([]);
          setSearchQuery("");
          invalidate({ resource: "checkins", invalidates: ["list"] });
        },
        onError: (err: any) => {
          message.error(err?.message || "Check-in failed");
        },
        onSettled: () => setCheckingIn(null),
      }
    );
  };

  const handleUndo = (checkin: any) => {
    deleteCheckin(
      { resource: "checkins", id: checkin.id },
      {
        onSuccess: () => invalidate({ resource: "checkins", invalidates: ["list"] }),
      }
    );
  };

  useEffect(() => {
    const channel = supabaseClient
      .channel("checkins_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        () => invalidate({ resource: "checkins", invalidates: ["list"] })
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "checkins" },
        () => invalidate({ resource: "checkins", invalidates: ["list"] })
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [invalidate]);

  const columns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: string, __: any, i: number) => i + 1,
    },
    {
      title: "Student",
      dataIndex: "students",
      render: (s: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={36}
            src={s?.photo_url}
            style={{
              background: s?.photo_url ? "transparent" : "#E0F5F2",
              color: "#00A896",
            }}
          >
            {s?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
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
      title: "Year",
      dataIndex: "students",
      render: (s: any) => (
        <Tag color="#00A896">{s?.year_of_study}</Tag>
      ),
    },
    {
      title: "Session",
      dataIndex: "session_label",
      render: (s: string) => (
        <Tag color={sessionColors[s] || "#00A896"}>{s}</Tag>
      ),
    },
    {
      title: "Time",
      dataIndex: "checked_in_at",
      render: (d: string) => (
        <Text style={{ color: "#6C757D" }}>
          {dayjs(d).format("h:mm A")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: string, r: any) => (
        <Popconfirm
          title={`Remove check-in for ${r.students?.full_name}?`}
          onConfirm={() => handleUndo(r)}
        >
          <Button size="small" danger icon={<UndoOutlined />}>
            Undo
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{
          background: "#00A896",
          borderRadius: 16,
          marginBottom: 16,
          color: "#FFF",
        }}
        styles={{ body: { padding: "20px 28px" } }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <CheckCircleOutlined style={{ fontSize: 28 }} />
              <div>
                <Text style={{ color: "#FFF", fontSize: 13, opacity: 0.85 }}>
                  Active Session
                </Text>
                <br />
                <Text strong style={{ color: "#FFF", fontSize: 20 }}>
                  {sessionLabel}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Select
              value={sessionLabel}
              onChange={setSessionLabel}
              style={{ width: 180, borderRadius: 8 }}
              options={[
                { label: "Morning Exam", value: "Morning Exam" },
                { label: "Afternoon Exam", value: "Afternoon Exam" },
                { label: "Evening Exam", value: "Evening Exam" },
                { label: "General", value: "General" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
          marginBottom: 16,
        }}
      >
        <Input.Search
          size="large"
          placeholder="Search student by name or ID..."
          prefix={<SearchOutlined style={{ color: "#00A896" }} />}
          style={{ borderRadius: 12, height: 52, borderColor: "#00A896" }}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Text style={{ color: "#ADB5BD", fontSize: 12, display: "block", marginTop: 4 }}>
          Type at least 2 characters to search
        </Text>

        {searchResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {searchResults.map((student: any) => {
              const alreadyChecked = checkedInIds.has(student.id);
              return (
                <Card
                  key={student.id}
                  hoverable
                  style={{ borderRadius: 12, marginBottom: 8 }}
                  styles={{ body: { padding: "16px 20px" } }}
                >
                  <Row align="middle" gutter={16}>
                    <Col>
                      <Avatar
                        size={48}
                        src={student.photo_url}
                        style={{
                          background: student.photo_url ? "transparent" : "#E0F5F2",
                          color: "#00A896",
                          fontSize: 18,
                          fontWeight: 600,
                        }}
                      >
                        {student.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </Avatar>
                    </Col>
                    <Col flex="1">
                      <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
                        {student.full_name}
                      </Text>
                      <br />
                      <Text style={{ color: "#6C757D", fontSize: 13 }}>
                        {student.student_id}
                      </Text>{" "}
                       <Tag color="#00A896">{student.year_of_study}</Tag>
                    </Col>
                    <Col>
                      {alreadyChecked ? (
                        <Tag
                          color="#00A896"
                          icon={<CheckOutlined />}
                          style={{ fontSize: 13, padding: "4px 12px" }}
                        >
                          Checked in
                        </Tag>
                      ) : (
                        <Button
                          type="primary"
                          loading={checkingIn === student.id}
                          onClick={() => handleCheckin(student)}
                          style={{
                            background: "#00A896",
                            border: "none",
                            borderRadius: 8,
                          }}
                        >
                          Check In
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Card
        title={
          <Space>
            <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
              Today's Check-ins
            </Text>
            <Tag color="#00A896">{todayData.length} students</Tag>
          </Space>
        }
        extra={
          <Select
            placeholder="Filter session"
            allowClear
            style={{ width: 140 }}
            options={[
              { label: "Morning Exam", value: "Morning Exam" },
              { label: "Afternoon Exam", value: "Afternoon Exam" },
              { label: "Evening Exam", value: "Evening Exam" },
              { label: "General", value: "General" },
            ]}
          />
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
        }}
      >
        <Table
          dataSource={todayData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  );
};
