import SpaServicesPage from "./SpaServicesPage";
import {
  MenuOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  GlobalOutlined,
  MailOutlined,
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  message,
  Layout,
  Avatar,
  Menu,
  Dropdown,
  Card,
  Divider,
  List,
  Typography,
  Tooltip,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Table } from "antd";
import BookingConsolePage from "./BookingConsolePage";
import Calendar, { type Provider, type Appt } from "./Calendar"; // Calendar re-exports types
import ClientDirectoryPage, { type Client } from "./ClientDirectoryPage";
import ClientProfilePage, { type AppointmentRow, type PurchaseRow } from "./ClientProfilePage";



// Pro Components (includes ProTable types/comp)
import {
  ProTable,
  type ProColumns,
  type ActionType,
  type ColumnsState,
} from "@ant-design/pro-components";

const { Sider, Content } = Layout;



type ProductKey =
  | "control"
  | "pool"
  | "activities"
  | "compendium"
  | "fnb"
  | "restaurant"
  | "spa";

type AppHeaderProps = {
  collapsed: boolean;
  onToggle: () => void;
  product: ProductKey;
  onSwitchModule?: (key: ProductKey) => void;
  spa?: "nashville" | "tallahassee" | "nyc";
  onChangeSpa?: (val: "nashville" | "tallahassee" | "nyc") => void;
};


const bookingURL   = "https://www.realtimereservation.com/wp-content/uploads/2025/08/calendar.png";
const staffURL     = "https://www.realtimereservation.com/wp-content/uploads/2025/08/staff.png";
const clientsURL   = "https://www.realtimereservation.com/wp-content/uploads/2025/08/clients.png";
const reportingURL = "https://www.realtimereservation.com/wp-content/uploads/2025/08/reporting.png";
const settingsURL  = "https://www.realtimereservation.com/wp-content/uploads/2025/08/settings.png";
const resourcesURL = "https://www.realtimereservation.com/wp-content/uploads/2025/08/resources.png";
const retailURL    = "https://www.realtimereservation.com/wp-content/uploads/2025/08/retail.png";


/* ----------------------- Header ----------------------- */
function AppHeader({ collapsed, onToggle, product, onSwitchModule, spa = "nashville", onChangeSpa }: AppHeaderProps) {
  const { Text } = Typography;
  const modules = [
    { key: "control",   title: "Control Center",      desc: "Admin settings and dashboard",       icon: "https://www.realtimereservation.com/wp-content/uploads/2025/08/speedometer.gif" },
    { key: "pool",      title: "Pool & Beach",        desc: "Settings, controls and dashboard",   icon: "https://www.realtimereservation.com/wp-content/uploads/2025/07/sun-umbrella-1.gif" },
    { key: "activities",title: "Activities",          desc: "Settings, controls and dashboard",   icon: "https://www.realtimereservation.com/wp-content/uploads/2025/07/canoe.gif" },
    { key: "compendium",title: "Digital Compendium",  desc: "Settings, controls and dashboard",   icon: "https://www.realtimereservation.com/wp-content/uploads/2025/07/ebook.gif" },
    { key: "fnb",       title: "Food & Beverage",     desc: "Settings, controls and dashboard",   icon: "https://www.realtimereservation.com/wp-content/uploads/2025/07/dinner-1.gif" },
    { key: "restaurant",title: "Restaurant",          desc: "Settings, controls and dashboard",   icon: "https://www.realtimereservation.com/wp-content/uploads/2025/07/restaurant.gif" },
    { key: "spa",       title: "Spa & Wellness",      desc: "Settings, controls and dashboard",   icon: "https://www.realtimereservation.com/wp-content/uploads/2025/08/face-massage.gif" },
  ];
const currentUser = {
  name: "Willie Nelson",
  email: "willienelson@email.com",
  avatar: "https://i.pinimg.com/280x280_RS/5e/ce/4d/5ece4dd6dd24e45f800fadf9e1daf080.jpg", // 👈 your image URL
};
  const overlay = (
    <Card
      style={{ width: 340, borderRadius: 12 }}
      bodyStyle={{ padding: 16 }}
      onClick={(e) => e.stopPropagation()} // keep dropdown open when clicking inside
    >
      {/* Profile */}
     
     
      <div className="flex items-center gap-3">
       <Avatar src={currentUser.avatar} size={48} />
        <div className="min-w-0">
          <div className="font-semibold text-[16px] leading-5">{currentUser.name}</div>
          <div className="text-gray-500 text-[12px]">Admin Level 2</div>
          <div className="text-gray-600 text-[12px] flex items-center gap-1">
            <MailOutlined /> {currentUser.email}
          </div>
        </div>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {/* Module list */}
      <List
        itemLayout="horizontal"
        dataSource={modules}
        split={false}
        renderItem={(m, idx) => (
          <List.Item
            key={m.key}
            style={{
              padding: "8px 8px",
              borderRadius: 8,
              background: m.key === product ? "#f5f3ff" : undefined, // highlight the active product
              cursor: "pointer",
            }}
            onClick={() => {
              onSwitchModule?.(m.key as ProductKey);
              message.success(`Switched to ${m.title}`);
            }}
          >
            <Space align="start">
              <img
                src={m.icon}
                alt=""
                width={28}
                height={28}
                style={{ borderRadius: 6, objectFit: "cover" }}
              />
              <div>
                <div className="font-medium leading-5">{m.title}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {m.desc}
                </Text>
              </div>
            </Space>
          </List.Item>
        )}
      />

      <Button
        block
        size="large"
        type="primary"
        style={{ marginTop: 12, borderRadius: 8 }}
        onClick={() => message.info("Logged out")}
      >
        Log Out
      </Button>
    </Card>
  );

  return (
    <header className="grid grid-cols-3 items-center px-4 py-2 bg-white border-b border-gray-200">
      {/* Left: hamburger/back */}
      <div className="flex items-center">
        <Tooltip title={collapsed ? "Open menu" : "Close menu"} mouseEnterDelay={0.2}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Open menu" : "Close menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white hover:bg-gray-50 hover:shadow focus:outline-none border border-transparent transition-shadow"
          >
            {collapsed ? (
              <MenuOutlined style={{ fontSize: 18 }} />
            ) : (
              <ArrowLeftOutlined style={{ fontSize: 18 }} />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Center: logo (stays centered regardless of left/right) */}
      <div className="justify-self-center">
        <img src="https://www.realtimereservation.com/wp-content/uploads/2025/08/Soluna-Logo-FauxHotel.svg" className="h-8" alt="Logo" />
      </div>

      {/* Right: user dropdown */}
      {/* Right: location select + user dropdown */}
<div className="justify-self-end flex items-center gap-3">
  <Select
    value={spa}
    onChange={(val) => onChangeSpa?.(val as any)}
    style={{ width: 260 }}
    size="middle"
    options={[
      { label: "Soluna Spa Nashville", value: "nashville" },
      { label: "Soluna Spa Tallahassee", value: "tallahassee" },
      { label: "Soluna Spa New York City", value: "nyc" },
    ]}
    suffixIcon={<EnvironmentOutlined />}
    // keep popup inside the header so it doesn't get clipped
    getPopupContainer={(node) => node.parentElement as HTMLElement}
    placeholder="Select location"
  />

  <Dropdown trigger={["click"]} placement="bottomRight" dropdownRender={() => overlay}>
    <div className="cursor-pointer">
      <Avatar size="default" src={currentUser.avatar} />
    </div>
  </Dropdown>
</div>
    </header>
  );
}



/* ------------------- Types & Mock Data ------------------- */

type Row = {
  id: string;
  state: string;
  category: string;
  totalSales: number;
  orders: number;
  lastOrderDate: string; // ISO (YYYY-MM-DD)
};




type PresetKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "ytd"
  | "past30"
  | "past90"
  | "allTime";

type NumberRange = { min?: number; max?: number };
type DateRange = { start?: Dayjs; end?: Dayjs; noEnd?: boolean; preset?: PresetKey };

type AggOp = "none" | "sum" | "avg" | "min" | "max" | "count";
type Aggregations = Record<string, AggOp>;   // columnKey -> op
type GroupBy = string[];                     // ordered list (we’ll respect this order)

const NUMERIC_COLS = ["totalSales", "orders"];          // numeric-only
const GROUPABLE_COLS = ["state", "category"];           // text/date etc. you allow grouping on

type FiltersState = {
  state?: string[];
  category?: string[];
  totalSales?: NumberRange;
  orders?: NumberRange;
  lastOrderDate?: DateRange;
};

type SorterState =
  | {
      field?: string;
      order?: "ascend" | "descend" | null;
    }
  | undefined;

const STATES = ["California", "Texas", "New York", "Florida", "Illinois", "Arizona"];
const CATEGORIES = ["Electronics", "Apparel", "Home", "Beauty", "Sports", "Grocery"];

const mockRows: Row[] = Array.from({ length: 120 }).map((_, i) => {
  const state = STATES[i % STATES.length];
  const category = CATEGORIES[i % CATEGORIES.length];
  const totalSales = Math.floor(10000 + Math.random() * 120000);
  const orders = Math.floor(30 + Math.random() * 900);
  const date = dayjs().subtract(Math.floor(Math.random() * 120), "day");
  return {
    id: String(i + 1),
    state,
    category,
    totalSales,
    orders,
    lastOrderDate: date.format("YYYY-MM-DD"),
  };
});

type GroupRow = Row & {
  __group?: boolean;
  __groupKey?: string;  // concatenated key of group values
  children?: Row[];
};


/* ----------------------- Helpers ----------------------- */
// AntD column filter API expects React.Key[]; pack objects to strings.
const packKey = (o: unknown): React.Key => JSON.stringify(o);
const unpackNumberRange = (k?: React.Key): NumberRange | undefined =>
  !k ? undefined : (JSON.parse(String(k)) as NumberRange);

const unpackDateRange = (k?: React.Key): DateRange | undefined => {
  if (!k) return undefined;
  const parsed = JSON.parse(String(k)) as { start: string | null; end: string | null; noEnd?: boolean; preset?: PresetKey | null };
  return {
    start: parsed.start ? dayjs(parsed.start) : undefined,
    end: parsed.end ? dayjs(parsed.end) : undefined,
    noEnd: !!parsed.noEnd,
    preset: parsed.preset ?? undefined,
  };
};
// Maps a preset key to a concrete date range (uses locale week start)
const presetToRange = (key: PresetKey, now = dayjs()): { start?: Dayjs; end?: Dayjs; noEnd?: boolean } => {
  switch (key) {
    case "today":
      return { start: now.startOf("day"), end: now.endOf("day"), noEnd: false };
    case "yesterday": {
      const y = now.subtract(1, "day");
      return { start: y.startOf("day"), end: y.endOf("day"), noEnd: false };
    }
    case "thisWeek":
      return { start: now.startOf("week"), end: now.endOf("week"), noEnd: false };
    case "lastWeek": {
      const w = now.subtract(1, "week");
      return { start: w.startOf("week"), end: w.endOf("week"), noEnd: false };
    }
    case "thisMonth":
      return { start: now.startOf("month"), end: now.endOf("month"), noEnd: false };
    case "lastMonth": {
      const m = now.subtract(1, "month");
      return { start: m.startOf("month"), end: m.endOf("month"), noEnd: false };
    }
    case "ytd":
      return { start: now.startOf("year"), end: now.endOf("day"), noEnd: false };
    case "past30":
      return { start: now.subtract(30, "day").startOf("day"), end: now.endOf("day"), noEnd: false };
    case "past90":
      return { start: now.subtract(90, "day").startOf("day"), end: now.endOf("day"), noEnd: false };
    case "allTime":
      return { start: undefined, end: undefined, noEnd: true };
  }
};

const numericInRange = (val: number, range?: NumberRange) => {
  if (!range) return true;
  if (range.min !== undefined && val < range.min) return false;
  if (range.max !== undefined && val > range.max) return false;
  return true;
};

const dateInRange = (d: Dayjs, range?: DateRange) => {
  if (!range || (!range.start && !range.end)) return true;
  if (range.start && d.isBefore(range.start, "day")) return false;
  if (!range.noEnd && range.end && d.isAfter(range.end, "day")) return false;
  return true;
};

const aggregateRows = (rows: Row[], aggs: Aggregations) => {
  const base: Partial<Row> = {};
  NUMERIC_COLS.forEach((key) => {
    const op = aggs[key];
    if (!op || op === "none") return;

    const values = rows.map((r) => r[key as keyof Row] as number);

    switch (op) {
      case "sum":
        base[key as keyof Row] = values.reduce((a, b) => a + b, 0) as any;
        break;
      case "avg":
        base[key as keyof Row] = (values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)) as any;
        break;
      case "min":
        base[key as keyof Row] = Math.min(...values) as any;
        break;
      case "max":
        base[key as keyof Row] = Math.max(...values) as any;
        break;
      case "count":
        base[key as keyof Row] = values.length as any;
        break;
    }
  });
  return base;
};


/* ------------- Report Builder (advanced table) ------------- */
function ReportBuilderTable() {
  // ----- Saved Reports (mock data & view state) -----
  type SavedReport = {
    id: string;
    name: string;
    group: "Sales" | "Finance" | "Operations";
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    dataSource: string;
    tags: string[];
  };

  const SAVED_REPORTS: SavedReport[] = Array.from({ length: 12 }).map((_, i) => {
    const groups: SavedReport["group"][] = ["Sales", "Finance", "Operations"];
    const group = groups[i % groups.length];
    const names = ["Revenue by State", "Orders by Category", "Daily Bookings", "High-Value Customers"];
    const name = names[i % names.length] + ` #${i + 1}`;
    const createdAt = dayjs().subtract(30 + i, "day").format("YYYY-MM-DD");
    const updatedAt = dayjs().subtract(5 + (i % 10), "day").format("YYYY-MM-DD");
    const dataSource = ["ERP", "POS", "Bookings"][i % 3];
    const who = ["Alex", "Sam", "Jordan", "Taylor"][i % 4];
    const who2 = ["Riley", "Casey", "Jamie", "Morgan"][i % 4];
    const tagsPool = [
      "Grouping: state",
      "Grouping: category",
      "orders=sum",
      "totalSales=avg",
      "lastOrderDate: 2025-05-01 → No end",
      "orders: 50–500",
      "state: CA, TX",
      "category: Electronics, Home",
    ];
    const tags = tagsPool.slice(0, 3 + (i % 5));
    return {
      id: String(i + 1),
      name,
      group,
      createdAt,
      createdBy: who,
      updatedAt,
      updatedBy: who2,
      dataSource,
      tags,
    };
  });

  const [reportView, setReportView] = useState<"cards" | "list">("cards");
  const [reportGroup, setReportGroup] = useState<"all" | "Sales" | "Finance" | "Operations">("all");

  const groupColor = (g: SavedReport["group"]) => (g === "Sales" ? "purple" : g === "Finance" ? "geekblue" : "cyan");

  const filteredReports = useMemo(() => {
    return reportGroup === "all" ? SAVED_REPORTS : SAVED_REPORTS.filter((r) => r.group === reportGroup);
  }, [reportGroup]);

  const MAX_TAGS = 6;

  const actionRef = useRef<ActionType | null>(null);

  // Aggregation & Grouping state (must be before columns useMemo)
  const [aggOpen, setAggOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [aggs, setAggs] = useState<Aggregations>({});
  const [groupBy, setGroupBy] = useState<GroupBy>([]);


  // Controlled filters / sorter / columnsState
  const [filters, setFilters] = useState<FiltersState>({});
  const [columnsStateMap, setColumnsStateMap] = useState<Record<string, ColumnsState>>({});
  const [sorter, setSorter] = useState<SorterState>();
  const [tableKey, setTableKey] = useState(0);

  // Dynamic list demo (async)
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
  const loadCategories = async () => {
    await new Promise((r) => setTimeout(r, 250));
    setCategoryOptions(CATEGORIES.map((c) => ({ label: c, value: c })));
  };

  const filteredData: Row[] = useMemo(() => {
    return mockRows.filter((r) => {
      if (filters.state && filters.state.length > 0 && !filters.state.includes(r.state)) return false;
      if (filters.category && filters.category.length > 0 && !filters.category.includes(r.category)) return false;
      if (!numericInRange(r.totalSales, filters.totalSales)) return false;
      if (!numericInRange(r.orders, filters.orders)) return false;
      if (!dateInRange(dayjs(r.lastOrderDate, "YYYY-MM-DD"), filters.lastOrderDate)) return false;
      return true;
    });
  }, [filters]);

  // Build grouped data (depends on filters, groupBy, and aggs)
  const groupedData: GroupRow[] = useMemo(() => {
    if (groupBy.length === 0) return filteredData as GroupRow[];

    const by = groupBy;
    const map = new Map<string, Row[]>();

    filteredData.forEach((r) => {
      const key = by.map((k) => (r as any)[k]).join("||");
      const list = map.get(key);
      if (list) list.push(r);
      else map.set(key, [r]);
    });

    const result: GroupRow[] = [];
    map.forEach((rows, key) => {
      const agg = aggregateRows(rows, aggs);
      result.push({
        id: `group-${key}`,
        state: rows[0].state,
        category: rows[0].category,
        totalSales: (agg.totalSales as number) ?? 0,
        orders: (agg.orders as number) ?? 0,
        lastOrderDate: rows[0].lastOrderDate,
        __group: true,
        __groupKey: key,
        children: rows,
      });
    });

    result.sort((a, b) => (String(a.__groupKey) > String(b.__groupKey) ? 1 : -1));
    return result;
  }, [filteredData, groupBy, aggs]);

  const columns = useMemo<ProColumns<Row>[]>(() => {
    const cols: ProColumns<Row>[] = [
      {
        title: "State",
        dataIndex: "state",
        key: "state",
        fixed: "left",
        width: 160,
        filters: STATES.map((s) => ({ text: s, value: s })),
        filterSearch: true,
        filteredValue: (filters.state as React.Key[] | undefined) ?? null,
        onFilter: () => true,
        sorter: (a, b) => a.state.localeCompare(b.state),
        render: (_, record: any) => {
    if (record.__group) {
      // pretty group label using chosen groupBy columns
      const parts = record.__groupKey.split("||");
      const label = groupBy.map((k, i) => `${k}: ${parts[i]}`).join(" · ");
      return <span className="font-semibold">{label}</span>;
    }
    return record.state;
  },
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        width: 180,
        sorter: (a, b) => a.category.localeCompare(b.category),
        filteredValue: (filters.category as React.Key[] | undefined) ?? null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
          const current = (selectedKeys as React.Key[] as string[]) ?? (filters.category ?? []);
          return (
            <div
              className="w-64 p-3"
              onKeyDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", flexDirection: "column", maxHeight: 360 }}
            >
              {/* Scrollable content area */}
              <div style={{ flex: 1, overflow: "auto" }}>
                <Space direction="vertical" className="w-full">
                  <Select
                    showSearch
                    mode="multiple"
                    allowClear
                    placeholder="Select categories"
                    options={categoryOptions}
                    onDropdownVisibleChange={(open) => {
                      if (open && categoryOptions.length === 0) loadCategories();
                    }}
                    value={current}
                    onChange={(vals) => setSelectedKeys(vals as unknown as React.Key[])}
                    style={{ width: "100%" }}
                    getPopupContainer={(triggerNode) =>
                      (triggerNode.closest('.ant-table-filter-dropdown') as HTMLElement) ||
                      (triggerNode.parentElement as HTMLElement)
                    }
                    maxTagCount="responsive"
                    virtual={false}
                    placement="topRight"
                  />
                </Space>
              </div>

              {/* Sticky footer with actions */}
              <div className="pt-2 mt-2 border-t border-gray-200 bg-white" style={{ position: "sticky", bottom: 0 }}>
                <Space className="justify-end w-full">
                  <Button
                    onClick={() => {
                      clearFilters?.();
                      setFilters((f) => ({ ...f, category: undefined }));
                      confirm();
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      const sel = (selectedKeys as React.Key[] | undefined) ?? [];
                      const arr = sel.map((k) => String(k));
                      setFilters((f) => ({ ...f, category: arr.length ? arr : undefined }));
                      confirm();
                    }}
                  >
                    Apply
                  </Button>
                </Space>
              </div>
            </div>
          );
        },
        onFilter: () => true,
      },
      {
        title: "Total Sales",
        dataIndex: "totalSales",
        key: "totalSales",
        width: 160,
        valueType: "money",
        sorter: (a, b) => a.totalSales - b.totalSales,
        filteredValue: filters.totalSales ? [packKey(filters.totalSales)] : null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
          const current = unpackNumberRange(selectedKeys?.[0]) ?? filters.totalSales ?? {};
          return (
            <div className="p-3 w-64" onKeyDown={(e) => e.stopPropagation()}>
              <Space direction="vertical" className="w-full">
                <InputNumber
                  placeholder="Min"
                  className="w-full"
                  value={current.min}
                  onChange={(val) => {
                    const next = { ...current, min: val ?? undefined };
                    setSelectedKeys([packKey(next)]);
                  }}
                />
                <InputNumber
                  placeholder="Max"
                  className="w-full"
                  value={current.max}
                  onChange={(val) => {
                    const next = { ...current, max: val ?? undefined };
                    setSelectedKeys([packKey(next)]);
                  }}
                />
                <Space className="justify-end w-full">
                  <Button
                    onClick={() => {
                      clearFilters?.();
                      setFilters((f) => ({ ...f, totalSales: undefined }));
                      confirm();
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      const clean: NumberRange = {};
                      if (current.min !== undefined) clean.min = current.min;
                      if (current.max !== undefined) clean.max = current.max;
                      setFilters((f) => ({
                        ...f,
                        totalSales: Object.keys(clean).length ? clean : undefined,
                      }));
                      confirm();
                    }}
                  >
                    Apply
                  </Button>
                </Space>
              </Space>
            </div>
          );
        },
        onFilter: () => true,
      },
      {
        title: "Orders",
        dataIndex: "orders",
        key: "orders",
        width: 140,
        sorter: (a, b) => a.orders - b.orders,
        filteredValue: filters.orders ? [packKey(filters.orders)] : null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
          const current = unpackNumberRange(selectedKeys?.[0]) ?? filters.orders ?? {};
          return (
            <div className="p-3 w-64" onKeyDown={(e) => e.stopPropagation()}>
              <Space direction="vertical" className="w-full">
                <InputNumber
                  placeholder="Min"
                  className="w-full"
                  value={current.min}
                  onChange={(val) => {
                    const next = { ...current, min: val ?? undefined };
                    setSelectedKeys([packKey(next)]);
                  }}
                />
                <InputNumber
                  placeholder="Max"
                  className="w-full"
                  value={current.max}
                  onChange={(val) => {
                    const next = { ...current, max: val ?? undefined };
                    setSelectedKeys([packKey(next)]);
                  }}
                />
                <Space className="justify-end w-full">
                  <Button
                    onClick={() => {
                      clearFilters?.();
                      setFilters((f) => ({ ...f, orders: undefined }));
                      confirm();
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      const clean: NumberRange = {};
                      if (current.min !== undefined) clean.min = current.min;
                      if (current.max !== undefined) clean.max = current.max;
                      setFilters((f) => ({
                        ...f,
                        orders: Object.keys(clean).length ? clean : undefined,
                      }));
                      confirm();
                    }}
                  >
                    Apply
                  </Button>
                </Space>
              </Space>
            </div>
          );
        },
        onFilter: () => true,
      },
      {
        title: "Last Order Date",
        dataIndex: "lastOrderDate",
        key: "lastOrderDate",
        width: 200,
        sorter: (a, b) => dayjs(a.lastOrderDate).valueOf() - dayjs(b.lastOrderDate).valueOf(),
        filteredValue: filters.lastOrderDate
          ? [
              packKey({
                start: filters.lastOrderDate.start?.toISOString?.() ?? null,
                end: filters.lastOrderDate.noEnd
                  ? null
                  : filters.lastOrderDate.end?.toISOString?.() ?? null,
                noEnd: !!filters.lastOrderDate.noEnd,
                preset: filters.lastOrderDate.preset ?? null,
              }),
            ]
          : null,
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
          const current = unpackDateRange(selectedKeys?.[0]) ?? filters.lastOrderDate ?? {
            start: undefined,
            end: undefined,
            noEnd: false,
            preset: undefined,
          };

          const applyPack = (next: DateRange) => {
            setSelectedKeys([
              packKey({
                start: next.start?.toISOString?.() ?? null,
                end: next.noEnd ? null : next.end?.toISOString?.() ?? null,
                noEnd: !!next.noEnd,
                preset: next.preset ?? null,
              }),
            ]);
          };

          return (
            <div className="p-3 w-72" onKeyDown={(e) => e.stopPropagation()}>
              <Space direction="vertical" className="w-full">
                {/* Presets */}
                <Select
                  size="small"
                  placeholder="Quick presets"
                  value={current.preset}
                  onChange={(val) => {
                    if (!val) {
                      applyPack({ ...current, preset: undefined });
                      return;
                    }
                    const key = val as PresetKey;
                    const rng = presetToRange(key, dayjs());
                    const next: DateRange = key === "allTime"
                      ? { start: undefined, end: undefined, noEnd: true, preset: key }
                      : { ...rng, preset: key };
                    applyPack(next);
                  }}
                  options={[
                    { label: "— Custom —", value: undefined },
                    { label: "Today", value: "today" },
                    { label: "Yesterday", value: "yesterday" },
                    { label: "This Week", value: "thisWeek" },
                    { label: "Last Week", value: "lastWeek" },
                    { label: "This Month", value: "thisMonth" },
                    { label: "Last Month", value: "lastMonth" },
                    { label: "Year to Date", value: "ytd" },
                    { label: "Past 30 Days", value: "past30" },
                    { label: "Past 90 Days", value: "past90" },
                    { label: "All Time", value: "allTime" },
                  ]}
                  getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                />

                {/* Date range picker */}
                <DatePicker.RangePicker
                  className="w-full"
                  value={[
                    current.start ? dayjs(current.start) : null,
                    current.noEnd ? null : current.end ? dayjs(current.end) : null,
                  ]}
                  onChange={(vals) => {
                    const [s, e] = vals || [];
                    const next = { ...current, start: s ?? undefined, end: e ?? undefined, preset: undefined };
                    applyPack(next);
                  }}
                  allowEmpty={[false, true]}
                  placeholder={["Start date", "End date"]}
                  getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
                />

                {/* No end date */}
                <Checkbox
                  checked={!!current.noEnd}
                  onChange={(e) => {
                    const next = { ...current, noEnd: e.target.checked, preset: undefined };
                    applyPack(next);
                  }}
                >
                  No end date
                </Checkbox>

                {/* Actions */}
                <Space className="justify-end w-full">
                  <Button
                    onClick={() => {
                      clearFilters?.();
                      setFilters((f) => ({ ...f, lastOrderDate: undefined }));
                      confirm();
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      const payload: DateRange | undefined =
                        current.preset || current.start || current.end || current.noEnd ? current : undefined;
                      setFilters((f) => ({ ...f, lastOrderDate: payload }));
                      confirm();
                    }}
                  >
                    Apply
                  </Button>
                </Space>
              </Space>
            </div>
          );
        },
        onFilter: () => true,
      },
    ];
    return cols;
  }, [filters, categoryOptions, groupBy]);

  const handleTableChange = (_p: any, _f: any, sorterParam: any) => {
    const s: SorterState = sorterParam?.order
      ? { field: sorterParam.field as string, order: sorterParam.order }
      : undefined;
    setSorter(s);
  };

  const clearAll = () => {
    setFilters({});
    setSorter(undefined);
    setTableKey((k) => k + 1);
  };
  const removeFilter = (key: keyof FiltersState) => {
    setFilters((f) => ({ ...f, [key]: undefined }));
  };

  const [saveOpen, setSaveOpen] = useState<null | "save" | "saveAsNew">(null);
  const [form] = Form.useForm();

  const buildReportDefinition = (meta: { name: string; group: string; description?: string; mode: "save" | "saveAsNew" }) => {
    const def = {
      meta,
      dataSourceId: "sales-demo",
      createdAt: new Date().toISOString(),
      columnsStateMap,
      sorter,
      filters: {
        state: filters.state ?? null,
        category: filters.category ?? null,
        totalSales: filters.totalSales ?? null,
        orders: filters.orders ?? null,
        lastOrderDate: filters.lastOrderDate
          ? {
              start: filters.lastOrderDate.start?.format("YYYY-MM-DD") ?? null,
              end: filters.lastOrderDate.noEnd ? null : filters.lastOrderDate.end?.format("YYYY-MM-DD") ?? null,
              noEnd: !!filters.lastOrderDate.noEnd,
            }
          : null,
      },
    };
    return def;
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildReportDefinition({
        ...values,
        mode: saveOpen === "save" ? "save" : "saveAsNew",
      });
      console.log("Report payload:", payload);
      message.success(saveOpen === "save" ? "Report saved." : "Saved as new report.");
      setSaveOpen(null);
      form.resetFields();
    } catch {
      /* handled by antd */
    }
  };

  // ---------------- Chips (Filters, Grouping, Aggregations) ----------------
  type Chip = {
    kind: "filter" | "group" | "agg";
    key: string;              // filter field OR group/agg column key
    label: string;            // e.g., "State", "Grouping", "Aggregations"
    value: string;            // human text
  };

  const chips: Chip[] = [];

  // Filter chips
  if (filters.state?.length) chips.push({ kind: "filter", key: "state", label: "State", value: filters.state.join(", ") });
  if (filters.category?.length) chips.push({ kind: "filter", key: "category", label: "Category", value: filters.category.join(", ") });
  if (filters.totalSales && (filters.totalSales.min !== undefined || filters.totalSales.max !== undefined)) {
    chips.push({
      kind: "filter",
      key: "totalSales",
      label: "Total Sales",
      value: `${filters.totalSales.min ?? "–"} to ${filters.totalSales.max ?? "–"}`,
    });
  }
  if (filters.orders && (filters.orders.min !== undefined || filters.orders.max !== undefined)) {
    chips.push({
      kind: "filter",
      key: "orders",
      label: "Orders",
      value: `${filters.orders.min ?? "–"} to ${filters.orders.max ?? "–"}`,
    });
  }
  if (filters.lastOrderDate) {
    const lr = filters.lastOrderDate;
    if (lr.preset) {
      const labelMap: Record<PresetKey, string> = {
        today: "Today",
        yesterday: "Yesterday",
        thisWeek: "This Week",
        lastWeek: "Last Week",
        thisMonth: "This Month",
        lastMonth: "Last Month",
        ytd: "Year to Date",
        past30: "Past 30 Days",
        past90: "Past 90 Days",
        allTime: "All Time",
      };
      chips.push({ kind: "filter", key: "lastOrderDate", label: "Last Order Date", value: labelMap[lr.preset] });
    } else if (lr.start || lr.end || lr.noEnd) {
      const s = lr.start?.format("YYYY-MM-DD") ?? "—";
      const e = lr.noEnd ? "No end" : lr.end?.format("YYYY-MM-DD") ?? "—";
      chips.push({ kind: "filter", key: "lastOrderDate", label: "Last Order Date", value: `${s} → ${e}` });
    }
  }

  // Grouping chips (one per selected group column)
  groupBy.forEach((g) => {
    chips.push({ kind: "group", key: g, label: "Grouping", value: g });
  });

  // Aggregation chips (one per numeric col with an op)
  Object.entries(aggs)
    .filter(([, op]) => op && op !== "none")
    .forEach(([col, op]) => {
      chips.push({ kind: "agg", key: col, label: "Aggregations", value: `${col}=${op}` });
    });

  return (
    <div className="p-6">
      {/* Header row inside content */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Report</h1>
        {/* Header row inside content */}

  
        <div className="flex gap-2">

          <Button onClick={clearAll}>Clear All</Button>
          <Button onClick={() => setSaveOpen("save")}>Save</Button>
          <Button type="primary" onClick={() => setSaveOpen("saveAsNew")}>Save As New</Button>
        </div>
      </div>

      {/* Filters & Settings (chips with X to remove) */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 text-sm font-medium">Filters & Settings</div>

        {chips.length > 0 ? (
          <Space wrap>
            {chips.map((chip, idx) => (
              <Tag
                key={`${chip.kind}-${chip.key}-${idx}`}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  if (chip.kind === "filter") {
                    // remove just this filter
                    removeFilter(chip.key as keyof FiltersState);
                  } else if (chip.kind === "group") {
                    // remove this group column
                    setGroupBy((prev) => prev.filter((k) => k !== chip.key));
                  } else if (chip.kind === "agg") {
                    // clear this aggregation op
                    setAggs((prev) => ({ ...prev, [chip.key]: "none" }));
                  }
                }}
              >
                <span className="font-medium">{chip.label}:</span>&nbsp;{chip.value}
              </Tag>
            ))}
          </Space>
        ) : (
          <div className="text-sm text-gray-500">No active settings or filters.</div>
        )}
      </div>

      {/* Table */}
   <ProTable<GroupRow>
  key={tableKey}
  actionRef={actionRef as any}
  rowKey="id"
  search={false}
  headerTitle={
    // LEFT side of the toolbar
    <Space>
      <Button onClick={() => setAggOpen(true)}>Aggregate</Button>
      <Button onClick={() => setGroupOpen(true)}>Grouping</Button>
    </Space>
  }

  options={{
    density: true,
    fullScreen: true,
    setting: { listsHeight: 400 }, // gear icon (column settings)
  }}
  columns={columns}
  dataSource={groupedData as GroupRow[]}
  onChange={handleTableChange}
  columnsState={{
    persistenceKey: "report-columns-v2",
    persistenceType: "localStorage",
    onChange: (map) => setColumnsStateMap(map),
  }}
  scroll={{ x: 1100 }}
  sticky
  pagination={{ pageSize: 10, showSizeChanger: true }}

  expandable={
    groupBy.length
      ? {
          defaultExpandAllRows: true,
          rowExpandable: (r) => !!(r as any).__group, // only group headers are expandable
        }
      : undefined
  }
  summary={(pageData) => {
    // If grouping is active, show aggregates in group headers only
    if (groupBy.length > 0) return null;

    // pageData here are plain rows (no groups) because grouping is off
    const rows = pageData as Row[];

    // Compute aggregates for the numeric columns only, based on selected ops
    const aggValue: Record<string, number | string | undefined> = {};
    NUMERIC_COLS.forEach((key) => {
      const op = aggs[key];
      if (!op || op === "none") return;
      const values = rows.map((r) => r[key as keyof Row] as number);

      if (values.length === 0) return;

      switch (op) {
        case "sum":
          aggValue[key] = values.reduce((a, b) => a + b, 0);
          break;
        case "avg":
          aggValue[key] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
          break;
        case "min":
          aggValue[key] = Math.min(...values);
          break;
        case "max":
          aggValue[key] = Math.max(...values);
          break;
        case "count":
          aggValue[key] = values.length;
          break;
      }
    });

    // Render a summary row aligned to whatever columns are currently visible
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          {columns.map((col, idx) => {
            // ProColumns can have dataIndex as string | string[] | undefined
            const dataKey =
              (Array.isArray(col.dataIndex) ? col.dataIndex.join(".") : (col.dataIndex as string)) ||
              (col.key as string) ||
              "";

            // First cell = label
            if (idx === 0) {
              return (
                <Table.Summary.Cell index={idx} key={`sum-${idx}`}>
                  <span className="font-semibold">Aggregations</span>
                </Table.Summary.Cell>
              );
            }

            // Show value only for numeric columns we aggregated; empty for others
            const val = aggValue[dataKey];
            return (
              <Table.Summary.Cell index={idx} key={`sum-${idx}`}>
                {val ?? ""}
              </Table.Summary.Cell>
            );
          })}
        </Table.Summary.Row>
      </Table.Summary>
    );
  }}
/>


      {/* -------- Saved Reports (demo) -------- */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Saved Reports</h2>
          <Space wrap>
            <Select
              value={reportGroup}
              onChange={(v) => setReportGroup(v as any)}
              style={{ width: 180 }}
              options={[
                { label: "Show all groups", value: "all" },
                { label: "Sales", value: "Sales" },
                { label: "Finance", value: "Finance" },
                { label: "Operations", value: "Operations" },
              ]}
            />
            <Button>Create Group</Button>
            <Button type="primary" icon={<PlusOutlined />}>New Report</Button>
            <Select
              value={reportView}
              onChange={(v) => setReportView(v as any)}
              style={{ width: 140 }}
              options={[
                { label: "Card view", value: "cards" },
                { label: "List view", value: "list" },
              ]}
            />
          </Space>
        </div>

        {reportView === "cards" ? (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={filteredReports}
            renderItem={(r) => {
              const hidden = Math.max(0, r.tags.length - MAX_TAGS);
              return (
                <List.Item key={r.id}>
                  <Card hoverable style={{ borderRadius: 10 }}>
                    <div className="flex items-center justify-between mb-2">
                      <Tag color={groupColor(r.group)}>{r.group}</Tag>
                    </div>
                    <div className="text-base font-semibold mb-2">{r.name}</div>

                    <div className="text-xs text-gray-500">
                      <div>Created: {r.createdAt} — {r.createdBy}</div>
                      <div>Modified: {r.updatedAt} — {r.updatedBy}</div>
                      <div>Data source: {r.dataSource}</div>
                    </div>

                    <Divider style={{ margin: "10px 0" }} />

                    <div className="text-xs">
                      <div className="mb-1 font-medium">Filters &amp; Settings</div>
                      <Space wrap>
                        {r.tags.slice(0, MAX_TAGS).map((t, i) => (
                          <Tag key={i}>{t}</Tag>
                        ))}
                        {hidden > 0 && <Tag>+{hidden} more</Tag>}
                      </Space>
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredReports}
            renderItem={(r) => {
              const hidden = Math.max(0, r.tags.length - MAX_TAGS);
              return (
                <List.Item key={r.id}>
                  <List.Item.Meta
                    title={
                      <div className="flex items-center gap-2">
                        <Tag color={groupColor(r.group)}>{r.group}</Tag>
                        <span className="font-medium">{r.name}</span>
                      </div>
                    }
                    description={
                      <div className="text-xs text-gray-600">
                        <div className="flex gap-6 flex-wrap">
                          <div>Created: {r.createdAt} — {r.createdBy}</div>
                          <div>Modified: {r.updatedAt} — {r.updatedBy}</div>
                          <div>Data source: {r.dataSource}</div>
                        </div>
                        <div className="mt-1">
                          <span className="font-medium mr-2">Filters &amp; Settings:</span>
                          <Space wrap>
                            {r.tags.slice(0, MAX_TAGS).map((t, i) => (
                              <Tag key={i}>{t}</Tag>
                            ))}
                            {hidden > 0 && <Tag>+{hidden} more</Tag>}
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* Grouping Modal */}
      <Modal
        title="Configure Grouping"
        open={groupOpen}
        onOk={() => setGroupOpen(false)}
        onCancel={() => setGroupOpen(false)}
      >
        <Space direction="vertical" className="w-full">
          {GROUPABLE_COLS.map((key) => {
            const checked = groupBy.includes(key);
            return (
              <Checkbox
                key={key}
                checked={checked}
                onChange={(e) => {
                  setGroupBy((prev) => (e.target.checked ? [...prev, key] : prev.filter((k) => k !== key)));
                }}
              >
                {key}
              </Checkbox>
            );
          })}
          {groupBy.length > 1 && (
            <div className="text-xs text-gray-500">Group order: {groupBy.join(" → ")}</div>
          )}
        </Space>
      </Modal>

      {/* Aggregation Modal */}
      <Modal
        title="Configure Aggregations"
        open={aggOpen}
        onOk={() => setAggOpen(false)}
        onCancel={() => setAggOpen(false)}
      >
        <Space direction="vertical" className="w-full">
          {NUMERIC_COLS.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <div className="font-medium">{key}</div>
              <Select
                value={aggs[key] ?? "none"}
                onChange={(val) => setAggs((a) => ({ ...a, [key]: val as AggOp }))}
                style={{ width: 200 }}
                options={[
                  { label: "None", value: "none" },
                  { label: "Total (Sum)", value: "sum" },
                  { label: "Average", value: "avg" },
                  { label: "Min", value: "min" },
                  { label: "Max", value: "max" },
                  { label: "Count", value: "count" },
                ]}
                getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
              />
            </div>
          ))}
        </Space>
      </Modal>

      {/* Save / Save As New */}
      <Modal
        title={saveOpen === "save" ? "Save Report" : "Save As New Report"}
        open={!!saveOpen}
        onOk={onSave}
        onCancel={() => {
          setSaveOpen(null);
          form.resetFields();
        }}
        okText={saveOpen === "save" ? "Save" : "Save As New"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Report Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Sales by State (Q1)" />
          </Form.Item>
          <Form.Item name="group" label="Group / Category" rules={[{ required: true }]}>
            <Select
              placeholder="Select a group"
              options={[
                { label: "Sales", value: "Sales" },
                { label: "Finance", value: "Finance" },
                { label: "Operations", value: "Operations" },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description for this report…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
const NavIcon = ({ src, size = 18 }: { src: string; size?: number }) => (
  <img
    src={src}
    width={size}
    height={size}
    alt=""
    style={{ display: "inline-block" , marginRight: "12px" , marginLeft: "-2px" }}
    onError={(e) => ((e.currentTarget.style.opacity = "0.35"))}
  />
);
const getNavItemsForProduct = (product: ProductKey) => {
  // Base Spa nav (what you already had)
  const spaNav = [
    {
      key: "bookingconsole",
      icon: <NavIcon src={bookingURL} />,
      label: "Booking Console",
      children: [
        { key: "console:overview", label: "Daily Overview" },
        { key: "console:calendar", label: "Calendar" },
        { key: "console:orders", label: "Orders" },
      ],
    },
    {
      key: "customers",
      icon: <NavIcon src={clientsURL} />,
      label: "Customers",
      children: [
        { key: "customers:directory", label: "Client Directory" },
        { key: "customers:communications", label: "Communications" },
      ],
    },
    {
      key: "staff",
      icon: <NavIcon src={staffURL} />,
      label: "Staff",
      children: [
        { key: "staff:directory", label: "Staff Directory" },
        { key: "staff:timecard", label: "Timecard" },
      ],
    },
    {
      key: "reporting",
      icon: <NavIcon src={reportingURL} />,
      label: "Reporting",
      children: [
        { key: "reporting:reports", label: "Reports" },
        { key: "reporting:datasources", label: "Data Sources" },
      ],
    },
    {
      key: "resources",
      icon: <NavIcon src={resourcesURL} />,
      label: "Resources",
      children: [
        { key: "resources:rooms", label: "Rooms" },
        { key: "resources:equipment", label: "Equipment" },
        { key: "resources:services", label: "Services" },
      ],
    },
    {
      key: "retail",
      icon: <NavIcon src={retailURL} />,
      label: "Retail",
      children: [
        { key: "retail:products", label: "Products" },
        { key: "retail:inventory", label: "Inventory" },
      ],
    },
    {
      key: "settings",
      icon: <NavIcon src={settingsURL} />,
      label: "Settings",
      children: [
        { key: "settings:schedule", label: "Schedule" },
        { key: "settings:theme", label: "Theme" },
        { key: "settings:calendar", label: "Calendar" },
        { key: "settings:tags", label: "Tags" },
      ],
    },
  ];

  // Simple placeholder navs for other products (dev team can expand these later)
  if (product === "control") {
    return [
      {
        key: "control:overview",
        icon: <NavIcon src={reportingURL} />,
        label: "Overview",
      },
      {
        key: "control:users",
        icon: <NavIcon src={staffURL} />,
        label: "Users & Roles",
      },
      {
        key: "control:audit",
        icon: <NavIcon src={reportingURL} />,
        label: "Audit Log",
      },
      {
        key: "control:billing",
        icon: <NavIcon src={settingsURL} />,
        label: "Billing",
      },
    ];
  }

  if (product === "pool") {
    return [
      {
        key: "pool:inventory",
        icon: <NavIcon src={resourcesURL} />,
        label: "Inventory",
      },
      {
        key: "pool:cabanas",
        icon: <NavIcon src={bookingURL} />,
        label: "Cabanas",
      },
      {
        key: "pool:reporting",
        icon: <NavIcon src={reportingURL} />,
        label: "Reporting",
      },
    ];
  }

  if (product === "activities") {
    return [
      {
        key: "activities:calendar",
        icon: <NavIcon src={bookingURL} />,
        label: "Activity Calendar",
      },
      {
        key: "activities:waivers",
        icon: <NavIcon src={resourcesURL} />,
        label: "Waivers",
      },
      {
        key: "activities:reporting",
        icon: <NavIcon src={reportingURL} />,
        label: "Reporting",
      },
    ];
  }

  if (product === "compendium") {
    return [
      {
        key: "compendium:pages",
        icon: <NavIcon src={resourcesURL} />,
        label: "Pages",
      },
      {
        key: "compendium:sections",
        icon: <NavIcon src={resourcesURL} />,
        label: "Sections",
      },
      {
        key: "compendium:analytics",
        icon: <NavIcon src={reportingURL} />,
        label: "Analytics",
      },
    ];
  }

  if (product === "fnb") {
    return [
      {
        key: "fnb:menus",
        icon: <NavIcon src={resourcesURL} />,
        label: "Menus",
      },
      {
        key: "fnb:orders",
        icon: <NavIcon src={bookingURL} />,
        label: "Orders",
      },
      {
        key: "fnb:reporting",
        icon: <NavIcon src={reportingURL} />,
        label: "Reporting",
      },
    ];
  }

  if (product === "restaurant") {
    return [
      {
        key: "restaurant:reservations",
        icon: <NavIcon src={bookingURL} />,
        label: "Reservations",
      },
      {
        key: "restaurant:floorplan",
        icon: <NavIcon src={resourcesURL} />,
        label: "Floorplan",
      },
      {
        key: "restaurant:waitlist",
        icon: <NavIcon src={clientsURL} />,
        label: "Waitlist",
      },
      {
        key: "restaurant:reporting",
        icon: <NavIcon src={reportingURL} />,
        label: "Reporting",
      },
    ];
  }

  // Default to Spa nav
  return spaNav;
};

/* --------------------- Page Layout Wrapper --------------------- */
export default function ReportTablePage() {
  const [product, setProduct] = useState<ProductKey>("spa");

  // Demo: location selection per product (all using same three options for now)
  const [locationByProduct, setLocationByProduct] = useState<
    Record<ProductKey, "nashville" | "tallahassee" | "nyc">
  >({
    spa: "nashville",
    control: "nashville",
    pool: "nashville",
    activities: "nashville",
    compendium: "nashville",
    fnb: "nashville",
    restaurant: "nashville",
  });

  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("console:overview");
  const [date] = useState(dayjs());
  const [providers] = useState<Provider[]>([
    { id: "p1", name: "Alex Rivera" },
    { id: "p2", name: "Jordan Kim" },
  ]);
  const [appts, setAppts] = useState<Appt[]>([]);

  // Customers: mock data & selection
  const [clients, setClients] = useState<Client[]>([
    { id: "c1", firstName: "Ava", lastName: "Lopez", email: "ava@example.com", gender: "female", phone: "(615) 555-1100", totalSpend: 1820, tags: { preferences: ["Deep Tissue"], vip: ["Gold"], marketing: ["SMS Opt-in"] }, notes: ["Prefers room 3", "Sensitive to eucalyptus"], address: "123 1st Ave", city: "Nashville", stateCode: "TN", birthdate: "1994-06-12" },
    { id: "c2", firstName: "Noah", lastName: "Reed", email: "noah@example.com", gender: "male", phone: "(615) 555-2299", totalSpend: 940, tags: { medical: ["Allergy: nuts"], preferences: ["Aromatherapy"], marketing: ["Email only"] }, address: "88 Market St", city: "Nashville", stateCode: "TN" },
    { id: "c3", firstName: "Sophia", lastName: "Martinez", email: "sophia@example.com", gender: "female", phone: "(615) 555-3001", totalSpend: 1200, tags: { preferences: ["Hot Stone"], vip: ["Silver"] }, notes: ["Loyal customer"], address: "45 Park Ave", city: "Nashville", stateCode: "TN", birthdate: "1990-03-15" },
    { id: "c4", firstName: "Liam", lastName: "Nguyen", email: "liam.nguyen@example.com", gender: "male", phone: "(615) 555-3002", totalSpend: 800, tags: { preferences: ["Swedish"], marketing: ["SMS Opt-in"] }, notes: ["Enjoys Saturdays"], address: "12 2nd St", city: "Nashville", stateCode: "TN", birthdate: "1989-11-22" },
    { id: "c5", firstName: "Mia", lastName: "Patel", email: "mia.patel@example.com", gender: "female", phone: "(615) 555-3003", totalSpend: 1550, tags: { vip: ["Gold"], preferences: ["Aromatherapy"] }, notes: ["Birthday in June"], address: "77 River Rd", city: "Nashville", stateCode: "TN", birthdate: "1995-06-02" },
    { id: "c6", firstName: "Oliver", lastName: "Smith", email: "oliver.smith@example.com", gender: "male", phone: "(615) 555-3004", totalSpend: 600, tags: { preferences: ["Sports Massage"] }, notes: ["Prefers morning"], address: "234 Oak St", city: "Nashville", stateCode: "TN", birthdate: "1992-09-14" },
    { id: "c7", firstName: "Isabella", lastName: "Johnson", email: "isabella.j@example.com", gender: "female", phone: "(615) 555-3005", totalSpend: 2100, tags: { vip: ["Platinum"], preferences: ["Hot Stone"] }, notes: ["VIP guest"], address: "89 Cherry Ln", city: "Nashville", stateCode: "TN", birthdate: "1987-01-30" },
    { id: "c8", firstName: "Mason", lastName: "Lee", email: "mason.lee@example.com", gender: "male", phone: "(615) 555-3006", totalSpend: 950, tags: { preferences: ["Deep Tissue"] }, notes: ["Likes room 2"], address: "101 Pine Dr", city: "Nashville", stateCode: "TN", birthdate: "1993-05-21" },
    { id: "c9", firstName: "Charlotte", lastName: "Kim", email: "charlotte.kim@example.com", gender: "female", phone: "(615) 555-3007", totalSpend: 1800, tags: { preferences: ["Aromatherapy"], vip: ["Silver"] }, notes: ["Prefers female therapists"], address: "56 Willow Ct", city: "Nashville", stateCode: "TN", birthdate: "1991-12-10" },
    { id: "c10", firstName: "Elijah", lastName: "Davis", email: "elijah.davis@example.com", gender: "male", phone: "(615) 555-3008", totalSpend: 720, tags: { marketing: ["Email only"] }, notes: ["First visit last month"], address: "33 Main St", city: "Nashville", stateCode: "TN", birthdate: "1985-07-19" },
    { id: "c11", firstName: "Amelia", lastName: "Clark", email: "amelia.clark@example.com", gender: "female", phone: "(615) 555-3009", totalSpend: 1320, tags: { preferences: ["Swedish"] }, notes: ["Allergic to lavender"], address: "11 Maple Ave", city: "Nashville", stateCode: "TN", birthdate: "1996-04-05" },
    { id: "c12", firstName: "James", lastName: "Evans", email: "james.evans@example.com", gender: "male", phone: "(615) 555-3010", totalSpend: 1040, tags: { preferences: ["Deep Tissue"], vip: ["Silver"] }, notes: ["Birthday in September"], address: "90 Sunset Blvd", city: "Nashville", stateCode: "TN", birthdate: "1990-09-09" },
    { id: "c13", firstName: "Harper", lastName: "Moore", email: "harper.moore@example.com", gender: "female", phone: "(615) 555-3011", totalSpend: 1660, tags: { marketing: ["SMS Opt-in"] }, notes: ["Prefers weekends"], address: "70 Lakeview Dr", city: "Nashville", stateCode: "TN", birthdate: "1992-02-28" },
    { id: "c14", firstName: "Benjamin", lastName: "Hernandez", email: "benjamin.h@example.com", gender: "male", phone: "(615) 555-3012", totalSpend: 880, tags: { preferences: ["Sports Massage"] }, notes: ["Wants monthly reminders"], address: "200 South St", city: "Nashville", stateCode: "TN", birthdate: "1988-10-11" },
    { id: "c15", firstName: "Evelyn", lastName: "Garcia", email: "evelyn.garcia@example.com", gender: "female", phone: "(615) 555-3013", totalSpend: 1450, tags: { vip: ["Gold"] }, notes: ["Loyalty program"], address: "123 3rd Ave", city: "Nashville", stateCode: "TN", birthdate: "1993-08-25" },
    { id: "c16", firstName: "Lucas", lastName: "Martinez", email: "lucas.martinez@example.com", gender: "male", phone: "(615) 555-3014", totalSpend: 780, tags: { preferences: ["Deep Tissue"] }, notes: ["Prefers room 1"], address: "400 Oak St", city: "Nashville", stateCode: "TN", birthdate: "1991-05-13" },
    { id: "c17", firstName: "Abigail", lastName: "Walker", email: "abigail.walker@example.com", gender: "female", phone: "(615) 555-3015", totalSpend: 1580, tags: { preferences: ["Aromatherapy"] }, notes: ["No mint scents"], address: "54 Elm St", city: "Nashville", stateCode: "TN", birthdate: "1994-11-04" },
    { id: "c18", firstName: "Henry", lastName: "Hall", email: "henry.hall@example.com", gender: "male", phone: "(615) 555-3016", totalSpend: 950, tags: { marketing: ["Email only"] }, notes: ["Prefers early appointments"], address: "312 Cedar Rd", city: "Nashville", stateCode: "TN", birthdate: "1987-03-18" },
    { id: "c19", firstName: "Ella", lastName: "Allen", email: "ella.allen@example.com", gender: "female", phone: "(615) 555-3017", totalSpend: 1690, tags: { vip: ["Silver"], preferences: ["Hot Stone"] }, notes: ["Birthday in December"], address: "99 Oakwood Dr", city: "Nashville", stateCode: "TN", birthdate: "1992-12-08" },
    { id: "c20", firstName: "Alexander", lastName: "Young", email: "alex.young@example.com", gender: "male", phone: "(615) 555-3018", totalSpend: 1050, tags: { preferences: ["Swedish"] }, notes: ["Likes room 4"], address: "222 North St", city: "Nashville", stateCode: "TN", birthdate: "1990-07-23" },
    { id: "c21", firstName: "Scarlett", lastName: "King", email: "scarlett.king@example.com", gender: "female", phone: "(615) 555-3019", totalSpend: 1880, tags: { vip: ["Gold"], preferences: ["Aromatherapy"] }, notes: ["Frequent guest"], address: "18 Birch Ln", city: "Nashville", stateCode: "TN", birthdate: "1989-05-29" },
    { id: "c22", firstName: "Jack", lastName: "Wright", email: "jack.wright@example.com", gender: "male", phone: "(615) 555-3020", totalSpend: 970, tags: { preferences: ["Deep Tissue"] }, notes: ["Allergic to nuts"], address: "77 Spruce Ct", city: "Nashville", stateCode: "TN", birthdate: "1993-10-01" },
  ]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const selectedClient = useMemo(() => clients.find((c) => c.id === selectedClientId) || clients[0], [clients, selectedClientId]);

  const appointmentsForClient = useMemo<AppointmentRow[]>(() => [
    { id: "a1", date: new Date().toISOString(), provider: "Alex Rivera", providerGender: "male", service: "Signature Massage 80m", status: "upcoming", orderNo: "ORD-10231" },
    { id: "a2", date: new Date(Date.now() - 86400000 * 5).toISOString(), provider: "Jordan Kim", providerGender: "female", service: "Facial 50m", status: "completed", orderNo: "ORD-10098" },
  ], [selectedClientId]);

  const purchasesForClient = useMemo<PurchaseRow[]>(() => [
    {
      id: "p1",
      sku: "SER-AROMA-01",
      name: "Aromatherapy Oil",
      image: undefined,
      category: "Aromatherapy",
      subcategory: "Essential Oils",
      brand: "Soluna",
      price: 24.0,
      qty: 1,
      total: 24.0,
    },
    {
      id: "p2",
      sku: "RET-LTN-02",
      name: "Hydrating Lotion",
      image: undefined,
      category: "Skincare",
      subcategory: "Lotions",
      brand: "Soluna",
      price: 24.0,
      qty: 2,
      total: 48.0,
    },
    {
      id: "p3",
      sku: "RET-MASK-01",
      name: "Revitalizing Face Mask",
      image: undefined,
      category: "Skincare",
      subcategory: "Masks",
      brand: "OceanLeaf",
      price: 18.0,
      qty: 3,
      total: 54.0,
    },
  ], [selectedClientId]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Global header with hamburger/X */}
      <AppHeader
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        product={product}
        onSwitchModule={(key) => {
          setProduct(key);
          setActiveKey("console:overview");
        }}
        spa={locationByProduct[product]}
        onChangeSpa={(val) =>
          setLocationByProduct((prev) => ({
            ...prev,
            [product]: val,
          }))
        }
      />

      {/* Everything below header */}
      <Layout>
<Sider
  width={240}
  collapsedWidth={0}
  collapsible
  collapsed={collapsed}
  trigger={null}
  breakpoint="lg"
  onBreakpoint={(broken) => {
    if (broken) setCollapsed(true);
    else setCollapsed(false);
  }}
  style={{
    background: "#fff",
    borderRight: "1px solid #f0f0f0",
    transition: "all 0.2s ease",
    padding: 0, // avoid default inner padding that can add space
  }}
>
  <div className="flex h-full flex-col">
    {/* Top: nav menu takes the available space */}
    <Menu
      mode="inline"
      theme="light"
      selectedKeys={[activeKey]}
      onClick={({ key }) => setActiveKey(String(key))}
      items={getNavItemsForProduct(product)}
      style={{ borderRight: 0, background: "#fff" }}
      className="flex-1 overflow-auto"
    />

    {/* Bottom: footer pinned */}
    {!collapsed && (
      <div className="mt-auto p-4">
  {/* Company Name */}
  <div className="font-bold text-[11px] grey">Soluna Resort & Spa</div>

  {/* Address */}
  <div className="text-[10px] mt-3">
    <EnvironmentOutlined className="mr-2" />
    <a
      href="https://maps.google.com?q=1111 Streetname Somecity Somestate 88888"
      target="_blank"
      rel="noopener noreferrer"
      className="!text-gray-500 hover:!text-gray-800 transition-colors">1111 Streetname, Somecity, ST 88888</a>
  </div>

  {/* Phone */}
  <div className="text-[10px] mt-1">
    <PhoneOutlined className="mr-2" />
    <a href="tel:5555555555" className="!text-gray-500 hover:!text-gray-800 transition-colors">(555) 555-5555</a>
  </div>

  {/* Website */}
  <div className="text-[10px] mt-1">
    <GlobalOutlined className="mr-2" />
    <a href="http://www.realtimereservation.com" className="!text-gray-500 hover:!text-gray-800 transition-colors">www.solunaresortandspa.com</a>
  </div>

  {/* Spacer */}
  <div className="mt-6 text-[9px]">
    <a href="#" className="!text-gray-500 hover:!text-gray-800 transition-colors">Terms of Use</a> |{" "}
    <a href="#" className="!text-gray-500 hover:!text-gray-800 transition-colors">Privacy & Cookie Policy</a>
  </div>

  {/* Powered by + Version */}
  <div className="flex items-end mt-10">
    <img
      src="https://www.realtimereservation.com/wp-content/uploads/2025/08/poweredbyRTR.svg"
      width="100"
      alt="Powered by RTR"
    />
    <div className="ml-auto text-[10px]">v2024.02</div>
  </div>
</div>
    )}
  </div>
</Sider>

        

       <Content className="p-6 bg-gray-50">

{activeKey === "console:overview" ? (
  <BookingConsolePage />
) : activeKey === "console:calendar" ? (
  <Calendar date={date} providers={providers} appts={appts} onChange={setAppts} />
) : activeKey === "customers:directory" ? (
  <ClientDirectoryPage
    data={clients}
    onViewProfile={(id) => { setSelectedClientId(id); setActiveKey("customers:profile"); }}
    onAddClient={() => message.info("Add Client coming soon")}
  />
) : activeKey === "customers:profile" ? (
  <ClientProfilePage
    client={selectedClient}
    appointments={appointmentsForClient}
    purchases={purchasesForClient}
    onBack={() => setActiveKey("customers:directory")}
    onUpdateClient={(next) => setClients((arr) => arr.map((c) => (c.id === next.id ? next : c)))}
  />
) : activeKey === "resources:services" ? (
  <SpaServicesPage />
) : activeKey.startsWith("reporting") ? (
  <ReportBuilderTable />
) : activeKey === "console:orders" ? (
  <div className="text-sm text-gray-500">Orders page coming soon.</div>
) : (
  <div className="text-sm text-gray-500">Select a section from the left menu.</div>
)}
</Content>
      </Layout>
    </Layout>
  );
}
