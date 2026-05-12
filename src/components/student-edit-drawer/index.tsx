import { useUpdate } from "@refinedev/core";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Upload,
  Divider,
  Popconfirm,
  Space,
  message,
  Typography,
} from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  IdcardOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { supabaseClient } from "../../providers/supabase-client";
import dayjs from "dayjs";

const { Text } = Typography;

const yearOptions = ["Year 1", "Year 2", "Year 3"];

interface StudentEditDrawerProps {
  open: boolean;
  onClose: () => void;
  student: Record<string, any>;
}

export const StudentEditDrawer: React.FC<StudentEditDrawerProps> = ({
  open,
  onClose,
  student,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(student?.photo_url);
  const { mutate: updateMutate } = useUpdate();

  const handleFinish = async (values: Record<string, any>) => {
    setLoading(true);
    updateMutate(
      {
        resource: "students",
        id: student.id,
        values: { ...values, photo_url: photoUrl },
        successNotification: () => ({
          message: "Student updated successfully",
          type: "success",
        }),
      },
      {
        onSuccess: () => {
          message.success("Student updated");
          setLoading(false);
          onClose();
        },
        onError: (err: any) => {
          setLoading(false);
          message.error(err?.message || "Update failed");
        },
      }
    );
  };

  const handleDelete = () => {
    setLoading(true);
    updateMutate(
      {
        resource: "students",
        id: student.id,
        values: { status: "inactive" },
        successNotification: () => ({
          message: "Student deactivated",
          type: "success",
        }),
      },
      {
        onSuccess: () => {
          message.success("Student deactivated");
          setLoading(false);
          onClose();
        },
        onError: (err: any) => {
          setLoading(false);
          message.error(err?.message || "Failed");
        },
      }
    );
  };

  return (
    <Drawer
      title={
        <Space>
          {dirty && (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                background: "#00A896",
                borderRadius: "50%",
              }}
            />
          )}
          Edit — {student?.full_name || "Student"}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={560}
      maskStyle={{ backdropFilter: "blur(2px)" }}
      styles={{ body: { padding: "24px 28px" } }}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Popconfirm
            title="Delete this student?"
            description="This action cannot be undone."
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />} loading={loading}>
              Delete Student
            </Button>
          </Popconfirm>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              disabled={!dirty}
              loading={loading}
              style={{
                background: "#00A896",
                border: "none",
                borderRadius: 8,
              }}
            >
              Save Changes
            </Button>
          </Space>
        </div>
      }
      key={student?.id}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={() => setDirty(true)}
        initialValues={{
          ...student,
          enrolled_at: student?.enrolled_at
            ? dayjs(student.enrolled_at)
            : undefined,
        }}
      >
        <Divider orientation="left" orientationMargin={0}>
          Personal Information
        </Divider>

        <Form.Item
          label="Full Name"
          name="full_name"
          rules={[
            { required: true, message: "Please enter the student's name" },
          ]}
        >
          <Input
            size="large"
            prefix={<UserOutlined style={{ color: "#ADB5BD" }} />}
            placeholder="e.g. Alice Johnson"
          />
        </Form.Item>

        <Form.Item
          label="Student ID"
          name="student_id"
          tooltip="Student ID cannot be changed after enrollment"
        >
          <Input
            size="large"
            prefix={<IdcardOutlined style={{ color: "#ADB5BD" }} />}
            disabled
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter an email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            size="large"
            prefix={<MailOutlined style={{ color: "#ADB5BD" }} />}
            placeholder="e.g. student@rca.edu"
          />
        </Form.Item>

        <Form.Item label="Phone" name="phone">
          <Input
            size="large"
            prefix={<PhoneOutlined style={{ color: "#ADB5BD" }} />}
            placeholder="e.g. +250 7XX XXX XXX"
          />
        </Form.Item>

        <Divider orientation="left" orientationMargin={0}>
          Academic Information
        </Divider>

        <Form.Item
          label="Year of Study"
          name="year_of_study"
          rules={[{ required: true, message: "Please select a year" }]}
        >
          <Select
            size="large"
            placeholder="Select year"
            options={yearOptions.map((y) => ({ label: y, value: y }))}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: "Please select a status" }]}
        >
          <Select
            size="large"
            options={[
              {
                label: (
                  <Space>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#00A896",
                        display: "inline-block",
                      }}
                    />
                    Active
                  </Space>
                ),
                value: "active",
              },
              {
                label: (
                  <Space>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#6C757D",
                        display: "inline-block",
                      }}
                    />
                    Inactive
                  </Space>
                ),
                value: "inactive",
              },
              {
                label: (
                  <Space>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#DC3545",
                        display: "inline-block",
                      }}
                    />
                    Suspended
                  </Space>
                ),
                value: "suspended",
              },
            ]}
          />
        </Form.Item>

        <Divider orientation="left" orientationMargin={0}>
          Profile Photo
        </Divider>

        <Upload.Dragger
          accept=".jpg,.jpeg,.png,.webp"
          maxCount={1}
          beforeUpload={(file) => {
            if (file.size > 2 * 1024 * 1024) {
              message.error("Photo must be under 2MB");
              return false;
            }
            return true;
          }}
          customRequest={async ({ file, onSuccess }) => {
            const path = `students/${Date.now()}-${(file as File).name}`;
            const { error } = await supabaseClient.storage
              .from("student-photos")
              .upload(path, file);
            if (error) {
              message.error(error.message);
              return;
            }
            const { data } = supabaseClient.storage
              .from("student-photos")
              .getPublicUrl(path);
            setPhotoUrl(data.publicUrl);
            setDirty(true);
            (onSuccess as any)("ok");
          }}
          style={{ borderRadius: 12, borderColor: "#00A896" }}
          onRemove={() => {
            setPhotoUrl(undefined);
            setDirty(true);
          }}
        >
          <InboxOutlined style={{ color: "#00A896", fontSize: 32 }} />
          <Text style={{ color: "#1D3557" }}>
            Click or drag photo here
          </Text>
          <br />
          <Text style={{ color: "#ADB5BD", fontSize: 12 }}>
            JPG, PNG, WEBP — max 2MB
          </Text>
        </Upload.Dragger>

        <Divider orientation="left" orientationMargin={0}>
          Notes
        </Divider>

        <Form.Item name="notes">
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder="Any additional notes about this student..."
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
