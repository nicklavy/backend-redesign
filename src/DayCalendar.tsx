import React from "react";
import { Card, Modal, Form, Input, Select } from "antd";
import { Dayjs } from "dayjs";

// Types
export type GenderPref = "male" | "female" | "any";
export type Provider = { id: string; name: string };
export type Appt = {
  id: string;
  providerId: string;
  start: Dayjs;
  end: Dayjs;
  clientName: string;
  serviceName: string;
  genderPref: GenderPref;
  groupId?: string;
};

export type Props = {
  date: Dayjs;
  providers: Provider[];
  appts: Appt[];
  onChange: (next: Appt[]) => void;
};

// Constants
const SLOT_MIN = 15; // 15-minute increments
const SLOT_H = 18;   // px height per 15 minutes
const OPEN = "09:00";
const CLOSE = "19:00";

// Helpers
function minutesBetween(a: Dayjs, b: Dayjs) {
  return b.diff(a, "minute");
}
function snapTo15(mins: number) {
  return Math.round(mins / SLOT_MIN) * SLOT_MIN;
}

export default function DayCalendar({ date, providers, appts, onChange }: Props) {
  const dayStart = date
    .startOf("day")
    .hour(parseInt(OPEN.split(":" )[0]))
    .minute(parseInt(OPEN.split(":" )[1]));
  const dayEnd = date
    .startOf("day")
    .hour(parseInt(CLOSE.split(":" )[0]))
    .minute(parseInt(CLOSE.split(":" )[1]));

  const totalMin = minutesBetween(dayStart, dayEnd);
  const totalSlots = totalMin / SLOT_MIN;

  const [newOpen, setNewOpen] = React.useState<{
    providerId: string;
    start: Dayjs;
  } | null>(null);
  const [form] = Form.useForm();

  // Layout appointments per provider (absolute positioned blocks)
  const layout = React.useMemo(() => {
    const byProv: Record<string, Array<Appt & { top: number; height: number }>> = {};
    providers.forEach((p) => (byProv[p.id] = []));
    for (const a of appts) {
      const topMins = minutesBetween(dayStart, a.start);
      const heightMins = minutesBetween(a.start, a.end);
      byProv[a.providerId].push({
        ...a,
        top: (topMins / SLOT_MIN) * SLOT_H,
        height: (heightMins / SLOT_MIN) * SLOT_H,
      });
    }
    return byProv;
  }, [appts, providers, dayStart]);

  // Double click to create appt
  const onGridDoubleClick = (e: React.MouseEvent, providerId: string) => {
    const col = e.currentTarget as HTMLElement;
    const rect = col.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const mins = snapTo15((y / SLOT_H) * SLOT_MIN);
    const start = dayStart.add(mins, "minute");
    setNewOpen({ providerId, start });
    form.setFieldsValue({
      providerId,
      start: start.format("HH:mm"),
      duration: 50,
      clientName: "",
      serviceName: "",
      genderPref: "any",
    });
  };

  const createAppt = async () => {
    const v = await form.validateFields();
    const start = dayStart
      .hour(parseInt(v.start.split(":" )[0]))
      .minute(parseInt(v.start.split(":" )[1]));
    const end = start.add(v.duration, "minute");
    const id = `a${Math.random().toString(36).slice(2, 8)}`;
    onChange([
      ...appts,
      {
        id,
        providerId: v.providerId,
        start,
        end,
        clientName: v.clientName,
        serviceName: v.serviceName,
        genderPref: v.genderPref,
      },
    ]);
    setNewOpen(null);
  };

  // Time labels each hour
  const ticks = React.useMemo(() => {
    const out: { y: number; label: string }[] = [];
    for (let m = 0; m <= totalMin; m += 60) {
      const t = dayStart.add(m, "minute");
      out.push({ y: (m / SLOT_MIN) * SLOT_H, label: t.format("h A") });
    }
    return out;
  }, [totalMin, dayStart]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header: providers */}
      <div className="grid" style={{ gridTemplateColumns: `120px repeat(${providers.length}, 1fr)` }}>
        <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">Providers</div>
        {providers.map((p) => (
          <div key={p.id} className="px-3 py-2 border-b font-medium">
            {p.name}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid" style={{ gridTemplateColumns: `120px repeat(${providers.length}, 1fr)` }}>
        {/* Time rail */}
        <div className="relative border-r">
          <div style={{ height: totalSlots * SLOT_H }} className="relative">
            {ticks.map((t) => (
              <div key={t.label} className="absolute left-0 w-full" style={{ top: t.y }}>
                <div className="text-[10px] text-gray-500 px-2 -translate-y-1/2">{t.label}</div>
                <div className="h-px bg-gray-100 ml-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Provider columns */}
        {providers.map((p) => (
          <div
            key={p.id}
            className="relative border-r"
            data-provider-col="true"
            data-pid={p.id}
            style={{
              height: totalSlots * SLOT_H,
              backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
              backgroundSize: `100% ${SLOT_H}px`,
            }}
            onDoubleClick={(e) => onGridDoubleClick(e, p.id)}
          >
            {layout[p.id]?.map((a) => (
              <div key={a.id} className="absolute px-1" style={{ top: a.top, height: a.height, left: 0, width: "100%" }}>
                <Card size="small" bodyStyle={{ padding: 6 }} className="h-full shadow cursor-pointer">
                  <div className="text-[10px] text-gray-500">
                    {a.start.format("h:mm A")} – {a.end.format("h:mm A")}
                  </div>
                  <div className="text-xs font-medium">
                    {a.clientName} <span className="text-[10px] text-gray-500">({a.genderPref})</span>
                  </div>
                  <div className="text-[11px] truncate">{a.serviceName}</div>
                  <div className="absolute bottom-1 left-1 right-1 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Create modal */}
      <Modal title="New Appointment" open={!!newOpen} onOk={createAppt} onCancel={() => setNewOpen(null)} okText="Create">
        <Form form={form} layout="vertical">
          <Form.Item name="providerId" label="Provider" rules={[{ required: true }]}>
            <Select options={providers.map((p) => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="start" label="Start Time (HH:mm)" rules={[{ required: true }]}>
            <Input placeholder="13:30" />
          </Form.Item>
          <Form.Item name="duration" label="Duration (minutes)" rules={[{ required: true, type: "number", min: 15 }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="clientName" label="Client" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="serviceName" label="Service" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="genderPref" label="Gender Preference" initialValue="any">
            <Select
              options={[
                { label: "No preference", value: "any" },
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}