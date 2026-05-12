import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { supabaseClient } from "../providers/supabase-client";
import { useNavigate } from "react-router";

const { Text } = Typography;

interface Term {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface TermItem {
  id: string;
  term_id: string;
  item_name: string;
}

export const TermSettingsPage: React.FC = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termItems, setTermItems] = useState<Record<string, TermItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemTermId, setItemTermId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const { data: termsData } = await supabaseClient
      .from("terms")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: itemsData } = await supabaseClient
      .from("term_items")
      .select("*");

    setTerms(termsData || []);

    const grouped: Record<string, TermItem[]> = {};
    for (const item of itemsData || []) {
      if (!grouped[item.term_id]) grouped[item.term_id] = [];
      grouped[item.term_id].push(item);
    }
    setTermItems(grouped);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTerm = async (values: { name: string }) => {
    if (editingTerm) {
      const { error } = await supabaseClient
        .from("terms")
        .update({ name: values.name, updated_at: new Date().toISOString() })
        .eq("id", editingTerm.id);
      if (error) {
        message.error(error.message);
      } else {
        message.success("Term updated");
        setTermModalOpen(false);
        setEditingTerm(null);
        form.resetFields();
        fetchData();
      }
    } else {
      const { error } = await supabaseClient
        .from("terms")
        .insert({ name: values.name });
      if (error) {
        message.error(error.message);
      } else {
        message.success("Term created");
        setTermModalOpen(false);
        form.resetFields();
        fetchData();
      }
    }
  };

  const handleSetActive = async (term: Term) => {
    await supabaseClient.from("terms").update({ is_active: false, updated_at: new Date().toISOString() }).neq("id", term.id);
    const { error } = await supabaseClient
      .from("terms")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", term.id);
    if (error) {
      message.error(error.message);
    } else {
      message.success(`${term.name} set as active`);
      fetchData();
    }
  };

  const handleDeleteTerm = async (id: string) => {
    const { error } = await supabaseClient.from("terms").delete().eq("id", id);
    if (error) {
      message.error(error.message);
    } else {
      message.success("Term deleted");
      fetchData();
    }
  };

  const handleAddItem = async (values: { item_name: string }) => {
    if (!itemTermId) return;
    const { error } = await supabaseClient
      .from("term_items")
      .insert({ term_id: itemTermId, item_name: values.item_name });
    if (error) {
      message.error(error.message);
    } else {
      message.success("Item added");
      itemForm.resetFields();
      fetchData();
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabaseClient.from("term_items").delete().eq("id", id);
    if (error) {
      message.error(error.message);
    } else {
      fetchData();
    }
  };

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
              Term Settings
            </Text>
            <Text style={{ color: "#ADB5BD", fontSize: 13 }}>
              Dashboard &gt; Terms
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTerm(null);
                form.resetFields();
                setTermModalOpen(true);
              }}
              style={{
                background: "#00A896",
                border: "none",
                borderRadius: 8,
              }}
            >
              + Add Term
            </Button>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 300,
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
      ) : terms.length === 0 ? (
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
          }}
        >
          <Empty
            description="No terms created yet"
          >
            <Button
              type="primary"
              onClick={() => {
                setEditingTerm(null);
                form.resetFields();
                setTermModalOpen(true);
              }}
              style={{
                background: "#00A896",
                border: "none",
                borderRadius: 8,
              }}
            >
              Create First Term
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {terms.map((term) => (
            <Col xs={24} md={12} lg={8} key={term.id}>
              <Card
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 24px rgba(0,168,150,0.08)",
                  border: term.is_active ? "2px solid #00A896" : "none",
                }}
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/terms/${term.id}`)}
                  >
                    View
                  </Button>,
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingTerm(term);
                      form.setFieldsValue({ name: term.name });
                      setTermModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>,
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setItemTermId(term.id);
                      itemForm.resetFields();
                      setItemModalOpen(true);
                    }}
                  >
                    Add Item
                  </Button>,
                  <Popconfirm
                    title="Delete this term?"
                    onConfirm={() => handleDeleteTerm(term.id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text strong style={{ color: "#1D3557", fontSize: 16 }}>
                    {term.name}
                  </Text>
                  {term.is_active ? (
                    <Tag
                      color="#00A896"
                      icon={<CheckCircleOutlined />}
                      style={{ borderRadius: 12 }}
                    >
                      Active
                    </Tag>
                  ) : (
                    <Button
                      size="small"
                      onClick={() => handleSetActive(term)}
                      style={{
                        borderRadius: 12,
                        fontSize: 11,
                        borderColor: "#ADB5BD",
                        color: "#6C757D",
                      }}
                    >
                      Set Active
                    </Button>
                  )}
                </div>

                <div style={{ marginTop: 8 }}>
                  <Text
                    strong
                    style={{ color: "#6C757D", fontSize: 12, display: "block", marginBottom: 8 }}
                  >
                    Required Items
                  </Text>
                  {termItems[term.id]?.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {termItems[term.id].map((item) => (
                        <Tag
                          key={item.id}
                          closable
                          onClose={() => handleDeleteItem(item.id)}
                          style={{
                            borderRadius: 12,
                            background: "#E0F5F2",
                            color: "#007A6E",
                            border: "1px solid #B2E8E2",
                            margin: 0,
                          }}
                        >
                          {item.item_name}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text style={{ color: "#ADB5BD", fontSize: 12 }}>
                      No items defined
                    </Text>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingTerm ? "Edit Term" : "New Term"}
        open={termModalOpen}
        onCancel={() => {
          setTermModalOpen(false);
          setEditingTerm(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={editingTerm ? "Save" : "Create"}
        okButtonProps={{
          style: { background: "#00A896", border: "none", borderRadius: 8 },
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveTerm} style={{ marginTop: 16 }}>
          <Form.Item
            label="Term Name"
            name="name"
            rules={[{ required: true, message: "Please enter a term name" }]}
          >
            <Input placeholder="e.g. Term 1 2026" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Required Item"
        open={itemModalOpen}
        onCancel={() => {
          setItemModalOpen(false);
          setItemTermId(null);
          itemForm.resetFields();
        }}
        onOk={() => itemForm.submit()}
        okButtonProps={{
          style: { background: "#00A896", border: "none", borderRadius: 8 },
        }}
        destroyOnClose
      >
        <Form form={itemForm} layout="vertical" onFinish={handleAddItem} style={{ marginTop: 16 }}>
          <Form.Item
            label="Item Name"
            name="item_name"
            rules={[{ required: true, message: "Please enter an item name" }]}
          >
            <Input placeholder="e.g. Basket, Papers, Towel" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
