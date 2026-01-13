import { ChevronDown } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
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

  // Inventory-based condition (optional)
  inventoryConditionEnabled?: boolean;
  inventoryMetric?: "remaining" | "utilization" | "lead_time";
  inventoryOperator?: "lt" | "lte" | "gt" | "gte";
  inventoryThreshold?: number; // remaining slots, utilization %, or hours depending on metric
  inventoryLookaheadHours?: number; // evaluate availability over next X hours

  dateRange?: [Dayjs, Dayjs]; // optional date constraint

  // Optional service-level exclusions (advanced)
excludedServiceIds?: string[];
};

type CategoryDynamicPricing = {
  enabled: boolean;
  minPrice?: number;
  maxPrice?: number;
  rules: DynamicPricingRule[];
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
  const lookahead = r.inventoryLookaheadHours ?? 0;
  

  if (metric === "remaining") return `Remaining slots ${op} ${threshold} (next ${lookahead}h)`;
  if (metric === "utilization") return `Utilization ${op} ${threshold}% (next ${lookahead}h)`;
  return `Lead time ${op} ${threshold}h`;
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
    inventoryMetric: "remaining",
    inventoryOperator: "lt",
    inventoryThreshold: 3,
    inventoryLookaheadHours: 24,
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
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categories?.[0]?.value || ""
  );

  // In a real app this would be loaded/saved per property/venue.
  const [byCategory, setByCategory] = useState<Record<string, CategoryDynamicPricing>>(() => {
    const initial: Record<string, CategoryDynamicPricing> = {};
    categories.forEach((c) => {
      initial[c.value] = {
        enabled: false,
        minPrice: undefined,
        maxPrice: undefined,
        rules: [],
      };
    });
    return initial;
  });

  const cfg = byCategory[selectedCategory] || { enabled: false, rules: [] };

  // Services in the selected category (for exclusions dropdown)
  // NOTE: mocked for demo; in production this should come from real services by category
  const servicesInCategory = useMemo(() => {
    return [
      { id: "svc1", name: "IMPÉRIALE Relaxing Massage" },
      { id: "svc2", name: "Deep Tissue Massage" },
      { id: "svc3", name: "Couples Massage" },
    ];
  }, [selectedCategory]);

  // Helper to map excluded ids to service names
  const getExcludedServiceNames = (rule: DynamicPricingRule): string[] => {
    const ids = rule.excludedServiceIds || [];
    if (ids.length === 0) return [];
    const byId = new Map(servicesInCategory.map((s) => [s.id, s.name] as const));
    return ids.map((id) => byId.get(id) || id);
  };

  /* ---------- Mock availability (demo) ---------- */
  const [mockAvailability, setMockAvailability] = useState({
    remaining: 2, // remaining slots in the lookahead window
    utilization: 85, // utilization % in lookahead window
    leadTime: 6, // hours until start time
  });

  const evalInventoryCondition = (r: DynamicPricingRule): boolean => {
    if (!r.inventoryConditionEnabled) return true;

    const metric = r.inventoryMetric || "remaining";
    const op = r.inventoryOperator || "lt";
    // If older rules (created before inventory conditions existed) are missing a threshold,
    // fall back to sensible defaults instead of treating it as 0 (which often blocks everything).
    const defaultThreshold =
      metric === "utilization" ? 80 : metric === "lead_time" ? 24 : 3;

    const threshold =
      r.inventoryThreshold === null || r.inventoryThreshold === undefined
        ? defaultThreshold
        : r.inventoryThreshold;

    const left =
      metric === "remaining"
        ? mockAvailability.remaining
        : metric === "utilization"
        ? mockAvailability.utilization
        : mockAvailability.leadTime;

    if (op === "lt") return left < threshold;
    if (op === "lte") return left <= threshold;
    if (op === "gt") return left > threshold;
    return left >= threshold; // gte
  };

  const updateCategory = (patch: Partial<CategoryDynamicPricing>) => {
    setByCategory((prev) => ({
      ...prev,
      [selectedCategory]: {
        ...prev[selectedCategory],
        ...patch,
      },
    }));
  };

  const upsertRule = (rule: DynamicPricingRule) => {
    updateCategory({
      rules: cfg.rules.some((r) => r.id === rule.id)
        ? cfg.rules.map((r) => (r.id === rule.id ? rule : r))
        : [...cfg.rules, rule],
    });
  };

  const deleteRule = (id: string) => {
    updateCategory({ rules: cfg.rules.filter((r) => r.id !== id) });
  };

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DynamicPricingRule | null>(null);
  const [ruleForm] = Form.useForm();

  const openNewRule = () => {
    const next = createEmptyDynamicRule();
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
inventoryLookaheadHours:
  values.inventoryLookaheadHours === null || values.inventoryLookaheadHours === undefined
    ? undefined
    : Number(values.inventoryLookaheadHours),
      startTime: timeRange?.[0] || (editingRule?.startTime ?? dayjs()),
      endTime: timeRange?.[1] || (editingRule?.endTime ?? dayjs()),
      dateRange: values.dateRange,
 excludedServiceIds: values.excludedServiceIds || [],
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
      title: "Adjustment",
      key: "adj",
      width: 150,
      render: (_, r) => {
        const prefix = r.adjustmentValue >= 0 ? "+" : "";
        return r.adjustmentType === "pct"
          ? `${prefix}${r.adjustmentValue}%`
          : `${prefix}$${Math.abs(r.adjustmentValue)}`;
      },
    },
    {
      title: "Preview",
      key: "preview",
      width: 120,
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
      width: 160,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditRule(r)}>
            Edit
          </Button>
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
              <Form.Item label="Service category">
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categories}
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

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card size="small" style={{ borderRadius: 10 }} title="Guardrails (optional)">
              <Row gutter={12}>
                <Col span={12}>
                  <Form layout="vertical">
                    <Form.Item label="Min price">
                      <InputNumber
                        prefix="$"
                        min={0}
                        style={{ width: "100%" }}
                        value={cfg.minPrice}
                        onChange={(val) => updateCategory({ minPrice: val === null ? undefined : Number(val) })}
                        disabled={!cfg.enabled}
                      />
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={12}>
                  <Form layout="vertical">
                    <Form.Item label="Max price">
                      <InputNumber
                        prefix="$"
                        min={0}
                        style={{ width: "100%" }}
                        value={cfg.maxPrice}
                        onChange={(val) => updateCategory({ maxPrice: val === null ? undefined : Number(val) })}
                        disabled={!cfg.enabled}
                      />
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Guardrails clamp the final price after rules apply.
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card size="small" style={{ borderRadius: 10 }} title="Mock availability (demo)">
              <Row gutter={12}>
                <Col span={8}>
                  <Form layout="vertical">
                    <Form.Item label="Remaining slots">
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        value={mockAvailability.remaining}
                        onChange={(v) =>
                          setMockAvailability((p) => ({
                            ...p,
                            remaining: Number(v ?? 0),
                          }))
                        }
                        disabled={!cfg.enabled}
                      />
                    </Form.Item>
                  </Form>
                </Col>

                <Col span={8}>
                  <Form layout="vertical">
                    <Form.Item label="Utilization %">
                      <InputNumber
                        min={0}
                        max={100}
                        style={{ width: "100%" }}
                        value={mockAvailability.utilization}
                        onChange={(v) =>
                          setMockAvailability((p) => ({
                            ...p,
                            utilization: Number(v ?? 0),
                          }))
                        }
                        disabled={!cfg.enabled}
                      />
                    </Form.Item>
                  </Form>
                </Col>

                <Col span={8}>
                  <Form layout="vertical">
                    <Form.Item label="Lead time (hours)">
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        value={mockAvailability.leadTime}
                        onChange={(v) =>
                          setMockAvailability((p) => ({
                            ...p,
                            leadTime: Number(v ?? 0),
                          }))
                        }
                        disabled={!cfg.enabled}
                      />
                    </Form.Item>
                  </Form>
                </Col>
              </Row>

              <Text type="secondary" style={{ fontSize: 12 }}>
                Use these values to preview inventory-based rules. (Lookahead is not simulated yet; it’s only displayed in the rule summary.)
              </Text>

              <Divider style={{ margin: "12px 0" }} />

              <Text type="secondary" style={{ fontSize: 12 }}>
                Pricing order (preview): base price → day/date override → highest priority matching rule (including inventory condition) → clamp to min/max.
              </Text>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Table<DynamicPricingRule>
          rowKey="id"
          columns={columns}
          dataSource={[...cfg.rules].sort((a, b) => b.priority - a.priority)}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: cfg.enabled ? "No rules yet. Click 'Add rule' to create one." : "Enable dynamic pricing to add rules." }}
        />
      </Card>

      <Modal
        title={editingRule?.id ? "Dynamic Pricing Rule" : "New Rule"}
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
    inventoryMetric: "remaining",
    inventoryOperator: "lt",
    inventoryThreshold: 3,
    inventoryLookaheadHours: 24,
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

<Row gutter={12} align="middle">
  <Col span={12}>
    <Form.Item
      name="inventoryConditionEnabled"
      label="Inventory condition"
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
              ? "Apply this rule only when availability/demand meets the condition."
              : "Optional: restrict this rule by availability or lead time."}
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

    const metric = ruleForm.getFieldValue("inventoryMetric") as
      | "remaining"
      | "utilization"
      | "lead_time"
      | undefined;

    const thresholdLabel =
      metric === "utilization"
        ? "Threshold (%)"
        : metric === "lead_time"
        ? "Threshold (hours)"
        : "Threshold (remaining slots)";

    return (
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            name="inventoryMetric"
            label="Metric"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              options={[
                { label: "Remaining slots", value: "remaining" },
                { label: "Utilization %", value: "utilization" },
                { label: "Lead time (hours)", value: "lead_time" },
              ]}
              suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
            />
          </Form.Item>
        </Col>

        <Col span={4}>
          <Form.Item
            name="inventoryOperator"
            label="Op"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              options={[
                { label: "<", value: "lt" },
                { label: "≤", value: "lte" },
                { label: ">", value: "gt" },
                { label: "≥", value: "gte" },
              ]}
              suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
            />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            name="inventoryThreshold"
            label={thresholdLabel}
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            name="inventoryLookaheadHours"
            label="Lookahead (hours)"
            tooltip="Evaluate availability over the upcoming window (e.g., next 24 hours). Not used for lead time."
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              disabled={metric === "lead_time"}
            />
          </Form.Item>
        </Col>
      </Row>
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

          <Row gutter={12}>
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
            Example: adjustment type Percent with value 15 means +15%. Use negative values for discounts.
          </Text>
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
};

const ServiceList: React.FC<ServiceListProps> = ({ services, onAdd, onEdit }) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("services");

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

const SpaServicesPage: React.FC = () => {
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
    />
  );
};

export default SpaServicesPage;