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
                    <Select options={MOCK_CATEGORIES} />
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
                  />
                </Form.Item>

                <Form.Item label="Waiver" name="waiverId">
                  <Select
                    allowClear
                    placeholder="Select waiver"
                    options={MOCK_WAIVERS}
                  />
                </Form.Item>

                <Form.Item label="Cancellation policy" name="cancellationPolicyId">
                  <Select options={MOCK_POLICIES} />
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

/* ---------- Services list view ---------- */

type ServiceListProps = {
  services: SpaService[];
  onAdd: () => void;
  onEdit: (svc: SpaService) => void;
};

const ServiceList: React.FC<ServiceListProps> = ({ services, onAdd, onEdit }) => {
  const [search, setSearch] = useState("");

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
        defaultActiveKey="services"
        items={[
          { key: "services", label: "Services" },
          { key: "categories", label: "Categories" },
          { key: "addons", label: "Add-Ons" },
          { key: "enhancements", label: "Enhancements" },
        ]}
      />

      <Table<SpaService>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 10 }}
      />
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