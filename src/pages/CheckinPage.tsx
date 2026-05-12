import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Card,
  Checkbox,
  Col,
  Empty,
  Input,
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
} from "@ant-design/icons";
import { supabaseClient } from "../providers/supabase-client";

const { Text } = Typography;

export const CheckinPage: React.FC = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [termItems, setTermItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    supabaseClient
      .from("terms")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTerms(data || []);
        const active = data?.find((t) => t.is_active);
        if (active) {
          setSelectedTermId(active.id);
          setSelectedTerm(active);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedTermId) {
      setStudents([]);
      setTermItems([]);
      setCheckins([]);
      setSelectedTerm(null);
      return;
    }

    setLoading(true);
    setSelectedTerm(terms.find((t) => t.id === selectedTermId) || null);
    setSearch("");
    setYearFilter(null);
    setStatusFilter(null);
    setCurrentPage(1);

    Promise.all([
      supabaseClient.from("term_items").select("*").eq("term_id", selectedTermId).order("item_name"),
      supabaseClient.from("students").select("*").order("full_name"),
      supabaseClient.from("checkins").select("*").eq("term_id", selectedTermId),
    ]).then(([itemsRes, studentsRes, checkinsRes]) => {
      setTermItems(itemsRes.data || []);
      setStudents(studentsRes.data || []);
      setCheckins(checkinsRes.data || []);
      setLoading(false);
    });
  }, [selectedTermId]);

  const checkinMap = useMemo(() => new Map(checkins.map((c) => [c.student_id, c])), [checkins]);
  const hasNoItems = termItems.length === 0;

  const isCheckedIn = (studentId: string) => {
    const checkin = checkinMap.get(studentId);
    if (!checkin) return false;
    if (hasNoItems) return true;
    return (checkin.items?.length || 0) > 0;
  };

  const checkedInCount = hasNoItems
    ? checkins.length
    : checkins.filter((c) => (c.items?.length || 0) > 0).length;

  const hasItem = (studentId: string, itemName: string) =>
    checkinMap.get(studentId)?.items?.includes(itemName) || false;

  const toggleItem = async (student: any, itemName: string, checked: boolean) => {
    setSaving((prev) => ({ ...prev, [student.id]: true }));

    const existingCheckin = checkinMap.get(student.id);
    const currentItems: string[] = existingCheckin?.items || [];
    const newItems = checked
      ? [...currentItems, itemName]
      : currentItems.filter((i) => i !== itemName);

    try {
      if (newItems.length === 0 && existingCheckin) {
        const { error } = await supabaseClient
          .from("checkins")
          .delete()
          .eq("id", existingCheckin.id);
        if (error) throw error;
        setCheckins((prev) => prev.filter((c) => c.id !== existingCheckin.id));
      } else if (existingCheckin) {
        const { data, error } = await supabaseClient
          .from("checkins")
          .update({ items: newItems })
          .eq("id", existingCheckin.id)
          .select()
          .single();
        if (error) throw error;
        setCheckins((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      } else {
        const { data, error } = await supabaseClient
          .from("checkins")
          .insert({
            student_id: student.id,
            items: newItems,
            term_id: selectedTermId,
            checked_in_at: new Date().toISOString(),
            session_label: "General",
          })
          .select()
          .single();
        if (error) throw error;
        setCheckins((prev) => [...prev, data]);
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [student.id]: false }));
    }
  };

  const toggleCheckin = async (student: any, checkIn: boolean) => {
    setSaving((prev) => ({ ...prev, [student.id]: true }));

    try {
      if (checkIn) {
        const { data, error } = await supabaseClient
          .from("checkins")
          .insert({
            student_id: student.id,
            items: [],
            term_id: selectedTermId,
            checked_in_at: new Date().toISOString(),
            session_label: "General",
          })
          .select()
          .single();
        if (error) throw error;
        setCheckins((prev) => [...prev, data]);
      } else {
        const checkin = checkinMap.get(student.id);
        if (checkin) {
          await supabaseClient.from("checkins").delete().eq("id", checkin.id);
          setCheckins((prev) => prev.filter((c) => c.id !== checkin.id));
        }
      }
    } catch (err: any) {
      message.error(err?.message || "Failed to update");
    } finally {
      setSaving((prev) => ({ ...prev, [student.id]: false }));
    }
  };

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
        if (statusFilter === "checked_in" && !isCheckedIn(s.id)) return false;
        if (statusFilter === "pending" && isCheckedIn(s.id)) return false;
        return true;
      }),
    [students, search, yearFilter, statusFilter]
  );

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
        width: 110,
        align: "center" as const,
        render: (_: any, record: any) => {
          const isChecked = hasItem(record.id, item.item_name);
          return (
            <Checkbox
              checked={isChecked}
              disabled={saving[record.id]}
              onChange={(e) => toggleItem(record, item.item_name, e.target.checked)}
            />
          );
        },
      }));

  const noItemColumn = hasNoItems
    ? [
        {
          title: "Check In",
          key: "checkin",
          width: 110,
          align: "center" as const,
          render: (_: any, record: any) => {
            const checked = isCheckedIn(record.id);
            return (
              <Checkbox
                checked={checked}
                disabled={saving[record.id]}
                onChange={(e) => toggleCheckin(record, e.target.checked)}
              />
            );
          },
        },
      ]
    : [];

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
      sorter: (a: any, b: any) => a.year_of_study?.localeCompare(b.year_of_study),
      render: (y: string) => (
        <Tag color="#00A896" style={{ borderRadius: 12, margin: 0 }}>
          {y}
        </Tag>
      ),
    },
    ...itemColumns,
    ...noItemColumn,
    {
      title: "Status",
      key: "status",
      width: 130,
      align: "center" as const,
      render: (_: any, record: any) => {
        if (!isCheckedIn(record.id))
          return (
            <Tag style={{ borderRadius: 12, border: "1px solid #D9D9D9", color: "#BFBFBF" }}>
              Pending
            </Tag>
          );
        return (
          <Tag color="#00A896" icon={<CheckOutlined />} style={{ borderRadius: 12 }}>
            Checked in
          </Tag>
        );
      },
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
                  {selectedTerm ? "Term Selected" : "No term selected"}
                </Text>
                <br />
                <Text strong style={{ color: "#FFF", fontSize: 20 }}>
                  {selectedTerm?.name || "Select a term to begin"}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size={16}>
              <Select
                placeholder="Select term..."
                value={selectedTermId}
                onChange={(val) => setSelectedTermId(val)}
                style={{ width: 220, borderRadius: 8 }}
                options={terms.map((t) => ({
                  label: `${t.name}${t.is_active ? " (Active)" : ""}`,
                  value: t.id,
                }))}
                allowClear
              />
              <Tag
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: 12,
                  color: "#FFF",
                  fontSize: 13,
                  padding: "4px 12px",
                }}
              >
                {loading
                  ? "..."
                  : `${checkedInCount} / ${students.length} checked in`}
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
        }}
        styles={{ body: { padding: 0 } }}
      >
        {!selectedTermId ? (
          <div style={{ padding: "60px 0" }}>
            <Empty
              description={
                <Space direction="vertical" align="center">
                  <Text style={{ fontSize: 16, color: "#1D3557" }}>
                    Select a term to start checking in
                  </Text>
                  <Text style={{ color: "#ADB5BD" }}>
                    Choose a term from the dropdown above to view all students
                  </Text>
                </Space>
              }
            />
          </div>
        ) : (
          <>
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
                <Col xs={12} sm={6} md={4} lg={3}>
                  <Select
                    placeholder="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    allowClear
                    style={{ width: "100%" }}
                    options={[
                      { label: "Pending", value: "pending" },
                      { label: "Checked in", value: "checked_in" },
                    ]}
                  />
                </Col>
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
              scroll={{ x: 500 + termItems.length * 110 + (hasNoItems ? 110 : 0) }}
              locale={{
                emptyText: (
                  <Empty description="No students match your filters" />
                ),
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
};
