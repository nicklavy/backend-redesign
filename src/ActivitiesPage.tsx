// src/ActivitiesPage.tsx
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
  Col,
  Radio,
  Switch,
  TimePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { ChevronDown } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/* ---------- Types ---------- */

type ActivityStatus = "active" | "inactive";

type GuestCancellationMode = "always" | "never" | "hours";

type GuestOpenUrlMode = "current" | "new-tab" | "new-window";

type ActivityGuestOptions = {
  url?: string;
  openUrlMode: GuestOpenUrlMode;
  hidePrice: boolean;
  hidePriceFromDetail: boolean;
  hideMaxGuests: boolean;
  activateDeeplinkShare: boolean;
  hideCalendarInListing: boolean;
  displayGuestRequests: boolean;
  displayStartTimeOnly: boolean;
  hideBookDateInDetail: boolean;
  displayLicensePlate: boolean;
  displayETA: boolean;
  displayETD: boolean;
};

type ActivityBookingOptions = {
  blockBooking: boolean;
  sameDayOnly: boolean;
  bccEmails?: string;
  validateInventoryEndTime: boolean;
  groupBookings: boolean;
};

type GuestChildPrice = {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  price: number;
};

type InventoryShiftType = "slot" | "half-day" | "full-day" | "morning" | "afternoon";

type ActivityInventorySlot = {
  id: string;
  date: Dayjs;
  shiftType: InventoryShiftType;
  startTime?: Dayjs;
  endTime?: Dayjs;
  quantity: number;
  quantityBooked: number;
  minGuestsPerBooking?: number;
  maxGuestsPerBooking?: number;
  dailyBookingLimitPerGuest?: number;
  fbCreditAmount?: number;
  basePrice?: number;
  childPricing: GuestChildPrice[];
};

type Activity = {
  id: string;
  name: string;
  category: string;
  productCode?: string;
  location?: string;
  shortDescription?: string;
  longDescription?: string;
  disclaimerId?: string;
  waiverId?: string;
  waiverRequiredBeforeCheckout: boolean;
  cancellationMode: GuestCancellationMode;
  cancellationHours?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  iconKey?: string;
  sortOrder: number;
  imageUrl?: string;
  attachmentUrl?: string;
  createdAt: Dayjs;
  status: ActivityStatus;
  orderIndex: number;
  guestOptions: ActivityGuestOptions;
  bookingOptions: ActivityBookingOptions;
};

/* ---------- Mock lookups ---------- */

const MOCK_ACTIVITY_CATEGORIES = [
  { label: "Snorkeling", value: "snorkeling" },
  { label: "Boat Excursions", value: "boat" },
  { label: "Kids Club", value: "kids-club" },
  { label: "Wellness / Fitness", value: "wellness" },
];

const MOCK_LOCATIONS = [
  { label: "Resort Main Beach", value: "main-beach" },
  { label: "Marina Dock", value: "marina-dock" },
  { label: "Kids Zone", value: "kids-zone" },
];

const MOCK_DISCLAIMERS = [
  { label: "Standard Activity Disclaimer", value: "activity_standard" },
  { label: "Water Activity Disclaimer", value: "water_activity" },
];

const MOCK_WAIVERS = [
  { label: "Water Sports Waiver", value: "water_waiver" },
  { label: "Adventure / Risk Waiver", value: "adventure_waiver" },
];

const MOCK_ICONS = [
  { label: "Waves", value: "waves" },
  { label: "Sailboat", value: "sailboat" },
  { label: "Kids", value: "kids" },
  { label: "Wellness", value: "wellness" },
];

const MOCK_CANCELLATION_POLICIES = [
  { label: "Always refundable", value: "always" },
  { label: "Never refundable", value: "never" },
  { label: "No cancellation within X hours", value: "hours" },
];

/* ---------- Helpers ---------- */

const createEmptyActivity = (): Activity => ({
  id: Math.random().toString(36).slice(2),
  name: "",
  category: "snorkeling",
  productCode: "",
  location: "",
  shortDescription: "",
  longDescription: "",
  disclaimerId: undefined,
  waiverId: undefined,
  waiverRequiredBeforeCheckout: false,
  cancellationMode: "always",
  cancellationHours: undefined,
  minDurationMinutes: undefined,
  maxDurationMinutes: undefined,
  iconKey: undefined,
  sortOrder: 1,
  imageUrl: "",
  attachmentUrl: "",
  createdAt: dayjs(),
  status: "active",
  orderIndex: 1,
  guestOptions: {
    url: "",
    openUrlMode: "current",
    hidePrice: false,
    hidePriceFromDetail: false,
    hideMaxGuests: false,
    activateDeeplinkShare: false,
    hideCalendarInListing: false,
    displayGuestRequests: false,
    displayStartTimeOnly: false,
    hideBookDateInDetail: false,
    displayLicensePlate: false,
    displayETA: false,
    displayETD: false,
  },
  bookingOptions: {
    blockBooking: false,
    sameDayOnly: false,
    bccEmails: "",
    validateInventoryEndTime: false,
    groupBookings: false,
  },
});

const createSampleSlot = (activityId: string): ActivityInventorySlot => ({
  id: `${activityId}-slot1`,
  date: dayjs().startOf("day"),
  shiftType: "slot",
  startTime: dayjs().hour(8).minute(0),
  endTime: dayjs().hour(10).minute(0),
  quantity: 20,
  quantityBooked: 5,
  minGuestsPerBooking: 1,
  maxGuestsPerBooking: 6,
  dailyBookingLimitPerGuest: 2,
  fbCreditAmount: 0,
  basePrice: 129,
  childPricing: [
    {
      id: "child1",
      label: "Children 6–12",
      minAge: 6,
      maxAge: 12,
      price: 89,
    },
  ],
});

/* ---------- Activity Inventory Page ---------- */

type InventoryPageProps = {
  activity: Activity;
  slots: ActivityInventorySlot[];
  onUpdateSlots: (slots: ActivityInventorySlot[]) => void;
  onBack: () => void;
};

const InventoryPage: React.FC<InventoryPageProps> = ({
  activity,
  slots,
  onUpdateSlots,
  onBack,
}) => {
  const [editingSlots, setEditingSlots] = useState<ActivityInventorySlot[]>(slots);

  const columns: ColumnsType<ActivityInventorySlot> = [
    {
      title: "Date",
      dataIndex: "date",
      width: 140,
      render: (val) => val.format("MMM D, YYYY"),
    },
    {
      title: "Shift / Time",
      dataIndex: "shiftType",
      width: 220,
      render: (_, slot) => {
        if (slot.shiftType === "slot" && slot.startTime && slot.endTime) {
          return `${slot.startTime.format("h:mm a")} – ${slot.endTime.format(
            "h:mm a"
          )}`;
        }
        switch (slot.shiftType) {
          case "half-day":
            return "Half Day";
          case "full-day":
            return "Full Day";
          case "morning":
            return "Morning";
          case "afternoon":
            return "Afternoon";
          default:
            return "-";
        }
      },
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      width: 80,
    },
    {
      title: "Booked",
      dataIndex: "quantityBooked",
      width: 90,
    },
    {
      title: "Min / Max Guests",
      dataIndex: "minGuestsPerBooking",
      width: 160,
      render: (_, slot) =>
        `${slot.minGuestsPerBooking ?? "-"} / ${slot.maxGuestsPerBooking ?? "-"}`,
    },
    {
      title: "Daily Limit / Guest",
      dataIndex: "dailyBookingLimitPerGuest",
      width: 170,
      render: (val) => val ?? "-",
    },
    {
      title: "F&B Credit",
      dataIndex: "fbCreditAmount",
      width: 120,
      render: (val) => (val ? `$${val}` : "-"),
    },
    {
      title: "Base Price",
      dataIndex: "basePrice",
      width: 120,
      render: (val) => (val ? `$${val}` : "-"),
    },
    {
      title: "Child Pricing",
      dataIndex: "childPricing",
      render: (childPricing: GuestChildPrice[]) =>
        childPricing && childPricing.length > 0 ? (
          <Space wrap>
            {childPricing.map((cp) => (
              <Tag key={cp.id}>
                {cp.label}: ${cp.price}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">None</Text>
        ),
    },
  ];

  const addSlot = () => {
    const next: ActivityInventorySlot = {
      id: Math.random().toString(36).slice(2),
      date: dayjs().startOf("day"),
      shiftType: "slot",
      startTime: dayjs().hour(8).minute(0),
      endTime: dayjs().hour(10).minute(0),
      quantity: 10,
      quantityBooked: 0,
      minGuestsPerBooking: 1,
      maxGuestsPerBooking: 6,
      dailyBookingLimitPerGuest: 1,
      fbCreditAmount: 0,
      basePrice: 100,
      childPricing: [],
    };
    setEditingSlots((prev) => [...prev, next]);
  };

  const handleSave = () => {
    onUpdateSlots(editingSlots);
    onBack();
  };

  return (
    <div style={{ padding: 24 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 8 }}
      >
        Back to Activity
      </Button>

      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Inventory: {activity.name || "New Activity"}
        </Title>
        <Space>
          <Button onClick={onBack}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save Inventory
          </Button>
        </Space>
      </Space>

      <Card
        style={{ borderRadius: 12, marginBottom: 16 }}
        title="Default structure"
      >
        <Text type="secondary">
          Use this to set up a default pattern, then override specific days of the
          week or specific dates as needed. (Template logic to be wired by dev.)
        </Text>
      </Card>

      <Card
        style={{ borderRadius: 12 }}
        title="Inventory by Date & Time"
        extra={
          <Button type="link" icon={<PlusOutlined />} onClick={addSlot}>
            Add time slot
          </Button>
        }
      >
        <Table<ActivityInventorySlot>
          rowKey="id"
          columns={columns}
          dataSource={editingSlots}
          pagination={false}
        />
      </Card>
    </div>
  );
};

/* ---------- Activity Form ---------- */

type ActivityFormProps = {
  initial: Activity;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
  onOpenInventory: () => void;
};

const ActivityForm: React.FC<ActivityFormProps> = ({
  initial,
  onSave,
  onCancel,
  onOpenInventory,
}) => {
  const [form] = Form.useForm<Activity>();
  const [activity, setActivity] = useState<Activity>(initial);

  const handleFinish = (values: any) => {
    const merged: Activity = {
      ...activity,
      ...values,
      guestOptions: {
        ...activity.guestOptions,
        ...(values.guestOptions || {}),
      },
      bookingOptions: {
        ...activity.bookingOptions,
        ...(values.bookingOptions || {}),
      },
    };
    onSave(merged);
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onCancel}
        >
          Back to Activities
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
            {activity.name || "New Activity"}
          </Text>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={() => form.submit()}>Save as Draft</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Save
            </Button>
          </Space>
        </Space>
      </div>

      <Row gutter={16} align="top">
        {/* LEFT COLUMN - core details */}
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 12 }} title="Activity Details">
            <Form
              form={form}
              layout="vertical"
              initialValues={activity}
              onFinish={handleFinish}
              onValuesChange={(_, all) => {
                setActivity((prev) => ({ ...prev, ...all }));
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="Activity name"
                    name="name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g., Sunset Catamaran Cruise" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Category" name="category">
                    <Select
                      options={MOCK_ACTIVITY_CATEGORIES}
                      suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Location" name="location">
                    <Select
                      options={MOCK_LOCATIONS}
                      allowClear
                      suffixIcon={<ChevronDown size={16} strokeWidth={1.8} />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Product code" name="productCode">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Sort order" name="sortOrder">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Minimum duration (min)" name="minDurationMinutes">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Maximum duration (min)" name="maxDurationMinutes">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Icon" name="iconKey">
                    <Select
                      options={MOCK_ICONS}
                      allowClear
                      placeholder="Select icon"
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

              <Form.Item label="Short description" name="shortDescription">
                <Input.TextArea rows={2} />
              </Form.Item>

              <Form.Item label="Long description" name="longDescription">
                <Input.TextArea rows={4} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Image upload" name="imageUrl">
                    <Button block>Upload image (stub)</Button>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Attachment upload" name="attachmentUrl">
                    <Button block>Upload attachment (stub)</Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* RIGHT COLUMN - Policies, Guest options, Booking options */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Card style={{ borderRadius: 12 }} title="Policies">
              <Form
                form={form}
                layout="vertical"
                initialValues={activity}
                onFinish={handleFinish}
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

                <Form.Item
                  name="waiverRequiredBeforeCheckout"
                  valuePropName="checked"
                >
                  <Checkbox>Waiver required before checkout</Checkbox>
                </Form.Item>

                <Form.Item label="Guest cancellation policy">
                  <Form.Item
                    name="cancellationMode"
                    noStyle
                  >
                    <Radio.Group>
                      <Radio value="always">Always refundable</Radio>
                      <Radio value="never">Never refundable</Radio>
                      <Radio value="hours">
                        No cancellation within{" "}
                        <Form.Item
                          name="cancellationHours"
                          noStyle
                        >
                          <InputNumber
                            min={0}
                            style={{ width: 80, margin: "0 4px" }}
                          />
                        </Form.Item>
                        hours
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </Form.Item>
              </Form>
            </Card>

            <Card style={{ borderRadius: 12 }} title="Guest Interface Options">
              <Form
                form={form}
                layout="vertical"
                initialValues={activity}
                onFinish={handleFinish}
              >
                <Form.Item label="Activity URL" name={["guestOptions", "url"]}>
                  <Input placeholder="https://..." />
                </Form.Item>

                <Form.Item label="Open URL" name={["guestOptions", "openUrlMode"]}>
                  <Radio.Group>
                    <Radio value="current">Current window</Radio>
                    <Radio value="new-tab">New tab</Radio>
                    <Radio value="new-window">New window</Radio>
                  </Radio.Group>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={["guestOptions", "hidePrice"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Hide price</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "hidePriceFromDetail"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Hide price from detail</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "hideMaxGuests"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Hide max guests</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "hideCalendarInListing"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Hide calendar in listing</Checkbox>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      name={["guestOptions", "activateDeeplinkShare"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Activate deeplink share</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "displayGuestRequests"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Display guest requests</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "displayStartTimeOnly"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Display start time only</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "hideBookDateInDetail"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Hide book date in detail</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={["guestOptions", "displayLicensePlate"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Display license plate</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={["guestOptions", "displayETA"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Display ETA</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={["guestOptions", "displayETD"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Display ETD</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            <Card style={{ borderRadius: 12 }} title="Booking Options">
              <Form
                form={form}
                layout="vertical"
                initialValues={activity}
                onFinish={handleFinish}
              >
                <Form.Item
                  name={["bookingOptions", "blockBooking"]}
                  valuePropName="checked"
                >
                  <Checkbox>Block booking</Checkbox>
                </Form.Item>
                <Form.Item
                  name={["bookingOptions", "sameDayOnly"]}
                  valuePropName="checked"
                >
                  <Checkbox>
                    Allow guest to book only within same selected date
                  </Checkbox>
                </Form.Item>
                <Form.Item
                  label="BCC emails"
                  name={["bookingOptions", "bccEmails"]}
                >
                  <Input placeholder="Separate with semicolon" />
                </Form.Item>
                <Form.Item
                  name={["bookingOptions", "validateInventoryEndTime"]}
                  valuePropName="checked"
                >
                  <Checkbox>Validate inventory end time</Checkbox>
                </Form.Item>
                <Form.Item
                  name={["bookingOptions", "groupBookings"]}
                  valuePropName="checked"
                >
                  <Checkbox>Allow group bookings</Checkbox>
                </Form.Item>
              </Form>
            </Card>

            <Button
              block
              icon={<DatabaseOutlined />}
              onClick={onOpenInventory}
            >
              Configure inventory
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

/* ---------- Activity List ---------- */

type ActivityListProps = {
  activities: Activity[];
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onOpenSettings: (activity: Activity) => void;
  onOpenInventory: (activity: Activity) => void;
};

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  onAdd,
  onEdit,
  onOpenSettings,
  onOpenInventory,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return activities;
    const q = search.toLowerCase();
    return activities.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [activities, search]);

  const columns: ColumnsType<Activity> = [
    {
      title: "Activity",
      dataIndex: "name",
      render: (_, a) => (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => onEdit(a)}
        >
          <div style={{ fontWeight: 500 }}>{a.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {a.category}
          </div>
        </div>
      ),
    },
    {
      title: "Image",
      dataIndex: "imageUrl",
      width: 120,
      render: (url) =>
        url ? (
          <img
            src={url}
            alt=""
            style={{ width: 80, height: 48, objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            None
          </Text>
        ),
    },
    {
      title: "Order index",
      dataIndex: "orderIndex",
      width: 120,
    },
    {
      title: "Date created",
      dataIndex: "createdAt",
      width: 160,
      render: (val: Dayjs) => val.format("MMM D, YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (val: ActivityStatus) =>
        val === "active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, a) => (
        <Space>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => onOpenSettings(a)}
          >
            Settings
          </Button>
          <Button
            type="text"
            icon={<DatabaseOutlined />}
            onClick={() => onOpenInventory(a)}
          >
            Inventory
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
          Activities
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
            Add activity
          </Button>
        </Space>
      </Space>

      <Tabs
        defaultActiveKey="list"
        items={[
          { key: "list", label: "Activity Listings" },
          { key: "backlog", label: "To Be Categorized" },
        ]}
      />

      {/* For now, just show listings table under the first tab.
          Backlog section is rendered below as simple cards. */}
      <Table<Activity>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 10 }}
      />

      <Card
        style={{ marginTop: 24, borderRadius: 12 }}
        title="To Be Categorized (backlog)"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {[
            "Capacity Name",
            "Banner Name",
            "Item Type",
            "Group URL",
            "API Endpoint",
            "Use premium add-on per guest",
            "Is Package",
            "Placeholders",
            "Includes",
            "Addons",
            "Full Menus",
            "Price Config",
            "Reservation Number",
            "Schedule",
            "Package Settings",
          ].map((item) => (
            <Card
              key={item}
              size="small"
              style={{ borderRadius: 10 }}
            >
              <Text strong>{item}</Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  To be defined and wired in a future iteration.
                </Text>
              </div>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );
};

/* ---------- Page Wrapper ---------- */

const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      ...createEmptyActivity(),
      id: "act1",
      name: "Sunset Catamaran Cruise",
      category: "boat",
      orderIndex: 1,
      sortOrder: 1,
      createdAt: dayjs().subtract(5, "days"),
    },
  ]);

  const [inventoryByActivity, setInventoryByActivity] = useState<
    Record<string, ActivityInventorySlot[]>
  >({
    act1: [createSampleSlot("act1")],
  });

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [inventoryActivity, setInventoryActivity] = useState<Activity | null>(null);

  const handleSaveActivity = (activity: Activity) => {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === activity.id);
      if (exists) {
        return prev.map((a) => (a.id === activity.id ? activity : a));
      }
      return [...prev, activity];
    });
    setEditingActivity(null);
  };

  const handleUpdateSlots = (activityId: string, slots: ActivityInventorySlot[]) => {
    setInventoryByActivity((prev) => ({
      ...prev,
      [activityId]: slots,
    }));
  };

  if (inventoryActivity) {
    const slots = inventoryByActivity[inventoryActivity.id] || [];
    return (
      <InventoryPage
        activity={inventoryActivity}
        slots={slots}
        onUpdateSlots={(next) => handleUpdateSlots(inventoryActivity.id, next)}
        onBack={() => setInventoryActivity(null)}
      />
    );
  }

  if (editingActivity) {
    return (
      <ActivityForm
        initial={editingActivity}
        onSave={handleSaveActivity}
        onCancel={() => setEditingActivity(null)}
        onOpenInventory={() => {
          setInventoryActivity(editingActivity);
        }}
      />
    );
  }

  return (
    <ActivityList
      activities={activities}
      onAdd={() => setEditingActivity(createEmptyActivity())}
      onEdit={(a) => setEditingActivity(a)}
      onOpenSettings={(a) => setEditingActivity(a)}
      onOpenInventory={(a) => setInventoryActivity(a)}
    />
  );
};

export default ActivitiesPage;