import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGetCustomerDashboardQuery } from "@/redux/api/dashboardApi";
import { formatDateTime } from "@/lib/utils";
import { Loader2, ShoppingBag, UtensilsCrossed } from "lucide-react";


const COLORS = ["#0d9488", "var(--brand)", "#b45309"];

const statusColor: Record<string, string> = {
  Completed: "text-emerald-600 bg-emerald-50",
  "In Progress": "text-amber-700 bg-amber-50",
  Cancelled: "text-red-600 bg-red-50",
};


export default function CustomerDashboard() {
  const { data, isLoading, error } = useGetCustomerDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
        <p className="mt-4 text-stone-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-stone-100 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 tracking-tight">
          Your orders and spending at a glance.
        </h1>
      </div>

      {/* Hero stat + compact stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-6 lg:p-8 text-white flex flex-col justify-between min-h-[140px]"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <span className="text-white/90 text-sm font-medium">Total spent</span>
          <p className="font-display text-3xl sm:text-4xl font-bold mt-1">{data.stats.totalSpent}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-[var(--brand)]">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Orders made</p>
            <p className="text-2xl font-bold text-stone-900">{data.stats.totalOrders}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Restaurants tried</p>
            <p className="text-2xl font-bold text-stone-900">{data.stats.restaurantsOrderedFrom}</p>
          </div>
        </div>
      </div>

      {/* Bento: chart large + pie small */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-stone-200/60 p-6">
          <h3 className="font-display font-semibold text-stone-800 mb-4">Monthly spending</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis tick={{ fill: "#78716c", fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--brand)"
                strokeWidth={2}
                dot={{ fill: "var(--brand)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-stone-50 border border-stone-200/60 p-6">
          <h3 className="font-display font-semibold text-stone-800 mb-4">Order status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.orderStatusDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.orderStatusDistribution.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart full width */}
      <div className="rounded-2xl bg-white border border-stone-200/60 p-6">
        <h3 className="font-display font-semibold text-stone-800 mb-4">Most ordered restaurants</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.favoriteRestaurants} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} />
            <YAxis tick={{ fill: "#78716c", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders: list style, no card */}
      <div>
        <h3 className="font-display font-semibold text-stone-800 mb-4">Recent orders</h3>
        <div className="rounded-2xl border border-stone-200/60 overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-stone-200/80 hover:bg-transparent bg-stone-50/80">
                <TableHead className="font-medium text-stone-600">Restaurant</TableHead>
                <TableHead className="font-medium text-stone-600">Status</TableHead>
                <TableHead className="font-medium text-stone-600">Delivery time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentOrders.map((order) => (
                <TableRow key={order.id} className="border-stone-100">
                  <TableCell className="font-medium text-stone-900">{order.restaurant}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColor[order.status] ?? "text-stone-600 bg-stone-100"
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-stone-500">{formatDateTime(order.time)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
