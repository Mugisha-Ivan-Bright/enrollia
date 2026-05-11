import { useDelete, useInvalidate } from "@refinedev/core";
import {
  useTable,
} from "@refinedev/antd";
import { StudentFormModal } from "../components/student-form-modal";
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { supabaseClient } from "../providers/supabase-client";
import dayjs from "dayjs";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const yearOptions = [
  "Year 1",
  "Year 2",
  "Year 3",
];

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const { mutate: deleteMutate } = useDelete({});
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { tableProps, filters, setFilters } =
    useTable({
      resource: "students",
      sorters: { mode: "server" },
      filters: { mode: "server" },
      pagination: { pageSize: 10 },
    });

  const debouncedSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchText(value);
      if (value) {
        setFilters?.([
          { field: "full_name", operator: "contains", value },
        ], "replace");
      } else {
        setFilters?.([], "replace");
      }
    }, 300);
  };

  const handleBulkDelete = () => {
    selectedRowKeys.forEach((id) => {
      deleteMutate({
        resource: "students",
        id: id as string,
        successNotification: () => ({
          message: "Student deleted",
          type: "success",
        } as any),
      });
    });
    setSelectedRowKeys([]);
  };

  const exportCSV = async (selected?: string[]) => {
    const query = supabaseClient
      .from("students")
      .select("*")
      .order("enrolled_at", { ascending: false });

    if (selected?.length) {
      query.in("id", selected);
    }

    const { data } = await query;

    if (!data?.length) {
      message.warning("No data to export");
      return;
    }

    const headers = ["Student ID", "Full Name", "Email", "Phone", "Year of Study", "Status", "Enrolled Date"];
    const rows = data.map((s: any) =>
      [
        s.student_id,
        `"${s.full_name}"`,
        s.email,
        s.phone || "",
        `"${s.year_of_study}"`,
        s.status,
        dayjs(s.enrolled_at).format("DD/MM/YYYY"),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_export_${dayjs().format("YYYYMMDD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("CSV exported");
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_: string, __: any, i: number) => i + 1,
    },
    {
      title: "Student",
      dataIndex: "full_name",
      sorter: true,
      render: (_: string, r: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            style={{
              background: r.photo_url ? "transparent" : "#E0F5F2",
              color: "#00A896",
            }}
            src={r.photo_url}
          >
            {r.full_name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <div>
            <Text strong style={{ color: "#1D3557" }}>
              {r.full_name}
            </Text>
            <br />
            <Text style={{ fontSize: 12, color: "#6C757D" }}>{r.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Student ID",
      dataIndex: "student_id",
      sorter: true,
      render: (id: string) => (
        <Tooltip title="Click to copy">
          <Text copyable style={{ fontFamily: "monospace", fontSize: 13 }}>
            {id}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Year",
      dataIndex: "year_of_study",
      sorter: true,
      render: (y: string) => <Tag color="#00A896">{y}</Tag>,
    },
    {
      title: "Enrolled Date",
      dataIndex: "enrolled_at",
      sorter: true,
      render: (d: string) => (
        <Text style={{ color: "#6C757D" }}>{dayjs(d).format("DD MMM YYYY")}</Text>
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
          <Tag
            color={colors[s]}
            style={{ background: bg[s], border: "none", borderRadius: 6 }}
          >
            {s?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: string, r: any) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/students/${r.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/students/${r.id}`, { state: { edit: true } })}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this student?"
            description="This action cannot be undone."
            onConfirm={() =>
              deleteMutate({
                resource: "students",
                id: r.id,
                successNotification: () => ({
                  message: `${r.full_name} deleted`,
                  type: "success",
                } as any),
              })
            }
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
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
              Students
            </Text>
            <Text style={{ color: "#ADB5BD", fontSize: 13 }}>
              Dashboard &gt; Students
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportCSV()}
              >
                Export CSV
              </Button>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setModalOpen(true)}
                style={{
                  background: "#00A896",
                  border: "none",
                  borderRadius: 8,
                }}
              >
                + Enroll Student
              </Button>
            </Space>
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
          <Col xs={24} sm={24} md={8} lg={6}>
            <Input.Search
              placeholder="Search by name or student ID..."
              onChange={(e) => debouncedSearch(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Select
              placeholder="Year"
              allowClear
              style={{ width: "100%" }}
              options={yearOptions.map((y) => ({ label: y, value: y }))}
            />
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: "100%" }}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Suspended", value: "suspended" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              style={{ width: "100%" }}
            />
          </Col>
          <Col>
            <Button onClick={() => {
              setSearchText("");
              setFilters?.([], "replace");
            }}>
              Clear filters
            </Button>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <div
            style={{
              background: "#1D3557",
              borderRadius: 10,
              padding: "12px 20px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: 500 }}>
              {selectedRowKeys.length} student(s) selected
            </Text>
            <Space>
              <Button ghost danger onClick={handleBulkDelete}>
                <DeleteOutlined /> Bulk Delete
              </Button>
              <Button ghost onClick={() => exportCSV(selectedRowKeys as string[])}>
                <DownloadOutlined /> Export Selected
              </Button>
              <Button ghost onClick={() => setSelectedRowKeys([])}>
                Deselect all
              </Button>
            </Space>
          </div>
        )}

        <Table
          {...tableProps}
          columns={columns}
          rowKey="id"
          scroll={{ x: 900 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            style: { cursor: "pointer" },
            onClick: () => navigate(`/students/${record.id}`),
          })}
          pagination={
            tableProps.pagination
              ? {
                  ...tableProps.pagination,
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "25", "50"],
                  showTotal: (total: number, range: number[]) =>
                    `Showing ${range[0]}-${range[1]} of ${total} students`,
                }
              : undefined
          }
          locale={{
            emptyText: (
              <Empty
                description={
                  searchText
                    ? "No students match your filters"
                    : "No students enrolled yet"
                }
              >
                {!searchText && (
                  <Button
                    type="primary"
                    onClick={() => setModalOpen(true)}
                    style={{
                      background: "#00A896",
                      border: "none",
                      borderRadius: 8,
                    }}
                  >
                    Enroll First Student
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>

      <StudentFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          invalidate({ resource: "students", invalidates: ["list"] });
        }}
      />
    </div>
  );
};
