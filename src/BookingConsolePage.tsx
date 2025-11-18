import React, { useMemo, useState } from "react";
import { Card, DatePicker, Select, Space, Tag, Table, Button, Typography, Divider, Progress, Tooltip, Dropdown } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { Column, Bar, Pie, Gauge } from "@ant-design/plots";
import {
  EllipsisOutlined,
  CheckCircleTwoTone,
  ClockCircleOutlined,
  PlayCircleTwoTone,
  CloseCircleTwoTone,
  ExclamationCircleTwoTone,
} from "@ant-design/icons";

const STORAGE_KEY = "bookingConsoleStateV1";

type Gender = "male" | "female";
type Provider = { id: string; name: string; gender: Gender };
type Client = { id: string; name: string; gender: Gender; email: string };
type Appt = {
  id: string;
  time: string;              // "HH:mm"
  start: Dayjs;              // actual time
  client: Client;
  service: string;
  provider: Provider;
  cost: number;
  // Before
// status: "scheduled" | "checkedin" | "noshow" | "canceled";

// After
status: "scheduled" | "checkedin" | "complete" | "noshow" | "canceled" | "inservice";
};

// --- Mock providers
const PROVIDERS: Provider[] = [
  { id: "p1", name: "Alex Johnson", gender: "male" },
  { id: "p2", name: "Taylor Smith", gender: "female" },
  { id: "p3", name: "Jordan Lee", gender: "female" },
  { id: "p4", name: "Chris Young", gender: "male" },
  { id: "p5", name: "Riley Bennett", gender: "female" },
  { id: "p6", name: "Morgan Price", gender: "male" },
];

// --- Mock appointments for a given date
function buildApptsFor(date: Dayjs): Appt[] {
  const base = date.startOf("day");
  type Block = { t: string; svc: string; prov: string; client: { name: string; gender: Gender; email: string }; cost: number };
  const blocks: Block[] = [
    // Morning
    { t: "09:00", svc: "Swedish Massage (50m)", prov: "p1", client: { name: "John Carter", gender: "male", email: "john@example.com" }, cost: 160 },
    { t: "09:15", svc: "Swedish Massage (50m)", prov: "p6", client: { name: "Daniel Ruiz", gender: "male", email: "daniel@example.com" }, cost: 160 },
    { t: "09:30", svc: "HydraFacial (30m)",    prov: "p2", client: { name: "Mia Wong", gender: "female", email: "mia@example.com" }, cost: 140 },
    { t: "10:00", svc: "Deep Tissue (80m)",    prov: "p1", client: { name: "Peter Miles", gender: "male", email: "peter@example.com" }, cost: 220 },
    { t: "10:30", svc: "Swedish Massage (50m)", prov: "p3", client: { name: "Grace Lin", gender: "female", email: "grace@example.com" }, cost: 160 },

    // Late morning / midday
    { t: "11:00", svc: "Signature Facial",      prov: "p5", client: { name: "Hannah Lee", gender: "female", email: "hannah@example.com" }, cost: 170 },
    { t: "11:30", svc: "Hot Stone (50m)",       prov: "p3", client: { name: "Ava Patel", gender: "female", email: "ava@example.com" }, cost: 185 },
    { t: "12:00", svc: "Swedish Massage (50m)", prov: "p6", client: { name: "Mark Ellis", gender: "male", email: "mark@example.com" }, cost: 160 },

    // Early afternoon
    { t: "13:00", svc: "Reflexology (25m)",     prov: "p4", client: { name: "Luke Shaw", gender: "male", email: "luke@example.com" }, cost: 95 },
    { t: "13:15", svc: "Reflexology (25m)",     prov: "p2", client: { name: "Laura King", gender: "female", email: "laura@example.com" }, cost: 95 },
    { t: "13:30", svc: "Couples Massage",       prov: "p2", client: { name: "Sophie Reed", gender: "female", email: "sophie@example.com" }, cost: 320 },
    { t: "14:00", svc: "Swedish Massage (50m)", prov: "p5", client: { name: "Isabella Cruz", gender: "female", email: "isabella@example.com" }, cost: 160 },

    // Mid/Late afternoon
    { t: "15:00", svc: "Signature Facial",      prov: "p3", client: { name: "Emily Rose", gender: "female", email: "emily@example.com" }, cost: 170 },
    { t: "15:30", svc: "Hot Stone (50m)",       prov: "p4", client: { name: "Diego Perez", gender: "male", email: "diego@example.com" }, cost: 185 },
    { t: "16:00", svc: "HydraFacial (30m)",     prov: "p2", client: { name: "Sara Novak", gender: "female", email: "sara@example.com" }, cost: 140 },
    { t: "16:30", svc: "Aromatherapy (50m)",    prov: "p4", client: { name: "Noah Kim", gender: "male", email: "noah@example.com" }, cost: 165 },
    { t: "17:00", svc: "Swedish Massage (50m)", prov: "p1", client: { name: "Paul Baker", gender: "male", email: "paul@example.com" }, cost: 160 },
  ];

  return blocks.map((b, i) => {
    const [h, m] = b.t.split(":").map(Number);
    const start = base.add(h, "hour").add(m, "minute");
    const provider = PROVIDERS.find((p) => p.id === b.prov)!;
    const client: Client = { id: `c${i + 1}`, name: b.client.name, gender: b.client.gender, email: b.client.email };
    return {
      id: String(i + 1),
      time: b.t,
      start,
      client,
      service: b.svc,
      provider,
      cost: b.cost,
      status: "scheduled",
    };
  });
}

const genderTag = (name: string, gender: Gender, variant: "client" | "provider" = "provider") => {
  if (variant === "client") {
    return <Tag color={gender === "male" ? "geekblue-inverse" : "magenta-inverse"}>{name}</Tag>;
  }
  return <Tag color={gender === "male" ? "geekblue" : "magenta"}>{name}</Tag>;
};
const statusTag = (status: Appt["status"]) => {
  switch (status) {
    case "checkedin":
      return (
        <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">
          Checked-In
        </Tag>
      );
    case "inservice":
      return (
        <Tag icon={<PlayCircleTwoTone twoToneColor="#722ed1" />} color="purple">
          In-Service
        </Tag>
      );
       case "complete":
      return (
        <Tag icon={<CheckCircleTwoTone twoToneColor="#7ab7c4ff" />} color="success">
          Complete
        </Tag>
      );
    case "canceled":
      return (
        <Tag icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />} color="error">
          Canceled
        </Tag>
      );
    case "noshow":
      return (
        <Tag icon={<ExclamationCircleTwoTone twoToneColor="#fa8c16" />} color="warning">
          No-Show
        </Tag>
      );
    case "scheduled":
    default:
      return (
        <Tag icon={<ClockCircleOutlined />} color="default">
          Upcoming
        </Tag>
      );
  }
};

const currency = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function BookingConsolePage() {
  const [day, setDay] = useState<Dayjs>(dayjs());
  const [providerFilter, setProviderFilter] = useState<string | undefined>(undefined);
  // Local status overrides per appointment id
  const [statusMap, setStatusMap] = useState<Record<string, Appt["status"]>>({});
  const setApptStatus = (id: string, status: Appt["status"]) =>
    setStatusMap((m) => ({ ...m, [id]: status }));

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        day?: string;
        providerFilter?: string;
        statusMap?: Record<string, Appt["status"]>;
      };
      if (parsed.day) setDay(dayjs(parsed.day));
      if (parsed.providerFilter !== undefined) setProviderFilter(parsed.providerFilter || undefined);
      if (parsed.statusMap) setStatusMap(parsed.statusMap);
    } catch (e) {
      console.warn("Failed to load saved booking console state", e);
    }
  }, []);

  // Persist state to localStorage when relevant values change
  React.useEffect(() => {
    try {
      const payload = {
        day: day.format("YYYY-MM-DD"),
        providerFilter: providerFilter || "",
        statusMap,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save booking console state", e);
    }
  }, [day, providerFilter, statusMap]);

  const allAppts = useMemo(() => buildApptsFor(day), [day]);

  const appts = useMemo(() => {
    let a = [...allAppts];
    if (providerFilter) a = a.filter((x) => x.provider.id === providerFilter);
    // sort by time then client name
    a.sort((x, y) => (x.start.valueOf() - y.start.valueOf()) || x.client.name.localeCompare(y.client.name));
return a.map((x) => ({ ...x, status: statusMap[x.id] ?? x.status }));
  }, [allAppts, providerFilter, statusMap]);

  // KPIs
  const projectedRevenue = appts.reduce((s, x) => s + x.cost, 0);
  const bookedCount = appts.length;
  const capacity = 8 * PROVIDERS.length; // demo: 8 time blocks per provider
  const utilization = Math.round((bookedCount / capacity) * 100);
  const avgTicket = bookedCount ? Math.round(projectedRevenue / bookedCount) : 0;

  // High-traffic by hour (counts)
  const perHour = useMemo(() => {
    const map = new Map<string, number>();
    appts.forEach((a) => {
      const h = a.start.format("HH:00");
      map.set(h, (map.get(h) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([h1], [h2]) => h1.localeCompare(h2))
      .map(([hour, count]) => ({ hour, count }));
  }, [appts]);

  // Provider availability (demo): assume each provider has 8 slots, availability % = free/8
  const providerAvail = useMemo(() => {
    const slots = 8;
    const counts: Record<string, number> = {};
    appts.forEach((a) => { counts[a.provider.id] = (counts[a.provider.id] || 0) + 1; });
    return PROVIDERS.map((p) => {
      const used = counts[p.id] || 0;
      const free = Math.max(0, slots - used);
      const pct = Math.round((free / slots) * 100);
      return { provider: p, free, used, pct };
    });
  }, [appts]);

  // Service mix (count per service)
  const serviceMix = useMemo(() => {
    const map = new Map<string, number>();
    appts.forEach((a) => map.set(a.service, (map.get(a.service) || 0) + 1));
    return Array.from(map.entries()).map(([service, count]) => ({ service, count }));
  }, [appts]);

  // Simplified datasets for progress bars
  const topServices = useMemo(() => {
    return [...serviceMix].sort((a,b)=>b.count-a.count).slice(0, 10);
  }, [serviceMix]);

  const providerUtilization = useMemo(() => {
    // utilization % = used / (used+free) * 100; we know total slots = used + free
    return [...providerAvail]
      .map(({ provider, used, free }) => ({ name: provider.name, pct: Math.round((used / Math.max(1, used + free)) * 100), used }))
      .sort((a, b) => b.pct - a.pct);
  }, [providerAvail]);

  const hourlyTraffic = useMemo(() => {
    const providerCount = PROVIDERS.length || 1;
    return perHour.map((x) => ({
      hour: x.hour,
      count: x.count,
      // Utilization per hour where 100% = number of providers
      pct: Math.min(100, Math.round((x.count / providerCount) * 100)),
    }));
  }, [perHour]);

  // --- Recommendation type and heuristic builder
  type Recommendation = {
    title: string;
    rationale: string;
    actionLabel?: string;
    onAction?: () => void;
    severity?: "info" | "suggested" | "important";
  };

  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = [];
    const titles = new Set<string>();
    const push = (r: Recommendation) => {
      if (!titles.has(r.title)) {
        recs.push(r);
        titles.add(r.title);
      }
    };

    // Peak hour shift
    const peak = perHour.reduce<{ hour: string; count: number }>((m, x) => (x.count > m.count ? x : m), { hour: "", count: -1 });
    if (peak.count >= 3) {
      push({
        title: `Rebalance staff around ${peak.hour}`,
        rationale: `Peak demand ${peak.hour} with ${peak.count} bookings; shift one low-demand slot into this hour.`,
        actionLabel: "Propose slot mix",
        onAction: () => console.log("slot-mix"),
        severity: "suggested",
      });
    }

    // Underused provider
    const mostFree = [...providerAvail].sort((a,b)=>b.pct-a.pct)[0];
    if (mostFree && mostFree.pct >= 50) {
      push({
        title: `Underused provider: ${mostFree.provider.name}`,
        rationale: `${mostFree.pct}% availability today. Offer spillover or same-day promo.`,
        actionLabel: "Start same-day promo",
        onAction: () => console.log("promo"),
        severity: "info",
      });
    }

    // Price test by service — make condition a bit looser and more robust
    const sortedMix = [...serviceMix].sort((a,b)=>b.count-a.count);
    if (sortedMix.length >= 2) {
      const [top, second] = sortedMix;
      const low = sortedMix[sortedMix.length - 1];
      // Show price test if top clearly outperforms second, or top is 2+ and low is 0–1
      if ((top.count >= second.count + 1) || (top.count >= 2 && low.count <= 1)) {
        push({
          title: `Price test: ${top.service}`,
          rationale: `${top.service} outperforms today ( ${top.count} vs ${second.count} ). Try +5% on peak hours.`,
          actionLabel: "Create price test",
          onAction: () => console.log("price-test"),
          severity: "important",
        });
      }
    } else if (sortedMix.length === 1 && sortedMix[0].count >= 3) {
      // Only one strong service
      const top = sortedMix[0];
      push({
        title: `Price test: ${top.service}`,
        rationale: `${top.service} dominates today with ${top.count} bookings. Trial +5% this afternoon.`,
        actionLabel: "Create price test",
        onAction: () => console.log("price-test"),
        severity: "important",
      });
    }

    // Utilization improvement
    if (utilization < 70) {
      push({
        title: "Add short late-afternoon slots",
        rationale: `Utilization ${utilization}%. Two 25–30m slots from 14:00–16:00 can raise fill rate.`,
        actionLabel: "Add 2 short slots",
        onAction: () => console.log("add-slots"),
        severity: "suggested",
      });
    }

    // Pad with distinct info cards (no duplicates)
    const fillers: Recommendation[] = [
      { title: "Monitor demand trend", rationale: "Watch hourly bookings; consider micro-promos during soft periods.", severity: "info" },
      { title: "Upsell high-margin add-ons", rationale: "Prompt add-ons for facials/massage at check-in to lift ticket.", severity: "info" },
      { title: "Remind no-show risks", rationale: "Send SMS reminders 2 hours prior for 13:00–15:00 slots.", severity: "info" },
      { title: "Promote low-demand service", rationale: "Bundle reflexology as a 25m add-on at −15% today.", severity: "info" },
    ];
    for (const f of fillers) {
      if (recs.length >= 4) break;
      push(f);
    }

    return recs.slice(0, 4);
  }, [perHour, providerAvail, serviceMix, utilization]);

  const columns: ColumnsType<Appt> = [
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      width: 120,
      sorter: (a, b) => a.start.valueOf() - b.start.valueOf(),
      defaultSortOrder: "ascend",
      render: (_, r) => r.start.format("h:mm A"),
    },
    {
      title: "Client",
      key: "client",
      render: (_, r) => (
        <div>
          {genderTag(r.client.name, r.client.gender, "client")}<br />
          <span className="text-xs text-gray-500">{r.client.email}</span>
        </div>
      ),
    },
    { title: "Service", dataIndex: "service", key: "service", width: 220 },
    {
      title: "Provider",
      key: "provider",
      width: 180,
      render: (_, r) => genderTag(r.provider.name, r.provider.gender),
      filters: PROVIDERS.map((p) => ({ text: p.name, value: p.id })),
      onFilter: (val, row) => row.provider.id === val,
    },
    {
      title: "Cost",
      dataIndex: "cost",
      key: "cost",
      align: "right",
      width: 120,
      render: (n: number) => <strong>{currency(n)}</strong>,
    },
    {
  title: "Status",
  key: "status",
  width: 180,
  render: (_, r) => statusTag(r.status),
  filters: [
    { text: "Upcoming", value: "scheduled" },
    { text: "Checked-In", value: "checkedin" },
    { text: "In-Service", value: "inservice" },
    { text: "Complete", value: "complete" },
    { text: "Canceled", value: "canceled" },
    { text: "No-Show", value: "noshow" },
  ],
  onFilter: (val, row) => row.status === val,
},
    {
  title: "",
  key: "actions",
  align: "right",
  width: 120, // narrower now
  render: (_, r) => {
    const menuItems = [
      { key: "checkin", label: "Check-In" },
      { key: "inservice", label: "In-Service" },
      { key: "complete", label: "Complete" },
      { type: "divider" as const },
      { key: "noshow", label: "No-show" },
      { key: "cancel", label: "Cancel", danger: true },
      { type: "divider" as const },
      { key: "edit", label: "Edit" },
    ];
    return (
      <Dropdown
        trigger={["click"]}
        menu={{
          items: menuItems,
          onClick: ({ key }) => {
            if (key === "checkin") setApptStatus(r.id, "checkedin");
            if (key === "inservice") setApptStatus(r.id, "inservice");
            if (key === "complete") setApptStatus(r.id, "complete");
            if (key === "noshow") setApptStatus(r.id, "noshow");
            if (key === "cancel") setApptStatus(r.id, "canceled");
            if (key === "edit") console.log("edit", r.id);
          },
        }}
      >
        <Button size="small" shape="circle" icon={<EllipsisOutlined />} />
      </Dropdown>
    );
  },
},
  ];

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Daily Overview</h1>
        <Space wrap>
          <DatePicker
            value={day}
            onChange={(d) => setDay(d || dayjs())}
            allowClear={false}
          />
          <Select
            allowClear
            placeholder="Filter by provider"
            value={providerFilter}
            onChange={setProviderFilter}
            style={{ width: 220 }}
            options={PROVIDERS.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Space>
      </div>

      {/* Revenue Performance + AI Insights (side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left column: Revenue Performance (2x2) */}
        <div>
          <Typography.Title level={5} className="!mb-2">Revenue Performance</Typography.Title>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="min-h-[116px]">
              <div className="text-xs text-gray-500">Projected Revenue</div>
              <div className="text-2xl font-semibold">{currency(projectedRevenue)}</div>
              <div className="text-xs text-gray-500">Includes scheduled & expected walk-ins</div>
            </Card>
            <Card className="min-h-[116px]">
              <div className="text-xs text-gray-500">Booked Appointments</div>
              <div className="text-2xl font-semibold">{bookedCount}</div>
              <div className="text-xs text-gray-500">Capacity: {capacity}</div>
            </Card>
            <Card className="min-h-[116px]">
              <div className="text-xs text-gray-500">Utilization</div>
              <div className="flex items-center gap-3">
                <Progress type="circle" percent={utilization} size={54} />
                <div>
                  <div className="text-lg font-semibold">{utilization}%</div>
                  <div className="text-xs text-gray-500">staffed time filled</div>
                </div>
              </div>
            </Card>
            <Card className="min-h-[116px]">
              <div className="text-xs text-gray-500">Avg Ticket</div>
              <div className="text-2xl font-semibold">{currency(avgTicket)}</div>
              <div className="text-xs text-gray-500">Per scheduled appointment</div>
            </Card>
          </div>
        </div>

        {/* Right column: AI Insights (2x2) */}
        <div>
          <Typography.Title level={5} className="!mb-2">AI Insights</Typography.Title>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => {
              const color =
                rec.severity === "important"
                  ? "#ff4d4f"
                  : rec.severity === "suggested"
                  ? "#faad14"
                  : "#1677ff"; // error, warning, info
              const titled = (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 9999,
                      backgroundColor: color,
                    }}
                  />
                  {rec.title}
                </span>
              );
              return (
                <Card key={idx} className="min-h-[116px]" title={titled} size="small">
                  <div className="text-xs text-gray-600 mb-2">{rec.rationale}</div>
                  {rec.actionLabel && (
                    <Button size="small" type="default" onClick={rec.onAction}>
                      {rec.actionLabel}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <Typography.Title level={5} className="!mt-6 !mb-2">Appointments</Typography.Title>
      <Card>
        <Table<Appt>
          rowKey="id"
          columns={columns}
          dataSource={appts}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      {/* Insights (Progress summaries) */}
      <Typography.Title level={5} className="!mt-6 !mb-2">Insights</Typography.Title>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Top 10 Services */}
        <Card title="Top Services (today)">
          <Space direction="vertical" className="w-full">
            {topServices.length === 0 ? (
              <div className="text-gray-500 text-sm">No services booked.</div>
            ) : (
              topServices.map((s) => (
                <div key={s.service}>
                  <div className="flex justify-between text-xs mb-1"><span>{s.service}</span><span className="text-gray-500">{s.count}</span></div>
                  <Progress
                    percent={Math.min(100, Math.round((s.count / (topServices[0]?.count || 1)) * 100))}
                    showInfo={false}
                    status="active"
                    strokeColor="#722ed1"
                  />
                </div>
              ))
            )}
          </Space>
        </Card>

        {/* Provider Utilization */}
        <Card title="Provider Utilization">
          <Space direction="vertical" className="w-full">
            {providerUtilization.length === 0 ? (
              <div className="text-gray-500 text-sm">No providers.</div>
            ) : (
              providerUtilization.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1"><span>{p.name}</span><span className="text-gray-500">{p.pct}%</span></div>
                  <Progress
                    percent={p.pct}
                    showInfo={false}
                    status="active"
                    strokeColor={p.pct < 33 ? "#fa8c16" : p.pct > 66 ? "#52c41a" : "#1677ff"}
                  />
                </div>
              ))
            )}
          </Space>
        </Card>

        {/* Traffic by Hour */}
        <Card title="Traffic by Hour (count)">
          <Space direction="vertical" className="w-full">
            {hourlyTraffic.length === 0 ? (
              <div className="text-gray-500 text-sm">No appointments today.</div>
            ) : (
              hourlyTraffic.map((h) => (
                <div key={h.hour}>
                  <div className="flex justify-between text-xs mb-1"><span>{h.hour}</span><span className="text-gray-500">{h.count}</span></div>
                  <Progress
                    percent={h.pct}
                    showInfo={false}
                    status="active"
                    strokeColor={h.pct < 33 ? "#fa8c16" : h.pct > 66 ? "#52c41a" : "#1677ff"}
                  />
                </div>
              ))
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
}