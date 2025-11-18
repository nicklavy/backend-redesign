import React from "react";
import { Card, Descriptions, Space, Button, Tag, Table, Tooltip, Input, DatePicker, Select } from "antd";
import type { Client, TagCategory } from "./ClientDirectoryPage";
import dayjs from "dayjs";
import { UserOutlined, FileTextOutlined } from "@ant-design/icons";

export type AppointmentRow = {
  id: string;
  date: string; // ISO
  provider: string;
  providerGender: "male" | "female" | "other";
  service: string;
  servicePrice?: number; // optional unit price for computing order totals
  status: "completed" | "upcoming" | "canceled";
  orderNo: string; // clickable to order (future)
};

export type PurchaseRow = {
  id: string;
  sku: string;
  name: string;
  image?: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number; // unit price
  qty: number;
  total: number; // price * qty
  orderNo: string;
};

export type ClientProfilePageProps = {
  client: Client;
  appointments: AppointmentRow[];
  purchases: PurchaseRow[];
  onBack: () => void;
  onUpdateClient?: (next: Client) => void;
};

const categoryColor: Record<TagCategory, string> = {
  preferences: "geekblue",
  medical: "volcano",
  vip: "gold",
  marketing: "green",
};

export default function ClientProfilePage({ client, appointments, purchases, onBack, onUpdateClient }: ClientProfilePageProps) {
  // Editable tags per category (simple demo; wire to API later)
  const [model, setModel] = React.useState<Client>(client);
  const [newNote, setNewNote] = React.useState("");
  const addNote = () => {
    const text = newNote.trim();
    if (!text) return;
    const stamped = `${dayjs().format("MMM D, YYYY h:mm A")} — ${text}`;
    const next = [stamped, ...(model.notes || [])];
    setModel((m) => ({ ...m, notes: next }));
    onUpdateClient?.({ ...model, notes: next });
    setNewNote("");
  };

  const setTags = (cat: TagCategory, items: string[]) => {
    setModel((m) => ({ ...m, tags: { ...m.tags, [cat]: items } }));
    onUpdateClient?.({ ...model, tags: { ...model.tags, [cat]: items } });
  };

  const tagBucket = (cat: TagCategory, placeholder: string) => (
    <Card size="small" style={{ borderRadius: 10 }}>
      <div className="mb-2 font-medium">{cat[0].toUpperCase() + cat.slice(1)}</div>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          mode="tags"
          allowClear
          placeholder={placeholder}
          style={{ width: "100%" }}
          value={model.tags?.[cat] ?? []}
          onChange={(vals) => setTags(cat, vals as string[])}
        />
        <div>
          {(model.tags?.[cat] ?? []).map((t, i) => (
            <Tag key={`${cat}-${i}`} color={categoryColor[cat]} style={{ marginBottom: 6 }}>
              {t}
            </Tag>
          ))}
        </div>
      </Space>
    </Card>
  );

  const apptCols = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (v: string) => dayjs(v).format("MMM D, YYYY"),
    },
    {
      title: "Time",
      key: "time",
      width: 110,
      render: (_: any, r: AppointmentRow) => dayjs(r.date).format("h:mm A"),
    },
    {
      title: "Provider",
      key: "provider",
      render: (_: any, r: AppointmentRow) => (
        <Tag color={r.providerGender === "male" ? "geekblue" : r.providerGender === "female" ? "magenta" : "default"}>
          {r.provider}
        </Tag>
      ),
    },
    { title: "Service", dataIndex: "service", key: "service" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: AppointmentRow["status"]) => (
        <Tag color={s === "completed" ? "green" : "blue"}>{s === "completed" ? "Completed" : "Upcoming"}</Tag>
      ),
    },
    {
      title: "Order #",
      dataIndex: "orderNo",
      key: "orderNo",
      render: (o: string) => (
        <Tooltip title="Open order (coming soon)">
          <Button type="link">{o}</Button>
        </Tooltip>
      ),
    },
  ];

  const purchaseCols = [
    {
      title: "Product",
      key: "product",
      width: 280,
      render: (_: any, p: PurchaseRow) => (
        <Space>
          {p.image ? (
            <img src={p.image} alt="" width={32} height={32} style={{ borderRadius: 6, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f1f5f9" }} />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>SKU: {p.sku}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Category",
      key: "category",
      width: 180,
      render: (_: any, p: PurchaseRow) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.category} &gt;</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{p.subcategory}</div>
        </div>
      ),
    },
    {
      title: "Order #",
      dataIndex: "orderNo",
      key: "orderNo",
      width: 140,
      render: (o: string) => (
        <Tooltip title="Open order (coming soon)"><Button type="link">{o}</Button></Tooltip>
      ),
    },
    { title: "Brand", dataIndex: "brand", key: "brand", width: 140 },
    { title: "Price", dataIndex: "price", key: "price", width: 110, render: (v: number) => `$${v.toFixed(2)}` },
    { title: "Qty", dataIndex: "qty", key: "qty", width: 80 },
    { title: "Total", dataIndex: "total", key: "total", width: 120, render: (v: number) => `$${v.toFixed(2)}` },
  ];

  type OrderRow = {
    id: string;         // same as orderNo
    date: string;       // earliest timestamp among items in the order
    orderNo: string;
    servicesTotal: number;
    retailTotal: number;
    tip: number;
    total: number;
    status: "Paid" | "Not Paid" | "Canceled";
  };

  const orders: OrderRow[] = React.useMemo(() => {
    const map = new Map<string, OrderRow>();

    // helper to init or get an order row
    const ensure = (orderNo: string, dateISO: string): OrderRow => {
      if (!map.has(orderNo)) {
        map.set(orderNo, {
          id: orderNo,
          date: dateISO,
          orderNo,
          servicesTotal: 0,
          retailTotal: 0,
          tip: 0,
          total: 0,
          status: "Not Paid",
        });
      } else {
        // keep earliest date
        const row = map.get(orderNo)!;
        if (dayjs(dateISO).isBefore(dayjs(row.date))) row.date = dateISO;
      }
      return map.get(orderNo)!;
    };

    // fold in appointments
    for (const a of appointments) {
      if (!a.orderNo) continue;
      const row = ensure(a.orderNo, a.date);
      row.servicesTotal += a.servicePrice ?? 0;
      if (a.status === "canceled") row.status = "Canceled";
      else if (a.status === "completed" && row.status !== "Canceled") row.status = "Paid";
    }

    // fold in retail purchases
    for (const p of purchases) {
      if (!p.orderNo) continue;
      const row = ensure(p.orderNo, new Date().toISOString());
      row.retailTotal += p.total ?? p.price * p.qty;
    }

    // finalize totals
    for (const row of map.values()) {
      row.total = row.servicesTotal + row.retailTotal + row.tip;
    }

    // return sorted by date desc
    return Array.from(map.values()).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }, [appointments, purchases]);

  const orderCols = [
    { title: "Date", dataIndex: "date", key: "date", width: 140, render: (v: string) => dayjs(v).format("MMM D, YYYY") },
    { title: "Order #", dataIndex: "orderNo", key: "orderNo", width: 140, render: (o: string) => (<Button type="link">{o}</Button>) },
    { title: "Services Total", dataIndex: "servicesTotal", key: "servicesTotal", width: 150, render: (n: number) => `$${n.toFixed(2)}` },
    { title: "Retail Total", dataIndex: "retailTotal", key: "retailTotal", width: 140, render: (n: number) => `$${n.toFixed(2)}` },
    { title: "Tip", dataIndex: "tip", key: "tip", width: 100, render: (n: number) => `$${n.toFixed(2)}` },
    { title: "Total", dataIndex: "total", key: "total", width: 120, render: (n: number) => `$${n.toFixed(2)}` },
    { title: "Status", dataIndex: "status", key: "status", width: 120, render: (s: OrderRow["status"]) => (<Tag color={s === "Paid" ? "green" : s === "Canceled" ? "volcano" : "gold"}>{s}</Tag>) },
  ];

  return (
  <div className="flex flex-col gap-6">
    <div className="self-start">
      <Button type="link" onClick={onBack} style={{ paddingLeft: 0 }}>&larr; Return to Client Directory</Button>
    </div>
    <h1 className="text-2xl font-semibold mt-2"><UserOutlined /> {client.firstName} {client.lastName}</h1>

    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Client Profile (top) */}
        <Card title="Client Profile" style={{ borderRadius: 12 }}>
          <Descriptions
            column={2}
            size="large"
            labelStyle={{ fontWeight: 400 }}
            contentStyle={{ display: 'flex', alignItems: 'center' }}
          >
            <Descriptions.Item label="Name">{model.firstName} {model.lastName}</Descriptions.Item>
            <Descriptions.Item label="Email">{model.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{model.phone}</Descriptions.Item>
            <Descriptions.Item label="Gender">{model.gender}</Descriptions.Item>
            <Descriptions.Item label="Address">
              <Input placeholder="Street Address" defaultValue={(model as any).address} />
            </Descriptions.Item>
            <Descriptions.Item label="City">
              <Input placeholder="City" defaultValue={(model as any).city} />
            </Descriptions.Item>
            <Descriptions.Item label="State">
              <Input placeholder="State" defaultValue={(model as any).state} />
            </Descriptions.Item>
            <Descriptions.Item label="Birthdate">
              <DatePicker defaultValue={(model as any).birthdate ? dayjs((model as any).birthdate) : undefined} />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Right: Notes spanning full height of left column (both cards) */}
        <Card title="Notes" style={{ borderRadius: 12 }} className="lg:row-span-2 h-full">
          <div className="flex items-start gap-2">
            <Input.TextArea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Add a note about this client..."
            />
            <Button type="primary" onClick={addNote} disabled={!newNote.trim()}>Add Note</Button>
          </div>

          <div className="mt-4">
            {model.notes && model.notes.length ? (
              <ul className="pl-0">
                {model.notes.map((n, i) => (
                  <li key={i} className="mb-2 flex items-start gap-2">
                    <FileTextOutlined className="mt-1" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-sm">No notes yet.</div>
            )}
          </div>
        </Card>

        {/* Left: Profile Tags (bottom) */}
        <Card title="Profile Tags" style={{ borderRadius: 12 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tagBucket("preferences", "Add preferences (e.g., aromatherapy, pressure)")}
            {tagBucket("medical", "Add medical notes (e.g., allergies)")}
            {tagBucket("vip", "Add VIP tags (e.g., Platinum, High LTV)")}
            {tagBucket("marketing", "Add marketing tags (e.g., SMS opt-in)")}
          </div>
        </Card>
      </div>

      <Card title="Appointments" style={{ borderRadius: 12 }}>
        <Table rowKey="id" columns={apptCols as any} dataSource={appointments} pagination={{ pageSize: 8 }} />
      </Card>

      <Card title="Product Purchases" style={{ borderRadius: 12 }}>
        <Table rowKey="id" columns={purchaseCols as any} dataSource={purchases} pagination={{ pageSize: 8 }} />
      </Card>

        <Card title="Orders" style={{ borderRadius: 12 }}>
        <Table rowKey="id" columns={orderCols as any} dataSource={orders} pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  </div>
  );
}