import { ChevronDown } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Tabs,
  Row,
  Radio,
  Col,
  Divider,
  Modal,
  Switch,
  TimePicker,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/* ---------- Types ---------- */

type Status = "active" | "inactive";

type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DowOverride = {
  day: DayOfWeek;
  price?: number;
};

type DateOverride = {
  id: string;
  label?: string;
  startDate: Dayjs;
  endDate: Dayjs;
  price?: number;
};

type DurationPricing = {
  id: string;
  minutes: number; // 60, 90, etc.
  basePrice: number;
  isDefault: boolean;
  dowOverrides: DowOverride[];
  dateOverrides: DateOverride[];
  
};

type SpaService = {
  id: string;
  name: string;
  status: Status;
  category: string;
  cleanupMinutes: number;
  sortOrder: number;
  productCode?: string;
  commissionPct?: number;
  gratuityPct?: number;
  minGuests: number;
  shortDescription?: string;
  longDescription?: string;
  disclaimerId?: string;
  waiverId?: string;
  cancellationPolicyId?: string;
  durations: DurationPricing[];

  // Relationships (for bottom section) – just arrays of ids for now
  roomIds: string[];
  equipmentIds: string[];
  addOnIds: string[];
  enhancementIds: string[];
};




/* ---------- Dynamic pricing heat map ---------- */

// Metrics match the reference deck exactly, placed where page 2 lists them: Bookings, Utilization,
// and Revenue Index are heat-map (historical) metrics; RevPATH is the deck's own proposed addition
// to that same heat-map section (page 8), so it lives here too. Demand score is intentionally not
// included — it isn't in the deck, and was shelved pending a separate, dedicated definition.
type DemandMetric = "bookings" | "utilization" | "revenue" | "revpath";

// One-line explanation per metric, shown under the heat map based on the current selection.
const METRIC_EXPLANATIONS: Record<DemandMetric, string> = {
  bookings:
    "Bookings = reservations in the cell ÷ how many times that weekday occurred in the lookback window. Pure demand volume — no capacity awareness, so a cell can run hot here and still be easy to service if plenty of therapists are on shift.",
  utilization:
    "Utilization = 100 × (booked slots ÷ weekday occurrences) ÷ capacity, where capacity is whichever is scarcest of therapists, rooms, or equipment. How close to full a typical slot runs.",
  revenue:
    "Revenue index = revenue ÷ reservation count for the cell — the average amount a guest spends per reservation in that hour. Blind to volume: one $500 booking outranks ten $200 bookings. Proposed rename: Average Spend.",
  revpath:
    "RevPATH = revenue ÷ available treatment hours for the cell. Same revenue numerator as Revenue index, but divided by capacity instead of reservation count, so both rate and volume move it. Proposed — not yet wired to a real capacity source.",
};

const hourLabels = Array.from({ length: 13 }).map((_, i) => {
  const h = 8 + i; // 8am–8pm
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return { h, label: `${hour12}${ampm}` };
});

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Raw (unformatted) numeric value for a cell under a given metric — used for both display and color banding.
const getMetricRawValue = (cell: any, metric: DemandMetric): number =>
  metric === "bookings"
    ? cell.bookings
    : metric === "utilization"
    ? cell.utilization
    : metric === "revenue"
    ? cell.revenueIdx
    : cell.revpath;

const HistoricalDemandPanel: React.FC<{
  servicesInCategory: { id: string; name: string }[];
  disabled?: boolean;
  onCreateRuleFromSlot?: (payload: {
    day: DayOfWeek;
    startHour: number;
    endHour: number;
    avgUtilization: number;
  }) => void;
}> = ({ servicesInCategory, disabled, onCreateRuleFromSlot }) => {
  const [serviceId, setServiceId] = useState<string>("all");
  const [lookbackDays, setLookbackDays] = useState<number>(90);
  const [metric, setMetric] = useState<DemandMetric>("bookings");
  const [selection, setSelection] = useState<{ day: DayOfWeek; startIdx: number; endIdx: number } | null>(null);
const [isSelecting, setIsSelecting] = useState(false);

React.useEffect(() => {
  const onUp = () => setIsSelecting(false);
  window.addEventListener("mouseup", onUp);
  return () => window.removeEventListener("mouseup", onUp);
}, []);

  // Color-coding helper — buckets a 0-100 relative value into Low/Moderate/High/Peak.
  const demandColor = (score: number) => {
    if (score <= 30) {
      return {
        bg: "#f3f4f6", // low
        text: "#374151",
        border: "#e5e7eb",
      };
    }

    if (score <= 60) {
      return {
        bg: "#e6f4f1", // moderate
        text: "#065f46",
        border: "#bfe3da",
      };
    }

    if (score <= 80) {
      return {
        bg: "#fff4e5", // high
        text: "#92400e",
        border: "#fde2b7",
      };
    }

    return {
      bg: "#fee2e2", // peak
      text: "#991b1b",
      border: "#fecaca",
    };
  };

  const data = useMemo(() => {
    // MOCK demand model (replace with real API later)
    // Returns a matrix: day -> hour -> { bookings, utilization, revenueIdx, revpath }
    const days: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    const serviceBias =
      serviceId === "all"
        ? 0
        : (serviceId.charCodeAt(serviceId.length - 1) % 7) / 20; // 0–0.3

    const lookbackFactor = lookbackDays === 30 ? 0.9 : lookbackDays === 60 ? 1.0 : 1.05;

    const rows = days.map((d, di) => {
      const cells = hourLabels.map(({ h }, hi) => {
        // build a believable pattern:
        // weekends higher, midday higher, evenings moderate, early morning low
        const weekendBoost = d === "sat" || d === "sun" ? 0.18 : 0;
        const dayBoost = d === "fri" ? 0.10 : d === "thu" ? 0.06 : 0;

        const midday = Math.exp(-Math.pow((hi - 5) / 2.2, 2)); // peak around ~1pm
        const evening = Math.exp(-Math.pow((hi - 9) / 2.8, 2)); // peak around ~5pm
        const base = 0.18 + 0.28 * midday + 0.18 * evening;

        const noise = ((di * 17 + hi * 11) % 13) / 200; // tiny stable noise
        // Shared 0-1 pattern used only to derive believable mock values below — not itself a metric.
        const pattern01 = clamp01((base + weekendBoost + dayBoost + serviceBias + noise) * lookbackFactor);

        // derived mock stats
        const bookings = Math.max(0, Math.round(pattern01 * 12));        // 0–12
        const utilization = Math.round(pattern01 * 100);                 // 0–100
        const revenueIdx = Math.round((0.6 + pattern01) * 100);          // ~60–160
        const revpath = Math.round(30 + pattern01 * 90);                 // ~$30–120/treatment-hour, mock

        return { bookings, utilization, revenueIdx, revpath, hour: h };
      });

      return { day: d, dayLabel: DOW_LABELS[d], cells };
    });

    return rows;
  }, [serviceId, lookbackDays]);

  const metricLabel =
    metric === "bookings"
      ? "Avg bookings"
      : metric === "utilization"
      ? "Avg utilization"
      : metric === "revenue"
      ? "Revenue index"
      : "RevPATH";

  // Short form for use mid-sentence (Insights headers, color caption) — avoids "Avg X's" grammar.
  const metricShortLabel =
    metric === "bookings"
      ? "bookings"
      : metric === "utilization"
      ? "utilization"
      : metric === "revenue"
      ? "revenue index"
      : "RevPATH";

  const getMetricValue = (cell: any) =>
    metric === "utilization"
      ? `${getMetricRawValue(cell, metric)}%`
      : metric === "revpath"
      ? `$${getMetricRawValue(cell, metric)}`
      : getMetricRawValue(cell, metric);

  // Colors are relative to the selected metric's own range across the visible grid, not a fixed
  // score — each metric has its own scale (bookings ~0-12, utilization 0-100, etc.), so banding is
  // normalized to that metric's min/max here rather than compared against a hidden absolute number.
  const colorScale = useMemo(() => {
    const values = data.flatMap((r) => r.cells.map((c: any) => getMetricRawValue(c, metric)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (raw: number) => (max === min ? 50 : Math.round(((raw - min) / (max - min)) * 100));
  }, [data, metric]);

  // Find top/low windows for summary (simple), based on the selected metric
  const highlights = useMemo(() => {
    const flat: { day: string; hour: number; value: number }[] = [];
    data.forEach((r) =>
      r.cells.forEach((c: any) => flat.push({ day: r.day, hour: c.hour, value: getMetricRawValue(c, metric) }))
    );
    flat.sort((a, b) => b.value - a.value);
    const top = flat.slice(0, 3);
    const low = [...flat].reverse().slice(0, 3);

    const fmt = (x: any) => {
      const hour12 = ((x.hour + 11) % 12) + 1;
      const ampm = x.hour >= 12 ? "PM" : "AM";
      return `${DOW_LABELS[x.day as DayOfWeek]} ${hour12}${ampm}`;
    };

    return { top: top.map(fmt), low: low.map(fmt) };
  }, [data, metric]);

  return (
    <Card size="small" style={{ borderRadius: 10 }} title="Historical demand (mock)">
      <Row gutter={12} align="middle">
        <Col xs={24} md={8}>
          <Form layout="vertical">
            <Form.Item label="Service (optional)">
              <Select
                value={serviceId}
                onChange={setServiceId}
                disabled={disabled}
                options={[
                  { label: "All services in category", value: "all" },
                  ...servicesInCategory.map((s) => ({ label: s.name, value: s.id })),
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Form>
        </Col>

        <Col xs={12} md={8}>
          <Form layout="vertical">
            <Form.Item label="Lookback window">
              <Select
                value={lookbackDays}
                onChange={setLookbackDays}
                disabled={disabled}
                options={[
                  { label: "Last 30 days", value: 30 },
                  { label: "Last 60 days", value: 60 },
                  { label: "Last 90 days", value: 90 },
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Form>
        </Col>

        <Col xs={12} md={8}>
          <Form layout="vertical">
            <Form.Item label="Metric">
              <Select
                value={metric}
                onChange={setMetric}
                disabled={disabled}
                options={[
                  { label: "Bookings", value: "bookings" },
                  { label: "Utilization", value: "utilization" },
                  { label: "Revenue index", value: "revenue" },
                  { label: "RevPATH (proposed)", value: "revpath" },
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Form>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={18}>
          <Space size="small" wrap style={{ marginBottom: 8 }}>
            <Tag color="default">Low</Tag>
            <Tag color="cyan">Moderate</Tag>
            <Tag color="orange">High</Tag>
            <Tag color="red">Peak</Tag>
          </Space>

          {selection && (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
    <Button
      type="primary"
      size="small"
      disabled={disabled || !onCreateRuleFromSlot}
      onClick={() => {
        if (disabled || !onCreateRuleFromSlot) return;

        const a = Math.min(selection.startIdx, selection.endIdx);
        const b = Math.max(selection.startIdx, selection.endIdx);

        const startHour = hourLabels[a].h;
        const endHour = hourLabels[b].h + 1;

        const row = data.find((r) => r.day === selection.day);
        const utilizations = row ? row.cells.slice(a, b + 1).map((c: any) => Number(c.utilization || 0)) : [];
        const avgUtilization = utilizations.length
          ? Math.round(utilizations.reduce((s, n) => s + n, 0) / utilizations.length)
          : 0;

        onCreateRuleFromSlot({
          day: selection.day,
          startHour,
          endHour,
          avgUtilization,
        });
      }}
    >
      Create pricing rule
    </Button>

    <Tag>
      {DOW_LABELS[selection.day]} · {hourLabels[Math.min(selection.startIdx, selection.endIdx)].label}–
      {hourLabels[Math.max(selection.startIdx, selection.endIdx)].label}
    </Tag>

    <Text type="secondary" style={{ fontSize: 12 }}>
      Tip: click and drag across time slots.
    </Text>
  </div>
)}

          <div style={{ overflowX: "auto", paddingBottom: 6 }}>
            <div style={{ minWidth: 780 }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "90px repeat(13, 1fr)", gap: 6, marginBottom: 6 }}>
                <div />
                {hourLabels.map((h) => (
                  <div key={h.h} style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>
                    {h.label}
                  </div>
                ))}
              </div>

              {/* Heatmap rows */}
              {data.map((row) => (
                <div
                  key={row.day}
                  style={{ display: "grid", gridTemplateColumns: "90px repeat(13, 1fr)", gap: 6, marginBottom: 6 }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{row.dayLabel}</div>

                  {row.cells.map((cell: any, hi: number) => {
                    const { bg, text, border } = demandColor(colorScale(getMetricRawValue(cell, metric)));
                    const isSelected =
                      selection &&
                      selection.day === row.day &&
                      hi >= Math.min(selection.startIdx, selection.endIdx) &&
                      hi <= Math.max(selection.startIdx, selection.endIdx);
                    return (
                      <Tooltip
                        key={`${row.day}-${cell.hour}`}
                        title={
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                              {row.dayLabel} · {((cell.hour + 11) % 12) + 1}
                              {cell.hour >= 12 ? "PM" : "AM"}
                            </div>
                            <div>{metricLabel}: {getMetricValue(cell)}</div>
                          </div>
                        }
                      >
                        <div
                          style={{
                            height: 32,
                            borderRadius: 8,
                            background: bg,
                            color: text,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: disabled || !onCreateRuleFromSlot ? "default" : "pointer",
                            border: isSelected ? "2px solid #111827" : `1px solid ${border}`,
                            position: "relative",
                          }}
                          onMouseDown={(e) => {
  if (disabled || !onCreateRuleFromSlot) return;
  e.preventDefault();
  setIsSelecting(true);
  setSelection({ day: row.day, startIdx: hi, endIdx: hi });
}}
onMouseEnter={() => {
  if (!isSelecting || disabled || !onCreateRuleFromSlot) return;
  setSelection((prev) => {
    if (!prev) return prev;
    if (prev.day !== row.day) return prev;
    return { ...prev, endIdx: hi };
  });
}}
onDoubleClick={() => {
  // Double-click creates a rule instantly for one cell
  if (disabled || !onCreateRuleFromSlot) return;
  onCreateRuleFromSlot({
    day: row.day,
    startHour: cell.hour,
    endHour: cell.hour + 1,
    avgUtilization: cell.utilization,
  });
}}
                        >
                          {getMetricValue(cell)}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {METRIC_EXPLANATIONS[metric]}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
            Colors are scaled to this metric's own range across the view — the Low–Peak bands
            re-scale whenever you switch metrics.
          </Text>
        </Col>

        <Col xs={24} md={6}>
          <Card size="small" style={{ borderRadius: 10 }} title="Insights">
            <Text strong>Top {metricShortLabel} windows</Text>
            <div style={{ marginTop: 6, marginBottom: 12 }}>
              {highlights.top.map((t) => (
                <Tag key={t} style={{ marginBottom: 6 }}>{t}</Tag>
              ))}
            </div>

            <Text strong>Lowest {metricShortLabel} windows</Text>
            <div style={{ marginTop: 6 }}>
              {highlights.low.map((t) => (
                <Tag key={t} style={{ marginBottom: 6 }}>{t}</Tag>
              ))}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <Text type="secondary" style={{ fontSize: 12 }}>
              Next step: allow “Create rule from window” to prefill time range + suggested uplift/discount.
            </Text>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};


/* ---------- Dynamic pricing types (mock) ---------- */

type AdjustmentType = "pct" | "amt";

type DynamicPricingRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number; // higher wins
  daysOfWeek: DayOfWeek[]; // empty means "all"
  startTime: Dayjs; // time-of-day only
  endTime: Dayjs;
  adjustmentType: AdjustmentType; // pct or amt
  adjustmentValue: number; // 10 = +10% or +$10 depending on type

  // Inventory-based condition (optional). Matches the deck's rule-trigger metrics exactly:
  // RemainingSlots and LiveUtilization. Demand score is intentionally not offered here — it's a
  // historical/planning concept (see the heat map above), not a live per-slot trigger.
  inventoryConditionEnabled?: boolean;
  inventoryMetric?: "remaining" | "utilization";
  inventoryOperator?: "lt" | "lte" | "gt" | "gte";
  inventoryThreshold?: number; // remaining slots or utilization %, depending on metric

  // Lead time gate (optional) — how far ahead the booking is made, evaluated per slot
  leadTimeMode?: "none" | "window";
  leadTimeOperator?: "lt" | "lte" | "gt" | "gte";
  leadTimeDays?: number;
  leadTimeHours?: number;

  // Adjacent slot pricing (optional)
  adjacentPricingEnabled?: boolean;
  adjacentSlotCount?: number; // number of slots before/after triggered slot to adjust
  adjacentAdjustmentMode?: "relative" | "fixed";
  adjacentAdjustmentValue?: number; // relative = % of primary adjustment, fixed = adjustment value

  dateRange?: [Dayjs, Dayjs]; // optional date constraint

  // Optional service-level exclusions (advanced)
  excludedServiceIds?: string[];

  // Which service categories this rule applies to. A rule is scoped to categories, not the
  // other way around — a category's "Enable dynamic pricing" toggle still gates whether any
  // rule can take effect there.
  categoryIds: string[];
};

type CueTagColor = "blue" | "red" | "orange" | "green";

type GuestCueTag = {
  id: string;
  operator: "lt" | "lte" | "gt" | "gte";
  valueType: AdjustmentType; // pct or amt — matches rule adjustment types
  threshold: number; // price adjustment threshold, in % or $ depending on valueType. Negative = discount.
  label: string; // e.g. "Best Value", "Going Fast"
  color: CueTagColor;
};

// Standard 4-color set only (no full palette) — light/dark hexes shown in the picker so admins can
// see exactly what guests will see in each theme. Values approximate this app's antd theme tokens;
// confirm exact hex against the design system before shipping.
const CUE_TAG_COLORS: { key: CueTagColor; label: string; light: string; dark: string }[] = [
  { key: "blue", label: "Blue", light: "#1677ff", dark: "#3c89e8" },
  { key: "green", label: "Green", light: "#52c41a", dark: "#49aa19" },
  { key: "orange", label: "Orange", light: "#fa8c16", dark: "#d87a16" },
  { key: "red", label: "Red", light: "#f5222d", dark: "#d32029" },
];

// A guardrail bound is relative to each service's own base price (percent or a fixed dollar amount),
// not a single absolute price — a flat "$250 max" doesn't work across services with very different
// price points, so increases/decreases are bounded as a delta off of whatever the base price is.
type GuardrailBound = {
  valueType: AdjustmentType; // pct or amt
  value?: number;
};

type CategoryDynamicPricing = {
  enabled: boolean;
  minIncrease?: GuardrailBound; // smallest allowed price increase, if a rule increases price at all
  maxIncrease?: GuardrailBound; // largest allowed price increase
  minDecrease?: GuardrailBound; // smallest allowed discount, if a rule discounts at all
  maxDecrease?: GuardrailBound; // largest allowed discount
  guestCueTags: GuestCueTag[];
};

/* ---------- Mock lookups ---------- */

const MOCK_CATEGORIES = [
  { label: "Specialty Massages", value: "specialty-massage" },
  { label: "Personalized Facials", value: "personalized-facials" },
];

const MOCK_DISCLAIMERS = [
  { label: "Hotel disclaimer", value: "hotel_disclaimer" },
  { label: "Standard spa disclaimer", value: "standard_spa" },
];

const MOCK_WAIVERS = [
  { label: "Activities waiver", value: "activities_waiver" },
  { label: "High-risk waiver", value: "high_risk" },
];

const MOCK_POLICIES = [
  { label: "Always", value: "always" },
  { label: "24 hours", value: "24h" },
  { label: "48 hours", value: "48h" },
];

const MOCK_ROOMS = [
  { id: "r1", name: "Massage Room 1" },
  { id: "r2", name: "Massage Room 2" },
  { id: "r3", name: "Massage Room 3" },
  { id: "r4", name: "VIP/Couples Room" },
  { id: "r5", name: "Facial 1" },
];

const MOCK_EQUIPMENT = [
  { id: "e1", name: "Massage Table" },
  { id: "e2", name: "Facial Steamer" },
];

const MOCK_ADDONS = [
  { id: "a1", name: "Eye Focus", addsMinutes: 15 },
  { id: "a2", name: "Paraffin Wrap – Hand", addsMinutes: 15 },
  { id: "a3", name: "Microdermabrasion Add-on", addsMinutes: 30 },
];

const MOCK_ENHANCEMENTS = [
  { id: "h1", name: "Facial Enhancement" },
  { id: "h2", name: "Massage Enhancement" },
  { id: "h3", name: "Aromatherapy Boost" },
];

const DOW_LABELS: Record<DayOfWeek, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const allDays: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];


const formatInventoryCondition = (r: DynamicPricingRule): string | null => {
  if (!r.inventoryConditionEnabled) return null;

  const opMap: Record<NonNullable<DynamicPricingRule["inventoryOperator"]>, string> = {
    lt: "<",
    lte: "≤",
    gt: ">",
    gte: "≥",
  };

  const metric = r.inventoryMetric || "remaining";
  const op =
    opMap[
      (r.inventoryOperator || "lt") as NonNullable<
        DynamicPricingRule["inventoryOperator"]
      >
    ];
  const threshold = r.inventoryThreshold ?? 0;

if (metric === "remaining") return `Remaining slots ${op} ${threshold}`;
return `Utilization ${op} ${threshold}%`;
};

const formatLeadTime = (r: DynamicPricingRule): string | null => {
  if (r.leadTimeMode !== "window") return null;
  const opLabel: Record<NonNullable<DynamicPricingRule["leadTimeOperator"]>, string> = {
    lt: "less than",
    lte: "at most",
    gt: "more than",
    gte: "at least",
  };
  const op = opLabel[r.leadTimeOperator || "lt"];
  const d = r.leadTimeDays ?? 0;
  const h = r.leadTimeHours ?? 0;
  const dur = [d > 0 ? `${d}d` : "", h > 0 || d === 0 ? `${h}h` : ""].filter(Boolean).join(" ");
  return `Booked ${op} ${dur} before the slot`;
};

const formatGuardrailBound = (b: GuardrailBound | undefined, sign: "+" | "-"): string => {
  if (!b || b.value === undefined || b.value === null) return "Not set";
  return b.valueType === "amt" ? `${sign}$${b.value}` : `${sign}${b.value}%`;
};

/* ---------- Helpers ---------- */

const createEmptyDuration = (minutes = 60, isDefault = false): DurationPricing => ({
  id: Math.random().toString(36).slice(2),
  minutes,
  basePrice: 0,
  isDefault,
  dowOverrides: [],
  dateOverrides: [],
});

const createEmptyService = (): SpaService => ({
  id: Math.random().toString(36).slice(2),
  name: "",
  status: "active",
  category: "specialty-massage",
  cleanupMinutes: 15,
  sortOrder: 1,
  productCode: "",
  commissionPct: 0,
  gratuityPct: 0,
  minGuests: 1,
  shortDescription: "",
  longDescription: "",
  disclaimerId: undefined,
  waiverId: undefined,
  cancellationPolicyId: "always",
  durations: [createEmptyDuration(60, true)],
  roomIds: [],
  equipmentIds: [],
  addOnIds: [],
  enhancementIds: [],
});

const createEmptyDynamicRule = (): DynamicPricingRule => {
  const start = dayjs().hour(9).minute(0).second(0);
  const end = dayjs().hour(17).minute(0).second(0);
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    enabled: true,
    priority: 100,
    daysOfWeek: [],
    startTime: start,
    endTime: end,
    adjustmentType: "pct",
    adjustmentValue: 10,
    inventoryConditionEnabled: false,
    inventoryMetric: "utilization",
    inventoryOperator: "gt",
    inventoryThreshold: 80,
    leadTimeMode: "none",
    leadTimeOperator: "lt",
    leadTimeDays: 1,
    leadTimeHours: 0,
    adjacentPricingEnabled: false,
    adjacentSlotCount: 1,
    adjacentAdjustmentMode: "relative",
    adjacentAdjustmentValue: 60,
    categoryIds: [],
  };
};

/* ---------- Duration card component ---------- */

type DurationCardProps = {
  value: DurationPricing;
  onChange: (next: DurationPricing) => void;
  onRemove?: () => void;
  canRemove: boolean;
};

const DurationCard: React.FC<DurationCardProps> = ({
  value,
  onChange,
  onRemove,
  canRemove,
}) => {
  const handleDowPriceChange = (day: DayOfWeek, price?: number) => {
    const existing = value.dowOverrides.find((d) => d.day === day);
    let next: DowOverride[];
    if (price === undefined || Number.isNaN(price)) {
      next = value.dowOverrides.filter((d) => d.day !== day);
    } else if (existing) {
      next = value.dowOverrides.map((d) =>
        d.day === day ? { ...d, price } : d
      );
    } else {
      next = [...value.dowOverrides, { day, price }];
    }
    onChange({ ...value, dowOverrides: next });
  };

  const handleDateOverrideChange = (id: string, patch: Partial<DateOverride>) => {
    const next = value.dateOverrides.map((o) =>
      o.id === id ? { ...o, ...patch } : o
    );
    onChange({ ...value, dateOverrides: next });
  };

  const addDateOverride = () => {
    const now = dayjs();
    const ov: DateOverride = {
      id: Math.random().toString(36).slice(2),
      label: "",
      startDate: now,
      endDate: now,
      price: value.basePrice,
    };
    onChange({ ...value, dateOverrides: [...value.dateOverrides, ov] });
  };

  const removeDateOverride = (id: string) => {
    onChange({
      ...value,
      dateOverrides: value.dateOverrides.filter((o) => o.id !== id),
    });
  };

  return (
    <Card
      size="small"
      style={{ borderRadius: 10, marginBottom: 16 }}
      title={
        <Space>
          <span>Duration</span>
          <Select
            style={{ width: 120 }}
            value={value.minutes}
            onChange={(val) => onChange({ ...value, minutes: val })}
            options={[
              { label: "30 min", value: 30 },
              { label: "45 min", value: 45 },
              { label: "60 min", value: 60 },
              { label: "75 min", value: 75 },
              { label: "90 min", value: 90 },
              { label: "120 min", value: 120 },
            ]}
            suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
          />
        </Space>
      }
 extra={
  canRemove ? (
    <Button
      type="text"
      icon={<DeleteOutlined />}
      danger
      onClick={onRemove}
    />
  ) : null
}
    >
      {/* Base price */}
      <Space direction="vertical" style={{ width: "100%", marginBottom: 12 }}>
        <Text strong>Base price</Text>
        <InputNumber
          prefix="$"
          value={value.basePrice}
          min={0}
          style={{ width: 160 }}
          onChange={(val) =>
            onChange({ ...value, basePrice: Number(val || 0) })
          }
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Used when no day-of-week or special date price is defined.
        </Text>
      </Space>

      <Divider style={{ margin: "12px 0" }} />

      {/* Day-of-week pricing */}
      <Space direction="vertical" style={{ width: "100%", marginBottom: 12 }}>
        <Text strong>Day-of-week pricing (optional)</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Leave blank to use the base price for that day.
        </Text>
        <div className="grid grid-cols-2 gap-4">
          {allDays.map((day) => {
            const override = value.dowOverrides.find((d) => d.day === day);
            return (
              <Space key={day}>
                <span style={{ width: 40 }}>{DOW_LABELS[day]}</span>
                <InputNumber
                  prefix="$"
                  min={0}
                  placeholder="Base"
                  value={override?.price}
                  onChange={(val) =>
                    handleDowPriceChange(day, val === null ? undefined : Number(val))
                  }
                />
              </Space>
            );
          })}
        </div>
      </Space>

      <Divider style={{ margin: "12px 0" }} />

      {/* Special date overrides */}
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space
          align="center"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Text strong>Special date pricing</Text>
          <Button type="link" onClick={addDateOverride}>
            + Add date rule
          </Button>
        </Space>

        {value.dateOverrides.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Use for holidays, events, or single dates. These override
            day-of-week pricing.
          </Text>
        )}

        {value.dateOverrides.map((rule) => (
          <Space
            key={rule.id}
            style={{ width: "100%" }}
            align="start"
            wrap
          >
            <Input
              style={{ flex: 1, minWidth: 140 }}
              placeholder="Label (optional)"
              value={rule.label}
              onChange={(e) =>
                handleDateOverrideChange(rule.id, { label: e.target.value })
              }
            />
            <RangePicker
              value={[rule.startDate, rule.endDate]}
              onChange={(vals) => {
                if (!vals || !vals[0] || !vals[1]) return;
                handleDateOverrideChange(rule.id, {
                  startDate: vals[0],
                  endDate: vals[1],
                });
              }}
            />
            <InputNumber
              prefix="$"
              min={0}
              value={rule.price}
              onChange={(val) =>
                handleDateOverrideChange(rule.id, {
                  price: val === null ? undefined : Number(val),
                })
              }
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeDateOverride(rule.id)}
            />
          </Space>
        ))}
      </Space>
    </Card>
  );
};

/* ---------- Service form ---------- */

type ServiceFormProps = {
  initial: SpaService;
  onSave: (svc: SpaService) => void;
  onCancel: () => void;
};

const ServiceForm: React.FC<ServiceFormProps> = ({
  initial,
  onSave,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [service, setService] = useState<SpaService>(initial);

const handleDurationsChange = (next: DurationPricing[]) => {
  setService((prev) => ({ ...prev, durations: next }));
};
  const addDuration = () => {
    handleDurationsChange([
      ...service.durations,
      createEmptyDuration(90, service.durations.length === 0),
    ]);
  };

  const updateDuration = (id: string, next: DurationPricing) => {
    handleDurationsChange(
      service.durations.map((d) => (d.id === id ? next : d))
    );
  };

  const removeDuration = (id: string) => {
    handleDurationsChange(service.durations.filter((d) => d.id !== id));
  };

  const handleFinish = (values: any) => {
    const merged: SpaService = {
      ...service,
      ...values,
    };
    onSave(merged);
  };

  // Removed unused isEdit

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          style={{ paddingLeft: 4 }}
          onClick={onCancel}
        >
          Back to Services
        </Button>

        <Space
          align="center"
          style={{
            marginTop: 8,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Text strong style={{ fontSize: 20, marginLeft: 10 }}>
            {service.name || "New Service"}
          </Text>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="default" onClick={() => form.submit()}>
              Save as Draft
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Space>
        </Space>
      </div>

      <Row gutter={16} align="top">
        {/* LEFT COLUMN */}
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 12 }} title="Service Details">
            <Form
              form={form}
              layout="vertical"
              initialValues={service}
              onFinish={handleFinish}
              onValuesChange={(_, all) => {
                setService((prev) => ({ ...prev, ...all }));
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Service name"
                    name="name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g., IMPÉRIALE Relaxing Massage" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Service category" name="category">
                    <Select options={MOCK_CATEGORIES} 
                        suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
/>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Status" name="status">
                    <Radio.Group>
                      <Radio.Button value="active">Active</Radio.Button>
                      <Radio.Button value="inactive">Inactive</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Sort order" name="sortOrder">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Product code" name="productCode">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Cleanup time (min)" name="cleanupMinutes">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Commission (%)" name="commissionPct">
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Gratuity (%)" name="gratuityPct">
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Min guests" name="minGuests">
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Short description" name="shortDescription">
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item label="Long description" name="longDescription">
                <Input.TextArea rows={4} />
              </Form.Item>

              {/* You can plug in AntD Upload here for image uploader */}
              <Form.Item label="Image">
                <Button>Upload image (stub)</Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Service Dependencies & attachments tucked under Service Details */}
          <Card
            style={{ borderRadius: 12, marginTop: 16 }}
            title="Service Dependencies & Attachments"
          >
            <Space
              direction="vertical"
              style={{ width: "100%" }}
              size="middle"
            >
              <Card
                size="small"
                style={{ borderRadius: 10 }}
                title={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text strong>Applicable Rooms</Text>
                    <Checkbox
                      indeterminate={
                        service.roomIds.length > 0 &&
                        service.roomIds.length < MOCK_ROOMS.length
                      }
                      checked={service.roomIds.length === MOCK_ROOMS.length}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          roomIds: checked ? MOCK_ROOMS.map((r) => r.id) : [],
                        }));
                      }}
                    >
                      Select all
                    </Checkbox>
                  </Space>
                }
              >
                <div className="grid grid-cols-3 gap-2">
                  {MOCK_ROOMS.map((room) => (
                    <Checkbox
                      key={room.id}
                      checked={service.roomIds.includes(room.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          roomIds: checked
                            ? [...prev.roomIds, room.id]
                            : prev.roomIds.filter((id) => id !== room.id),
                        }));
                      }}
                    >
                      {room.name}
                    </Checkbox>
                  ))}
                </div>
              </Card>

              <Card
                size="small"
                style={{ borderRadius: 10 }}
                title={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text strong>Required Equipment</Text>
                    <Checkbox
                      indeterminate={
                        service.equipmentIds.length > 0 &&
                        service.equipmentIds.length < MOCK_EQUIPMENT.length
                      }
                      checked={
                        service.equipmentIds.length === MOCK_EQUIPMENT.length
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          equipmentIds: checked
                            ? MOCK_EQUIPMENT.map((eq) => eq.id)
                            : [],
                        }));
                      }}
                    >
                      Select all
                    </Checkbox>
                  </Space>
                }
              >
                <div className="grid grid-cols-3 gap-2">
                  {MOCK_EQUIPMENT.map((eq) => (
                    <Checkbox
                      key={eq.id}
                      checked={service.equipmentIds.includes(eq.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          equipmentIds: checked
                            ? [...prev.equipmentIds, eq.id]
                            : prev.equipmentIds.filter((id) => id !== eq.id),
                        }));
                      }}
                    >
                      {eq.name}
                    </Checkbox>
                  ))}
                </div>
              </Card>

              <Card
                size="small"
                style={{ borderRadius: 10 }}
                title={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text strong>Service Add-Ons</Text>
                    <Checkbox
                      indeterminate={
                        service.addOnIds.length > 0 &&
                        service.addOnIds.length < MOCK_ADDONS.length
                      }
                      checked={service.addOnIds.length === MOCK_ADDONS.length}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          addOnIds: checked ? MOCK_ADDONS.map((a) => a.id) : [],
                        }));
                      }}
                    >
                      Select all
                    </Checkbox>
                  </Space>
                }
              >
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
                  {MOCK_ADDONS.map((add) => (
                    <Checkbox
                      key={add.id}
                      checked={service.addOnIds.includes(add.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          addOnIds: checked
                            ? [...prev.addOnIds, add.id]
                            : prev.addOnIds.filter((id) => id !== add.id),
                        }));
                      }}
                    >
                      {add.name}
                    </Checkbox>
                  ))}
                </div>
              </Card>

              <Card
                size="small"
                style={{ borderRadius: 10 }}
                title={
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text strong>Service Enhancements</Text>
                    <Checkbox
                      indeterminate={
                        service.enhancementIds.length > 0 &&
                        service.enhancementIds.length < MOCK_ENHANCEMENTS.length
                      }
                      checked={
                        service.enhancementIds.length === MOCK_ENHANCEMENTS.length
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          enhancementIds: checked
                            ? MOCK_ENHANCEMENTS.map((h) => h.id)
                            : [],
                        }));
                      }}
                    >
                      Select all
                    </Checkbox>
                  </Space>
                }
              >
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto">
                  {MOCK_ENHANCEMENTS.map((enh) => (
                    <Checkbox
                      key={enh.id}
                      checked={service.enhancementIds.includes(enh.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setService((prev) => ({
                          ...prev,
                          enhancementIds: checked
                            ? [...prev.enhancementIds, enh.id]
                            : prev.enhancementIds.filter((id) => id !== enh.id),
                        }));
                      }}
                    >
                      {enh.name}
                    </Checkbox>
                  ))}
                </div>
              </Card>
            </Space>
          </Card>
        </Col>

        {/* RIGHT COLUMN */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Card style={{ borderRadius: 12 }} title="Policies & Attachments">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={service}
              >
                <Form.Item label="Disclaimer" name="disclaimerId">
                  <Select
                    allowClear
                    placeholder="Select disclaimer"
                    options={MOCK_DISCLAIMERS}
                        suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}

                  />
                </Form.Item>

                <Form.Item label="Waiver" name="waiverId">
                  <Select
                    allowClear
                    placeholder="Select waiver"
                    options={MOCK_WAIVERS}
                        suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}

                  />
                </Form.Item>

                <Form.Item label="Cancellation policy" name="cancellationPolicyId">
                  <Select options={MOCK_POLICIES}
                      suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
 />
                </Form.Item>
              </Form>
            </Card>

            <Card
              style={{ borderRadius: 12 }}
              title="Durations & Pricing"
              extra={
                <Button type="link" icon={<PlusOutlined />} onClick={addDuration}>
                  Add duration
                </Button>
              }
            >
              {service.durations.map((d) => (
  <DurationCard
    key={d.id}
    value={d}
    onChange={(next) => updateDuration(d.id, next)}
    onRemove={
      service.durations.length > 1
        ? () => removeDuration(d.id)
        : undefined
    }
    canRemove={service.durations.length > 1}
  />
))}
            </Card>
          </Space>
        </Col>
      </Row>

    </div>
  );
};


/* ---------- Dynamic pricing page (mock UI) ---------- */

type DynamicPricingPageProps = {
  categories: { label: string; value: string }[];
};

const DynamicPricingPage: React.FC<DynamicPricingPageProps> = ({ categories }) => {
  // Multi-select: this is a VIEW filter (which categories' guardrails/cue tags you're bulk-editing,
  // and which rules are shown below) — it is not what decides which categories a rule applies to.
  // Each rule owns its own "Applies to categories" field (see categoryIds on DynamicPricingRule).
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categories?.[0] ? [categories[0].value] : []
  );
  const primaryCategory = selectedCategories[0] || "";

  // In a real app this would be loaded/saved per property/venue.
  const [byCategory, setByCategory] = useState<Record<string, CategoryDynamicPricing>>(() => {
    const initial: Record<string, CategoryDynamicPricing> = {};
    categories.forEach((c) => {
      initial[c.value] = {
        enabled: false,
        guestCueTags: [
          { id: "cue1", operator: "lte", valueType: "pct", threshold: -10, label: "Best Value", color: "green" },
          { id: "cue2", operator: "gte", valueType: "pct", threshold: 15, label: "Going Fast", color: "orange" },
        ],
      };
    });
    return initial;
  });

  const emptyCfg: CategoryDynamicPricing = { enabled: false, guestCueTags: [] };
  const cfg = byCategory[primaryCategory] || emptyCfg;

  // Rules are global (not nested per category) — each one carries its own categoryIds scope.
  const [rules, setRules] = useState<DynamicPricingRule[]>([]);
  const visibleRules = rules.filter((r) => r.categoryIds.some((c) => selectedCategories.includes(c)));

  // Services in the selected category (for exclusions dropdown)
  // NOTE: mocked for demo; in production this should come from real services by category
  const servicesInCategory = useMemo(() => {
    return [
      { id: "svc1", name: "IMPÉRIALE Relaxing Massage" },
      { id: "svc2", name: "Deep Tissue Massage" },
      { id: "svc3", name: "Couples Massage" },
    ];
  }, [primaryCategory]);

  // Helper to map excluded ids to service names
  const getExcludedServiceNames = (rule: DynamicPricingRule): string[] => {
    const ids = rule.excludedServiceIds || [];
    if (ids.length === 0) return [];
    const byId = new Map(servicesInCategory.map((s) => [s.id, s.name] as const));
    return ids.map((id) => byId.get(id) || id);
  };

  /* ---------- Mock availability (demo) ---------- */
  // Trigger metrics match the deck exactly: LiveUtilization and RemainingSlots. Demand score was
  // considered as a third trigger (a proprietary blended signal) but shelved for now — it isn't in
  // the reference deck, and its live-utilization + booking-pace components don't map cleanly onto
  // a rule trigger without a separate, validated definition. Revisit separately if needed.
  const [mockAvailability, setMockAvailability] = useState({
  remaining: 2, // remaining providers for the booked time slot
  utilization: 85, // utilization % for the booked time slot
});

  /* ---------- Guardrails: edit / apply lock-in ---------- */
  // Guardrails aren't live-bound to state on every keystroke — they only take effect once "Apply" is
  // pressed, so a partial edit can't accidentally clamp prices mid-typing.
  type GuardrailsDraft = {
    minIncrease: GuardrailBound;
    maxIncrease: GuardrailBound;
    minDecrease: GuardrailBound;
    maxDecrease: GuardrailBound;
  };
  const [guardrailsDraft, setGuardrailsDraft] = useState<GuardrailsDraft | null>(null);
  const isEditingGuardrails = guardrailsDraft !== null;

  const startEditGuardrails = () =>
    setGuardrailsDraft({
      minIncrease: cfg.minIncrease || { valueType: "pct" },
      maxIncrease: cfg.maxIncrease || { valueType: "pct" },
      minDecrease: cfg.minDecrease || { valueType: "pct" },
      maxDecrease: cfg.maxDecrease || { valueType: "pct" },
    });
  const cancelEditGuardrails = () => setGuardrailsDraft(null);
  const applyGuardrails = () => {
    if (!guardrailsDraft) return;
    updateCategory({
      minIncrease: guardrailsDraft.minIncrease,
      maxIncrease: guardrailsDraft.maxIncrease,
      minDecrease: guardrailsDraft.minDecrease,
      maxDecrease: guardrailsDraft.maxDecrease,
    });
    setGuardrailsDraft(null);
  };

  const evalInventoryCondition = (r: DynamicPricingRule): boolean => {
    if (!r.inventoryConditionEnabled) return true;

    const metric = r.inventoryMetric || "remaining";
    const op = r.inventoryOperator || "lt";
    // If older rules (created before inventory conditions existed) are missing a threshold,
    // fall back to sensible defaults instead of treating it as 0 (which often blocks everything).
    const defaultThreshold = metric === "utilization" ? 80 : 3;

    const threshold =
      r.inventoryThreshold === null || r.inventoryThreshold === undefined
        ? defaultThreshold
        : r.inventoryThreshold;

    const left = metric === "remaining" ? mockAvailability.remaining : mockAvailability.utilization;

    if (op === "lt") return left < threshold;
    if (op === "lte") return left <= threshold;
    if (op === "gt") return left > threshold;
    return left >= threshold; // gte
  };

  // Writes the same patch to every selected category — editing multiple categories at once
  // keeps them in sync rather than requiring the same rules/guardrails to be built N times.
  const updateCategory = (patch: Partial<CategoryDynamicPricing>) => {
    setByCategory((prev) => {
      const next = { ...prev };
      selectedCategories.forEach((catValue) => {
        next[catValue] = { ...(next[catValue] || emptyCfg), ...patch };
      });
      return next;
    });
  };

  const upsertRule = (rule: DynamicPricingRule) => {
    setRules((prev) => (prev.some((r) => r.id === rule.id) ? prev.map((r) => (r.id === rule.id ? rule : r)) : [...prev, rule]));
  };

  const duplicateRule = (rule: DynamicPricingRule) => {
    const copy: DynamicPricingRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name || "Untitled rule"} (copy)`,
    };
    setRules((prev) => [...prev, copy]);
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  /* ---------- Guest cue tags ---------- */
  // Evaluated top to bottom against the resulting price adjustment; first matching row (of the
  // same value type — percent tags only match a percent adjustment, dollar tags only a dollar one) wins.
  const addGuestCueTag = () => {
    const next: GuestCueTag = {
      id: `cue_${Date.now()}`,
      operator: "gte",
      valueType: "pct",
      threshold: 10,
      label: "",
      color: "blue",
    };
    updateCategory({ guestCueTags: [...(cfg.guestCueTags || []), next] });
  };

  const updateGuestCueTag = (id: string, patch: Partial<GuestCueTag>) => {
    updateCategory({
      guestCueTags: (cfg.guestCueTags || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  const removeGuestCueTag = (id: string) => {
    updateCategory({ guestCueTags: (cfg.guestCueTags || []).filter((t) => t.id !== id) });
  };

  const moveGuestCueTag = (id: string, direction: -1 | 1) => {
    const tags = [...(cfg.guestCueTags || [])];
    const idx = tags.findIndex((t) => t.id === id);
    const swapWith = idx + direction;
    if (idx === -1 || swapWith < 0 || swapWith >= tags.length) return;
    [tags[idx], tags[swapWith]] = [tags[swapWith], tags[idx]];
    updateCategory({ guestCueTags: tags });
  };

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DynamicPricingRule | null>(null);
  const [ruleForm] = Form.useForm();

  const openNewRule = () => {
    const next = createEmptyDynamicRule();
    // Pre-fill with whatever categories are currently selected — still editable per rule.
    next.categoryIds = [...selectedCategories];
    setEditingRule(next);
    ruleForm.setFieldsValue({
      ...next,
      dateRange: next.dateRange,
      timeRange: [next.startTime, next.endTime],
    });
    setRuleModalOpen(true);
  };

  const openEditRule = (r: DynamicPricingRule) => {
    setEditingRule(r);
    ruleForm.setFieldsValue({
      ...r,
      dateRange: r.dateRange,
      timeRange: [r.startTime, r.endTime],
    });
    setRuleModalOpen(true);
  };

  const handleSaveRule = async () => {
    const values = await ruleForm.validateFields();
    const timeRange: [Dayjs, Dayjs] | undefined = values.timeRange;
    const next: DynamicPricingRule = {
      ...(editingRule || createEmptyDynamicRule()),
      ...values,
      enabled: values.enabled ?? true,
      daysOfWeek: values.daysOfWeek || [],
      priority: Number(values.priority || 0),
      adjustmentValue: Number(values.adjustmentValue || 0),
      inventoryThreshold:
        values.inventoryThreshold === null || values.inventoryThreshold === undefined
          ? undefined
          : Number(values.inventoryThreshold),
      leadTimeMode: values.leadTimeMode || "none",
      leadTimeOperator: values.leadTimeOperator || "lt",
      leadTimeDays: Number(values.leadTimeDays || 0),
      leadTimeHours: Number(values.leadTimeHours || 0),
      adjacentPricingEnabled: values.adjacentPricingEnabled ?? false,
      adjacentSlotCount:
        values.adjacentSlotCount === null || values.adjacentSlotCount === undefined
          ? undefined
          : Number(values.adjacentSlotCount),
      adjacentAdjustmentMode: values.adjacentAdjustmentMode || "relative",
      adjacentAdjustmentValue:
        values.adjacentAdjustmentValue === null || values.adjacentAdjustmentValue === undefined
          ? undefined
          : Number(values.adjacentAdjustmentValue),
      startTime: timeRange?.[0] || (editingRule?.startTime ?? dayjs()),
      endTime: timeRange?.[1] || (editingRule?.endTime ?? dayjs()),
      dateRange: values.dateRange,
      excludedServiceIds: values.excludedServiceIds || [],
      categoryIds: values.categoryIds || [],
    };
    upsertRule(next);
    setRuleModalOpen(false);
    setEditingRule(null);
    ruleForm.resetFields();
  };

  const columns: ColumnsType<DynamicPricingRule> = [
    {
      title: "Enabled",
      dataIndex: "enabled",
      width: 90,
      render: (_, r) => (
        <Switch
          checked={r.enabled}
          onChange={(checked) => upsertRule({ ...r, enabled: checked })}
        />
      ),
    },
    {
      title: "Rule",
      dataIndex: "name",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name || "Untitled rule"}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {r.daysOfWeek.length ? r.daysOfWeek.map((d) => DOW_LABELS[d]).join(", ") : "All days"}
            {" · "}
            {r.startTime.format("h:mma")}–{r.endTime.format("h:mma")}
            {r.dateRange ? ` · ${r.dateRange[0].format("MMM D")}–${r.dateRange[1].format("MMM D")}` : ""}
            {formatInventoryCondition(r) ? ` · ${formatInventoryCondition(r)}` : ""}
            {formatLeadTime(r) ? ` · ${formatLeadTime(r)}` : ""}
            {r.adjacentPricingEnabled
              ? ` · Adjacent: ${r.adjacentSlotCount || 1} slot${(r.adjacentSlotCount || 1) > 1 ? "s" : ""} @ ${
                  r.adjacentAdjustmentMode === "fixed"
                    ? `${r.adjacentAdjustmentValue || 0}${r.adjustmentType === "pct" ? "%" : "$"}`
                    : `${r.adjacentAdjustmentValue || 60}% of primary`
                }`
              : ""}
            {r.excludedServiceIds && r.excludedServiceIds.length > 0 ? (
              <>
                {" · "}
                <Tooltip
                  title={
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Excluded services</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {getExcludedServiceNames(r).map((name) => (
                          <li key={name}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  }
                >
                  <span style={{ textDecoration: "underline", textDecorationStyle: "dotted", cursor: "help" }}>
                    Excludes {r.excludedServiceIds.length} service{r.excludedServiceIds.length > 1 ? "s" : ""}
                  </span>
                </Tooltip>
              </>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: "Categories",
      key: "categories",
      width: 170,
      render: (_, r) => (
        <Space size={4} wrap>
          {r.categoryIds.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              None selected
            </Text>
          ) : (
            r.categoryIds.map((id) => (
              <Tag key={id}>{categories.find((c) => c.value === id)?.label || id}</Tag>
            ))
          )}
        </Space>
      ),
    },
    {
      title: "Adjustment",
      key: "adj",
      width: 150,
      render: (_, r) => {
        const sign = r.adjustmentValue >= 0 ? "+" : "-";
        const magnitude = Math.abs(r.adjustmentValue);
        return r.adjustmentType === "pct"
          ? `${sign}${magnitude}%`
          : `${sign}$${magnitude}`;
      },
    },
    {
      title: "Condition check",
      key: "preview",
      width: 140,
      render: (_, r) => {
        if (!r.inventoryConditionEnabled) return <Tag>Applies</Tag>;
        const ok = evalInventoryCondition(r);
        return ok ? <Tag color="green">Applies</Tag> : <Tag color="red">Blocked</Tag>;
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditRule(r)}>
            Edit
          </Button>
          <Tooltip title="Duplicate this rule">
            <Button type="text" icon={<CopyOutlined />} onClick={() => duplicateRule(r)}>
              Duplicate
            </Button>
          </Tooltip>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteRule(r.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Dynamic Pricing
          </Title>
          <Text type="secondary">Define time-based pricing rules by service category.</Text>
        </div>
      </Space>

      <Card style={{ borderRadius: 12 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={10}>
            <Form layout="vertical">
              <Form.Item
                label="Service category"
                extra={
                  selectedCategories.length > 1
                    ? `Editing ${selectedCategories.length} categories at once — rules, guardrails, and cue tags apply to all of them.`
                    : undefined
                }
              >
                <Select
                  mode="multiple"
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  options={categories}
                  placeholder="Select one or more categories"
                  suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                />
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <Switch
                checked={cfg.enabled}
                onChange={(checked) => updateCategory({ enabled: checked })}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Enable dynamic pricing</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  When enabled, rules adjust the base/service pricing at runtime.
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={6}>
            <div style={{ textAlign: "right" }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNewRule} disabled={!cfg.enabled}>
                Add rule
              </Button>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <HistoricalDemandPanel
          servicesInCategory={servicesInCategory}
          disabled={!cfg.enabled}
          onCreateRuleFromSlot={({ day, startHour, endHour, avgUtilization }) => {
            const start = dayjs().hour(Math.floor(startHour)).minute((startHour % 1) * 60).second(0);
            const end = dayjs().hour(Math.floor(endHour)).minute((endHour % 1) * 60).second(0);
            const suggestedAdj = avgUtilization >= 80 ? 15 : avgUtilization >= 60 ? 10 : 5;
            const next = createEmptyDynamicRule();
            next.daysOfWeek = [day];
            next.startTime = start;
            next.endTime = end;
            next.adjustmentType = "pct";
            next.adjustmentValue = suggestedAdj;
            next.inventoryConditionEnabled = true;
            next.inventoryMetric = "utilization";
            next.inventoryOperator = "gte";
            next.inventoryThreshold = avgUtilization >= 80 ? 75 : avgUtilization >= 60 ? 60 : 40;
            next.adjacentPricingEnabled = true;
            next.adjacentSlotCount = 1;
            next.adjacentAdjustmentMode = "relative";
            next.adjacentAdjustmentValue = 60;
            next.name = `${DOW_LABELS[day]} ${start.format("h:mma")}–${end.format("h:mma")} demand uplift`;
            next.categoryIds = [...selectedCategories];
            setEditingRule(next);
            ruleForm.setFieldsValue({
              ...next,
              timeRange: [start, end],
            });
            setRuleModalOpen(true);
          }}
        />

        <Divider style={{ margin: "16px 0" }} />

        <Row gutter={16}>
          <Col xs={24}>
            <Card
              size="small"
              style={{ borderRadius: 10 }}
              title="Guardrails (optional)"
              extra={
                !cfg.enabled ? null : isEditingGuardrails ? (
                  <Space size={4}>
                    <Button size="small" icon={<CloseOutlined />} onClick={cancelEditGuardrails}>
                      Cancel
                    </Button>
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={applyGuardrails}>
                      Apply
                    </Button>
                  </Space>
                ) : (
                  <Button size="small" icon={<EditOutlined />} onClick={startEditGuardrails}>
                    Edit
                  </Button>
                )
              }
            >
              {isEditingGuardrails ? (
                <>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    Price increases
                  </Text>
                  <Row gutter={12}>
                    {(
                      [
                        ["minIncrease", "Min increase"],
                        ["maxIncrease", "Max increase"],
                      ] as const
                    ).map(([key, label]) => (
                      <Col span={12} key={key}>
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          {label}
                        </Text>
                        <Space.Compact style={{ width: "100%" }}>
                          <Select
                            style={{ width: 80 }}
                            value={guardrailsDraft?.[key].valueType}
                            onChange={(v) =>
                              setGuardrailsDraft((p) => (p ? { ...p, [key]: { ...p[key], valueType: v } } : p))
                            }
                            options={[
                              { label: "%", value: "pct" },
                              { label: "$", value: "amt" },
                            ]}
                          />
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            value={guardrailsDraft?.[key].value}
                            onChange={(val) =>
                              setGuardrailsDraft((p) =>
                                p ? { ...p, [key]: { ...p[key], value: val === null ? undefined : Number(val) } } : p
                              )
                            }
                          />
                        </Space.Compact>
                      </Col>
                    ))}
                  </Row>

                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginTop: 16, marginBottom: 4 }}
                  >
                    Price decreases
                  </Text>
                  <Row gutter={12}>
                    {(
                      [
                        ["minDecrease", "Min decrease"],
                        ["maxDecrease", "Max decrease"],
                      ] as const
                    ).map(([key, label]) => (
                      <Col span={12} key={key}>
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          {label}
                        </Text>
                        <Space.Compact style={{ width: "100%" }}>
                          <Select
                            style={{ width: 80 }}
                            value={guardrailsDraft?.[key].valueType}
                            onChange={(v) =>
                              setGuardrailsDraft((p) => (p ? { ...p, [key]: { ...p[key], valueType: v } } : p))
                            }
                            options={[
                              { label: "%", value: "pct" },
                              { label: "$", value: "amt" },
                            ]}
                          />
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            value={guardrailsDraft?.[key].value}
                            onChange={(val) =>
                              setGuardrailsDraft((p) =>
                                p ? { ...p, [key]: { ...p[key], value: val === null ? undefined : Number(val) } } : p
                              )
                            }
                          />
                        </Space.Compact>
                      </Col>
                    ))}
                  </Row>

                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                    Changes here don't take effect until you press Apply. Bounds are relative to each
                    service's own base price, not a single dollar amount across the category.
                  </Text>
                </>
              ) : (
                <>
                  <Space size={32} wrap>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        Increase
                      </Text>
                      <Text strong>
                        Min {formatGuardrailBound(cfg.minIncrease, "+")} · Max{" "}
                        {formatGuardrailBound(cfg.maxIncrease, "+")}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        Decrease
                      </Text>
                      <Text strong>
                        Min {formatGuardrailBound(cfg.minDecrease, "-")} · Max{" "}
                        {formatGuardrailBound(cfg.maxDecrease, "-")}
                      </Text>
                    </div>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                    Guardrails clamp how much any rule can move the price up or down, relative to each
                    service's own base price.
                  </Text>
                </>
              )}
            </Card>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              size="small"
              style={{ borderRadius: 10 }}
              title="Guest cue tags (optional)"
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                Show guests a short label based on the price adjustment applied to their slot — e.g. "Best
                Value" when the price is discounted, "Going Fast" when it's marked up. Checked top to bottom;
                the first matching row wins. A row only matches an adjustment of the same type (percent rows
                don't match dollar adjustments, and vice versa).
              </Text>

              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {(cfg.guestCueTags || []).map((t, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (cfg.guestCueTags || []).length - 1;
                  return (
                    <Row key={t.id} gutter={8} align="middle">
                      <Col flex="0 0 110px">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Price adjustment
                        </Text>
                      </Col>
                      <Col flex="0 0 90px">
                        <Select
                          value={t.operator}
                          onChange={(v) => updateGuestCueTag(t.id, { operator: v })}
                          disabled={!cfg.enabled}
                          options={[
                            { label: "<", value: "lt" },
                            { label: "≤", value: "lte" },
                            { label: ">", value: "gt" },
                            { label: "≥", value: "gte" },
                          ]}
                          suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                        />
                      </Col>
                      <Col flex="0 0 110px">
                        <Select
                          value={t.valueType}
                          onChange={(v) => updateGuestCueTag(t.id, { valueType: v })}
                          disabled={!cfg.enabled}
                          options={[
                            { label: "Percent (%)", value: "pct" },
                            { label: "Dollar ($)", value: "amt" },
                          ]}
                          suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                        />
                      </Col>
                      <Col flex="0 0 100px">
                        <InputNumber
                          prefix={t.valueType === "amt" ? "$" : undefined}
                          suffix={t.valueType === "pct" ? "%" : undefined}
                          style={{ width: "100%" }}
                          value={t.threshold}
                          onChange={(v) => updateGuestCueTag(t.id, { threshold: Number(v ?? 0) })}
                          disabled={!cfg.enabled}
                        />
                      </Col>
                      <Col flex="0 0 24px" style={{ textAlign: "center" }}>
                        <Text type="secondary">→</Text>
                      </Col>
                      <Col flex="auto">
                        <Input
                          placeholder="Label shown to guests, e.g. Best Value"
                          value={t.label}
                          onChange={(e) => updateGuestCueTag(t.id, { label: e.target.value })}
                          disabled={!cfg.enabled}
                          maxLength={24}
                        />
                      </Col>
                      <Col flex="0 0 auto">
                        <Space size={4}>
                          {CUE_TAG_COLORS.map((c) => (
                            <Tooltip key={c.key} title={`${c.label} — light ${c.light}, dark ${c.dark}`}>
                              <button
                                type="button"
                                disabled={!cfg.enabled}
                                onClick={() => updateGuestCueTag(t.id, { color: c.key })}
                                style={{
                                  width: 26,
                                  height: 20,
                                  padding: 0,
                                  borderRadius: 4,
                                  overflow: "hidden",
                                  display: "flex",
                                  cursor: cfg.enabled ? "pointer" : "not-allowed",
                                  border: t.color === c.key ? "2px solid #1677ff" : "1px solid #d9d9d9",
                                  boxSizing: "border-box",
                                }}
                              >
                                <span style={{ flex: 1, background: c.light }} />
                                <span style={{ flex: 1, background: c.dark }} />
                              </button>
                            </Tooltip>
                          ))}
                        </Space>
                      </Col>
                      <Col flex="0 0 auto">
                        <Space size={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={!cfg.enabled || isFirst}
                            onClick={() => moveGuestCueTag(t.id, -1)}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={!cfg.enabled || isLast}
                            onClick={() => moveGuestCueTag(t.id, 1)}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            disabled={!cfg.enabled}
                            onClick={() => removeGuestCueTag(t.id)}
                          />
                        </Space>
                      </Col>
                    </Row>
                  );
                })}
              </div>

              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                style={{ marginTop: 12 }}
                disabled={!cfg.enabled}
                onClick={addGuestCueTag}
              >
                Add tag
              </Button>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
          <Col flex="0 0 auto">
            <Text type="secondary" style={{ fontSize: 12 }}>
              Preview trigger conditions with:
            </Text>
          </Col>
          <Col flex="0 0 auto">
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Utilization
              </Text>
              <InputNumber
                size="small"
                min={0}
                max={100}
                suffix="%"
                style={{ width: 80 }}
                value={mockAvailability.utilization}
                onChange={(v) => setMockAvailability((p) => ({ ...p, utilization: Number(v ?? 0) }))}
                disabled={!cfg.enabled}
              />
            </Space>
          </Col>
          <Col flex="0 0 auto">
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Remaining
              </Text>
              <InputNumber
                size="small"
                min={0}
                style={{ width: 70 }}
                value={mockAvailability.remaining}
                onChange={(v) => setMockAvailability((p) => ({ ...p, remaining: Number(v ?? 0) }))}
                disabled={!cfg.enabled}
              />
            </Space>
          </Col>
        </Row>

        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          Pricing order (preview): base price → day/date override → highest priority matching rule
          (including trigger condition) → clamp to the increase/decrease guardrails. Showing rules
          that apply to the category(ies) selected above — a rule can span multiple categories via
          "Applies to categories" when adding or editing it.
        </Text>

        <Table<DynamicPricingRule>
          rowKey="id"
          columns={columns}
          dataSource={[...visibleRules].sort((a, b) => b.priority - a.priority)}
          pagination={{ pageSize: 8 }}
          locale={{
            emptyText:
              selectedCategories.length === 0
                ? "Select a category above to see its rules."
                : cfg.enabled
                ? "No rules yet for the selected category(ies). Click 'Add rule' to create one."
                : "Enable dynamic pricing to add rules.",
          }}
        />
      </Card>

      <Modal
        title="Dynamic Pricing Rule"
        width={640}
        open={ruleModalOpen}
        onCancel={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
          ruleForm.resetFields();
        }}
        onOk={handleSaveRule}
        okText="Save rule"
      >
        <Form
  form={ruleForm}
  layout="vertical"
  initialValues={{
    enabled: true,
    adjustmentType: "pct",
    inventoryConditionEnabled: false,
    inventoryMetric: "utilization",
    inventoryOperator: "gt",
    inventoryThreshold: 80,
    leadTimeMode: "none",
    leadTimeOperator: "lt",
    leadTimeDays: 1,
    leadTimeHours: 0,
    adjacentPricingEnabled: false,
    adjacentSlotCount: 1,
    adjacentAdjustmentMode: "relative",
    adjacentAdjustmentValue: 60,
    excludedServiceIds: [],
  }}
>
          <Form.Item name="enabled" label="Enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="name"
            label="Rule name"
            rules={[{ required: true, message: "Please name this rule" }]}
          >
            <Input placeholder="e.g., Peak hours uplift" />
          </Form.Item>

          <Form.Item
            name="categoryIds"
            label="Applies to categories"
            tooltip="Which service categories this rule affects. A category also needs its own 'Enable dynamic pricing' toggle on for this rule to take effect there."
            rules={[{ required: true, message: "Select at least one category" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select one or more categories"
              options={categories}
              suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="daysOfWeek" label="Days of week (optional)">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="All days"
                  options={allDays.map((d) => ({ label: DOW_LABELS[d], value: d }))}
                  suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateRange" label="Date range (optional)">
                <RangePicker />
              </Form.Item>
            </Col>
          </Row>

                 <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="timeRange"
              label="Time window"
              rules={[{ required: true, message: "Select a time window" }]}
            >
              <TimePicker.RangePicker format="h:mma" use12Hours minuteStep={15} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="priority" label="Priority (higher wins)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

          <Divider style={{ margin: "12px 0" }} />

        <Title level={5} style={{ marginBottom: 4 }}>
          Lead time
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Optionally gate this rule by how far ahead the booking is made, measured per slot.
        </Text>

        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col span={24}>
            <Form.Item name="leadTimeMode" label="Lead time">
              <Select
                options={[
                  { label: "None (no lead-time gate)", value: "none" },
                  { label: "Lead-time window", value: "window" },
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item shouldUpdate noStyle>
          {() => {
            const mode = ruleForm.getFieldValue("leadTimeMode");
            if (mode !== "window") return null;
            return (
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="leadTimeOperator"
                    label="Comparison"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select
                      options={[
                        { label: "is less than (<)", value: "lt" },
                        { label: "is at most (≤)", value: "lte" },
                        { label: "is greater than (>)", value: "gt" },
                        { label: "is at least (≥)", value: "gte" },
                      ]}
                      suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="leadTimeDays"
                    label="Days"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="leadTimeHours"
                    label="Hours"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <InputNumber min={0} max={23} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>
            );
          }}
        </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

<Row gutter={12} align="middle">
  <Col span={12}>
    <Form.Item
      name="inventoryConditionEnabled"
      label="Trigger condition"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item shouldUpdate noStyle>
      {() => {
        const enabled = ruleForm.getFieldValue("inventoryConditionEnabled");
        return (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {enabled
              ? "This rule applies only when the trigger condition below is met."
              : "Optional — gate this rule by demand, availability, or lead time."}
          </Text>
        );
      }}
    </Form.Item>
  </Col>
</Row>

<Form.Item shouldUpdate noStyle>
  {() => {
    const enabled = ruleForm.getFieldValue("inventoryConditionEnabled");
    if (!enabled) return null;

    const metric = ruleForm.getFieldValue("inventoryMetric") as "remaining" | "utilization" | undefined;

const thresholdLabel = metric === "utilization" ? "Threshold (%)" : "Threshold (remaining slots)";

    return (
      <>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="inventoryMetric"
              label="Metric"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                options={[
                  { label: "Utilization %", value: "utilization" },
                  { label: "Remaining slots", value: "remaining" },
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="inventoryOperator"
              label="Comparison"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                options={[
                  { label: "is less than (<)", value: "lt" },
                  { label: "is at most (≤)", value: "lte" },
                  { label: "is greater than (>)", value: "gt" },
                  { label: "is at least (≥)", value: "gte" },
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="inventoryThreshold"
              label={thresholdLabel}
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  }}
</Form.Item>

<Divider style={{ margin: "12px 0" }} />

<Title level={5} style={{ marginBottom: 4 }}>
  Price adjustment
</Title>
<Text type="secondary" style={{ fontSize: 12 }}>
  Define what happens when this rule applies.
</Text>

<Row gutter={12} style={{ marginTop: 8 }}>
  <Col span={12}>
    <Form.Item name="adjustmentType" label="Adjustment type">
      <Select
        options={[
          { label: "Percent (%)", value: "pct" },
          { label: "Dollar amount ($)", value: "amt" },
        ]}
        suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
      />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item name="adjustmentValue" label="Adjustment value">
      <InputNumber style={{ width: "100%" }} />
    </Form.Item>
  </Col>
</Row>

<Text type="secondary" style={{ fontSize: 12 }}>
  Example: Percent with value 15 means +15%. Use negative values for discounts.
</Text>

<Divider style={{ margin: "12px 0" }} />

<Title level={5} style={{ marginBottom: 4 }}>
  Adjacent time slots
</Title>

<Form.Item
  name="adjacentPricingEnabled"
  label="Apply to nearby slots"
  valuePropName="checked"
  style={{ marginTop: 8 }}
>
  <Switch />
</Form.Item>

<Form.Item shouldUpdate noStyle>
  {() => {
    const enabled = ruleForm.getFieldValue("adjacentPricingEnabled");
    const mode = ruleForm.getFieldValue("adjacentAdjustmentMode") as "relative" | "fixed" | undefined;
    const primaryType = ruleForm.getFieldValue("adjustmentType") as AdjustmentType | undefined;
    const primaryValue = Number(ruleForm.getFieldValue("adjustmentValue") || 0);
    const adjacentValue = Number(ruleForm.getFieldValue("adjacentAdjustmentValue") || 0);
    if (!enabled) return null;

    const exampleUnit = primaryType === "amt" ? "$" : "%";
    const relativeExample =
      mode !== "fixed"
        ? `Example: this rule is ${primaryType === "amt" ? "$" : ""}${primaryValue || 20}${
            primaryType === "pct" ? "%" : ""
          } and adjacent strength is ${adjacentValue || 60}% → neighboring slots get ${
            primaryType === "amt" ? "$" : ""
          }${Math.round(((primaryValue || 20) * (adjacentValue || 60)) / 100)}${
            primaryType === "pct" ? "%" : ""
          }, on their own — not stacked on top of the primary adjustment.`
        : null;

    return (
      <>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="adjacentSlotCount"
              label="Slots affected"
              tooltip="Number of time slots before AND after the triggered slot — e.g. 1 means one slot on each side, two slots total."
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={1} max={4} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="adjacentAdjustmentMode"
              label="Adjacent pricing"
              tooltip="Relative: derive the neighbor's adjustment as a percentage of this rule's adjustment. Fixed: set the neighbor's adjustment directly, independent of the primary value."
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                options={[
                  { label: "Relative to primary", value: "relative" },
                  { label: "Fixed adjustment", value: "fixed" },
                ]}
                suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="adjacentAdjustmentValue"
              label={
                mode === "fixed"
                  ? `Adjacent adjustment value (${exampleUnit})`
                  : "Adjacent strength (% of primary)"
              }
              tooltip={
                mode === "fixed"
                  ? "Applies this exact adjustment to nearby slots, regardless of what the primary adjustment is."
                  : "Example: 60 means nearby slots receive 60% of the primary rule's adjustment amount."
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Alert
          type="info"
          showIcon
          style={{ marginTop: 4, marginBottom: 8 }}
          message="How this works"
          description={
            <div style={{ fontSize: 12 }}>
              <div>
                Nudges the price of the slot(s) immediately before and after the one that triggered this rule,
                so pricing steps down gradually instead of cutting off sharply next to a peak slot. Each
                neighboring slot uses only the adjacent adjustment below, on its own — it never also receives
                this rule's primary adjustment, and the two are never added together on the same slot.
              </div>
              {relativeExample && <div style={{ marginTop: 4 }}>{relativeExample}</div>}
              <div style={{ marginTop: 4 }}>
                If a neighboring slot also matches a rule of its own, normal priority order decides which rule's
                adjustment wins for that slot — adjacent pricing doesn't override higher-priority rules.
              </div>
            </div>
          }
        />
      </>
    );
  }}
</Form.Item>

<Divider style={{ margin: "12px 0" }} />

<Title level={5} style={{ marginBottom: 4 }}>
  Service scope
</Title>
<Text type="secondary" style={{ fontSize: 12 }}>
  By default, this rule applies to all services in this category. Optionally exclude specific services.
</Text>

<Form.Item name="excludedServiceIds" style={{ marginTop: 8 }}>
  <Select
    mode="multiple"
    allowClear
    placeholder="Exclude specific services (optional)"
    options={servicesInCategory.map((s) => ({
      label: s.name,
      value: s.id,
    }))}
    suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
  />
</Form.Item>

          
        </Form>
      </Modal>
    </div>
  );
};

/* ---------- Services list view ---------- */

type ServiceListProps = {
  services: SpaService[];
  onAdd: () => void;
  onEdit: (svc: SpaService) => void;
  initialTab?: string;
};

const ServiceList: React.FC<ServiceListProps> = ({ services, onAdd, onEdit, initialTab }) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? "services");

  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [services, search]);

  const columns: ColumnsType<SpaService> = [
    {
      title: "Service",
      dataIndex: "name",
      render: (_, svc) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => onEdit(svc)}
        >
          <div style={{ fontWeight: 500 }}>{svc.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {svc.category} ·{" "}
            {svc.durations.map((d) => `${d.minutes} min`).join(" / ")}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (val: Status) =>
        val === "active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Cleanup",
      dataIndex: "cleanupMinutes",
      width: 120,
      render: (min: number) => `${min} min`,
    },
    {
      title: "Durations",
      dataIndex: "durations",
      width: 200,
      render: (_: any, svc: SpaService) => (
        <Space wrap>
          {svc.durations.map((d) => (
            <Tag key={d.id}>{d.minutes} min</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, svc) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(svc)}
          >
            Edit
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} disabled>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Services
        </Title>
        <Space>
          <Input.Search
            allowClear
            placeholder="Start typing to search…"
            style={{ width: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            Add service
          </Button>
        </Space>
      </Space>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "services", label: "Services" },
          { key: "categories", label: "Categories" },
          { key: "dynamic_pricing", label: "Dynamic Pricing" },
          { key: "addons", label: "Add-Ons" },
          { key: "enhancements", label: "Enhancements" },
        ]}
      />

      {activeTab === "services" && (
        <Table<SpaService>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
        />
      )}

      {activeTab === "dynamic_pricing" && (
        <DynamicPricingPage categories={MOCK_CATEGORIES} />
      )}

      {activeTab !== "services" && activeTab !== "dynamic_pricing" && (
        <Card style={{ borderRadius: 12 }}>
          <Text type="secondary">This section is a placeholder in the demo.</Text>
        </Card>
      )}
    </div>
  );
};

/* ---------- Page wrapper ---------- */

const SpaServicesPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [services, setServices] = useState<SpaService[]>([
    {
      ...createEmptyService(),
      id: "svc1",
      name: "IMPÉRIALE Relaxing Massage",
      category: "Specialty Massages",
      cleanupMinutes: 15,
      sortOrder: 10,
      durations: [
        {
          ...createEmptyDuration(60, true),
          basePrice: 235,
        },
        {
          ...createEmptyDuration(90, false),
          basePrice: 355,
        },
      ],
      roomIds: ["r1", "r2", "r4"],
      equipmentIds: [],
      addOnIds: ["a1"],
      enhancementIds: ["h1", "h2"],
    },
  ]);

  const [editing, setEditing] = useState<SpaService | null>(null);

  const handleSave = (svc: SpaService) => {
    setServices((prev) => {
      const exists = prev.some((p) => p.id === svc.id);
      if (exists) {
        return prev.map((p) => (p.id === svc.id ? svc : p));
      }
      return [...prev, svc];
    });
    setEditing(null);
  };

  return editing ? (
    <ServiceForm
      initial={editing}
      onSave={handleSave}
      onCancel={() => setEditing(null)}
    />
  ) : (
    <ServiceList
      services={services}
      onAdd={() => setEditing(createEmptyService())}
      onEdit={(svc) => setEditing(svc)}
      initialTab={initialTab}
    />
  );
};

export default SpaServicesPage;