
import React, { useMemo, useState } from "react";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

type ReportMetric = {
  key: string;
  label: string;
  count?: number;
  amount?: number;
  note?: string;
  status?: "positive" | "warning" | "danger" | "neutral";
};

type SalesRow = {
  key: string;
  category: string;
  count?: number;
  amount?: number;
  group: "Services" | "Taxes" | "Charges" | "Packages";
};

const money = (value?: number) =>
  typeof value === "number"
    ? value.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "—";

const number = (value?: number) =>
  typeof value === "number" ? value.toLocaleString("en-US") : "—";

const appointmentMetrics: ReportMetric[] = [
  { key: "paid", label: "Paid / Complete", count: 41, status: "positive" },
  { key: "unpaid", label: "Unpaid", count: 25, status: "warning" },
  { key: "cancelled", label: "Cancelled / No Show", count: 16, status: "danger" },
];

const customerMetrics: ReportMetric[] = [
  { key: "local", label: "Local Guest", count: 14 },
  { key: "hotel", label: "Main Hotel Guest", count: 5 },
  { key: "online", label: "Online Client", count: 4 },
  { key: "members", label: "L_Members", count: 1 },
  { key: "staff", label: "Staff", count: 1 },
  { key: "unidentified", label: "Unidentified", count: 1 },
];

const sourceMetrics: ReportMetric[] = [
  { key: "internal", label: "Internal", count: 71 },
  { key: "online", label: "Online", count: 11 },
];

const salesRows: SalesRow[] = [
  { key: "service", category: "Service", count: 47, amount: 10170.92, group: "Services" },
  { key: "products", category: "Products", count: 6, amount: 2117.5, group: "Services" },
  { key: "gift-certificates", category: "Gift Certificates", count: 2, amount: 725, group: "Services" },
  { key: "membership-dues", category: "Membership Dues", count: 2, amount: 318, group: "Services" },
  { key: "membership-initiation", category: "Membership Initiation Fee", count: 1, amount: 0, group: "Services" },
  { key: "series", category: "Series", group: "Services" },
  { key: "cancellation", category: "Cancellation / No Show Fee", group: "Services" },
  { key: "credit", category: "Credit Account Charges", group: "Services" },
  { key: "gift-card-refills", category: "Gift Card Refills", group: "Services" },
  { key: "contract-fees", category: "Contract Fees", group: "Services" },
  { key: "special-free", category: "Special Free Items", group: "Services" },
  { key: "shared-services", category: "Shared Services", group: "Services" },
  { key: "freeze-fees", category: "Membership Freeze Fees", group: "Services" },
  { key: "adhocs", category: "Adhocs", group: "Services" },
  { key: "sales-tax-service", category: "Sales Tax - Service", amount: 454.74, group: "Taxes" },
  { key: "sales-tax-retail", category: "Sales Tax - Retail", amount: 187.93, group: "Taxes" },
  { key: "service-charge-tax", category: "Service Charge Tax", amount: 0, group: "Taxes" },
  { key: "service-charge", category: "Service Charge", amount: 2559.99, group: "Charges" },
  { key: "tips", category: "Tips", amount: 0, group: "Charges" },
  { key: "package", category: "Package", count: 0, amount: 0, group: "Packages" },
];

const summaryCards = [
  {
    key: "totalSales",
    label: "Total Sales",
    value: 16534.08,
    formatter: money,
    icon: <DollarOutlined />,
    note: "Orders, service, retail, tax and charges",
  },
  {
    key: "orders",
    label: "Orders",
    value: 29,
    formatter: number,
    icon: <ShoppingOutlined />,
    note: "Average ticket: $547.98",
  },
  {
    key: "appointments",
    label: "Appointments",
    value: 82,
    formatter: number,
    icon: <CalendarOutlined />,
    note: "41 paid / complete · 25 unpaid",
  },
  {
    key: "customers",
    label: "Customers",
    value: 26,
    formatter: number,
    icon: <TeamOutlined />,
    note: "17 new · 9 returning",
  },
];

export default function DailyReportPage() {
  const [view, setView] = useState<"overview" | "details">("overview");

  const salesColumns: ColumnsType<SalesRow> = useMemo(
    () => [
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        render: (value: string, record) => (
          <Space>
            <span>{value}</span>
            {record.amount === 0 && <Tag>None</Tag>}
          </Space>
        ),
      },
      {
        title: "Type",
        dataIndex: "group",
        key: "group",
        width: 130,
        render: (value: SalesRow["group"]) => <Tag>{value}</Tag>,
      },
      {
        title: "Count",
        dataIndex: "count",
        key: "count",
        width: 110,
        align: "right",
        render: number,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        width: 140,
        align: "right",
        render: (value?: number) => <Text strong={typeof value === "number"}>{money(value)}</Text>,
      },
    ],
    [],
  );

  const appointmentTotal = appointmentMetrics.reduce((sum, item) => sum + (item.count ?? 0), 0);
  const customerTotal = customerMetrics.reduce((sum, item) => sum + (item.count ?? 0), 0);
  const sourceTotal = sourceMetrics.reduce((sum, item) => sum + (item.count ?? 0), 0);

  const servicesSubtotal = 13331.42;
  const taxesSubtotal = 642.67;
  const chargesSubtotal = 2559.99;
  const remainingBalance = -241.32;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Text type="secondary">Daily Report</Text>
            <Title level={2} className="!mb-1">
              Spa Performance Summary
            </Title>
            <Space wrap>
              <Tag icon={<CalendarOutlined />} color="purple">
                May 3, 2026 - May 9, 2026
              </Tag>
              <Tag>Soluna Spa Nashville</Tag>
              <Tag>Generated today</Tag>
            </Space>
          </div>

          <Space wrap align="center">
            <RangePicker defaultValue={[dayjs("2026-05-03"), dayjs("2026-05-09")]} />
            <Segmented
              value={view}
              onChange={(value) => setView(value as "overview" | "details")}
              options={[
                { label: "Overview", value: "overview" },
                { label: "Details", value: "details" },
              ]}
            />
            <Button icon={<ReloadOutlined />}>Refresh</Button>
            <Button icon={<PrinterOutlined />}>Print</Button>
            <Button type="primary" icon={<DownloadOutlined />}>
              Export
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          {summaryCards.map((card) => (
            <Col xs={24} sm={12} xl={6} key={card.key}>
              <Card className="h-full" bodyStyle={{ padding: 20 }}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg text-purple-700">
                    {card.icon}
                  </div>
                  <Text type="secondary" className="text-xs uppercase tracking-wide">
                    Quick View
                  </Text>
                </div>
                <Statistic title={card.label} value={card.value} formatter={(value) => card.formatter(Number(value))} />
                <Text type="secondary" className="block pt-2 text-xs">
                  {card.note}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={16} className="w-full">
              <Card title="Appointments" extra={<Text strong>{appointmentTotal}</Text>}>
                <MetricList items={appointmentMetrics} />
                <Divider />
                <Row gutter={12}>
                  <Col span={12}>
                    <Statistic title="Scheduled" value={29} prefix={<CheckCircleOutlined />} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Unpaid Appts" value={25} prefix={<CloseCircleOutlined />} />
                  </Col>
                </Row>
              </Card>

              <Card title="Booking Source" extra={<Text strong>{sourceTotal}</Text>}>
                <MetricList items={sourceMetrics} />
              </Card>

              <Card title="Customers" extra={<Text strong>{customerTotal}</Text>}>
                <MetricList items={customerMetrics} />
                <Divider />
                <Row gutter={12}>
                  <Col span={12}>
                    <Statistic title="New" value={17} prefix={<UserOutlined />} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Return" value={9} prefix={<UserOutlined />} />
                  </Col>
                </Row>
              </Card>
            </Space>
          </Col>

          <Col xs={24} xl={16}>
            <Space direction="vertical" size={16} className="w-full">
              <Card title="Revenue Snapshot">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <MiniTotal label="Orders" value="29" subValue="$16,534.08" />
                  </Col>
                  <Col xs={24} md={8}>
                    <MiniTotal label="Average Ticket" value="$547.98" subValue="Across completed orders" />
                  </Col>
                  <Col xs={24} md={8}>
                    <MiniTotal label="Remaining Balance" value="($241.32)" subValue="2 open balances" danger />
                  </Col>
                </Row>
              </Card>

              <Card
                title="Service & Retail Sales"
                extra={
                  <Space split={<Divider type="vertical" />}>
                    <Text>Service: {money(10170.92)}</Text>
                    <Text>Retail: {money(2117.5)}</Text>
                    <Text strong>Total: {money(16534.08)}</Text>
                  </Space>
                }
              >
                {view === "overview" ? (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <BreakdownCard title="Services & Retail" amount={servicesSubtotal} rows={["Service", "Products", "Gift Certificates", "Memberships"]} />
                    </Col>
                    <Col xs={24} md={8}>
                      <BreakdownCard title="Taxes" amount={taxesSubtotal} rows={["Sales Tax - Service", "Sales Tax - Retail", "Service Charge Tax"]} />
                    </Col>
                    <Col xs={24} md={8}>
                      <BreakdownCard title="Charges" amount={chargesSubtotal} rows={["Service Charge", "Tips"]} />
                    </Col>
                  </Row>
                ) : (
                  <Table
                    columns={salesColumns}
                    dataSource={salesRows}
                    pagination={false}
                    size="middle"
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3}>
                            <Text strong>Total Sales</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right">
                            <Text strong>{money(16534.08)}</Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}

function MetricList({ items }: { items: ReportMetric[] }) {
  const colorMap: Record<NonNullable<ReportMetric["status"]>, string> = {
    positive: "green",
    warning: "gold",
    danger: "red",
    neutral: "default",
  };

  return (
    <Space direction="vertical" size={10} className="w-full">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <Space>
            {item.status && <Tag color={colorMap[item.status]}>{item.status}</Tag>}
            <Text>{item.label}</Text>
          </Space>
          <Text strong>{number(item.count)}</Text>
        </div>
      ))}
    </Space>
  );
}

function MiniTotal({ label, value, subValue, danger }: { label: string; value: string; subValue: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <Text type="secondary">{label}</Text>
      <div className={`pt-1 text-2xl font-semibold ${danger ? "text-red-600" : "text-gray-900"}`}>{value}</div>
      <Text type="secondary" className="text-xs">
        {subValue}
      </Text>
    </div>
  );
}

function BreakdownCard({ title, amount, rows }: { title: string; amount: number; rows: string[] }) {
  return (
    <div className="h-full rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Text strong>{title}</Text>
        <Text strong>{money(amount)}</Text>
      </div>
      <Space direction="vertical" size={6} className="w-full">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-between text-sm">
            <Text type="secondary">{row}</Text>
            <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
          </div>
        ))}
      </Space>
    </div>
  );
}