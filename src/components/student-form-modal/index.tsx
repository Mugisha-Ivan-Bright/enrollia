import { useCreate, useUpdate } from "@refinedev/core";
import { Form, Input, Modal, Select, message } from "antd";
import { useState } from "react";
import { supabaseClient } from "../../providers/supabase-client";

const yearOptions = [
  "Year 1",
  "Year 2",
  "Year 3",
];

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: Record<string, any>;
}

async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabaseClient
    .from("students")
    .select("student_id")
    .order("student_id", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextNum = 1;
  if (data?.student_id) {
    const match = data.student_id.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  return `RCA${year}${String(nextNum).padStart(4, "0")}`;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  open,
  onClose,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { mutate: createMutate } = useCreate();
  const { mutate: updateMutate } = useUpdate();
  const isEdit = !!initialValues;

  const handleFinish = async (values: Record<string, any>) => {
    setLoading(true);

    if (isEdit) {
      updateMutate(
        {
          resource: "students",
          id: initialValues.id,
          values,
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
    } else {
      const studentId = await generateStudentId();
      createMutate(
        {
          resource: "students",
          values: { ...values, student_id: studentId },
          successNotification: () => ({
            message: "Student enrolled successfully",
            type: "success",
          }),
        },
        {
          onSuccess: () => {
            message.success("Student enrolled");
            setLoading(false);
            onClose();
          },
          onError: (err: any) => {
            setLoading(false);
            message.error(err?.message || "Enrollment failed");
          },
        }
      );
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit Student" : "Enroll New Student"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={isEdit ? 600 : 440}
      key={String(open)}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={
          initialValues
            ? { ...initialValues, enrolled_at: undefined }
            : { status: "active" }
        }
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="Full Name"
          name="full_name"
          rules={[{ required: true, message: "Please enter the student's name" }]}
        >
          <Input placeholder="e.g. Alice Johnson" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter an email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="e.g. student@rca.edu" />
        </Form.Item>

        <Form.Item
          label="Year of Study"
          name="year_of_study"
          rules={[{ required: true, message: "Please select a year" }]}
        >
          <Select
            placeholder="Select year"
            options={yearOptions.map((y) => ({ label: y, value: y }))}
          />
        </Form.Item>

        {isEdit && (
          <>
            <Form.Item label="Student ID" name="student_id">
              <Input disabled />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input placeholder="e.g. +1-555-0120" />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Please select a status" }]}
            >
              <Select
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                  { label: "Suspended", value: "suspended" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={3} placeholder="Optional notes..." />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
