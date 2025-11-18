import React, { useMemo, useState } from "react";
import { Table, Input, Button, Space, Tag, Tooltip, Popover, Card } from "antd";
import { TagFilled, FileTextOutlined, ContactsOutlined } from "@ant-design/icons";

export type Gender = "male" | "female" | "other";
export type TagCategory = "preferences" | "medical" | "vip" | "marketing";

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
  phone: string;
  totalSpend: number;
  // grouped tags by category
  tags: Partial<Record<TagCategory, string[]>>;
  notes?: string[];
};

export type ClientDirectoryPageProps = {
  data: Client[];
  onViewProfile: (id: string) => void;
  onAddClient?: () => void;
};

const categoryMeta: Record<TagCategory, { label: string; color: string }> = {
  preferences: { label: "Preferences", color: "#606994" },
  medical: { label: "Medical", color: "#D45A61" },
  vip: { label: "VIP", color: "#9765b9" },
  marketing: { label: "Marketing", color: "#247F75" },
};

const genderColor = (g: Gender) => (g === "male" ? "geekblue" : g === "female" ? "magenta" : "#64748b");


export default function ClientDirectoryPage({ data, onViewProfile, onAddClient }: ClientDirectoryPageProps) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((c) => {
      const full = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        full.includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.phone.replace(/[^\d]/g, "").includes(needle.replace(/[^\d]/g, ""))
      );
    });
  }, [q, data]);

  const columns = [
    {
      title: "Client",
      key: "client",
      width: 300,
      render: (_: any, c: Client) => (
        <div>
          <Tag style={{ fontSize: '14px', padding: '2px 4px' }} color={c.gender === "male" ? "geekblue-inverse" : c.gender === "female" ? "magenta-inverse" : "default"}>
            {c.firstName} {c.lastName}
          </Tag>

          
          <div style={{ fontSize: 12, color: "#64748b" }}>{c.email}</div>
        </div>
      ),
    },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 160 },
    {
      title: "Total Spend",
      dataIndex: "totalSpend",
      key: "totalSpend",
      width: 180,
      render: (v: number) => `$${v.toLocaleString()}`,
      sorter: (a: Client, b: Client) => a.totalSpend - b.totalSpend,
    },
    {
      title: "Tags",
      key: "tags",
      width: 160,
      render: (_: any, c: Client) => {
        const cats = Object.keys(categoryMeta) as TagCategory[];
        const activeCats = cats.filter((k) => c.tags?.[k]?.length);
        if (activeCats.length === 0) return <span style={{ color: "#94a3b8" }}>—</span>;
        return (
          <Space size={0}>
            {activeCats.map((cat) => {
              const items = c.tags![cat]!;
              const meta = categoryMeta[cat];
              const content = (
                <div style={{ maxWidth: 280 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{meta.label}</div>
                  <Space wrap>
                    {items.map((t, i) => (
                      <Tag key={`${cat}-${i}`} color={meta.color}>{t}</Tag>
                    ))}
                  </Space>
                </div>
              );
              return (
                <Popover key={cat} content={content} trigger="click">
                  
                  <Tag style={{padding: '4px 4px 0px 4px' }} >  <TagFilled style={{ color: meta.color as any, fontSize: 16, cursor: "pointer" }} /></Tag>
                  
                </Popover>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: "Notes",
      key: "notes",
      width: 80,
      render: (_: any, c: Client) => (
        <Popover
          trigger="click"
          content={
            <div style={{ maxWidth: 320 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Client Notes</div>
              {c.notes && c.notes.length ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {c.notes.map((n, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{n}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#94a3b8" }}>No notes yet.</div>
              )}
            </div>
          }
        >
          
            <FileTextOutlined style={{ fontSize: 16, cursor: "pointer" }} />
          
        </Popover>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_: any, c: Client) => (
        <Button type="text" size="medium" onClick={() => onViewProfile(c.id)}>
         <ContactsOutlined /> View Profile
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Client Directory</h1>
        <Button type="primary" onClick={onAddClient}>Add Client</Button>
      </div>
      <Card style={{ borderRadius: 12 }}>
        <div className="flex items-center gap-2 mb-3">
          <Input.Search
            allowClear
            placeholder="Search name, email, or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 380 }}
          />
        </div>
        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
}