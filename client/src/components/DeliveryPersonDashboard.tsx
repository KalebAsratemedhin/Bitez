import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useGetDeliveryDashboardQuery } from "@/redux/api/dashboardApi";
import { Loader2, Truck, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";


const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];


export default function DeliveryPersonDashboard() {
  const { data, isLoading, error } = useGetDeliveryDashboardQuery();

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
        <p className="text-red-600 font-medium">Failed to load delivery dashboard.</p>
      </div>
    );
  }

  const completed = data.deliveryData.find((d) => d.name === "Completed")?.value ?? 0;
  const cancelled = data.deliveryData.find((d) => d.name === "Cancelled")?.value ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Your deliveries and status at a glance.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-6 lg:p-8 text-white flex flex-col justify-between min-h-[140px]"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <span className="text-white/90 text-sm font-medium">Total deliveries</span>
          <p className="font-display text-3xl sm:text-4xl font-bold mt-1">{data.totalDeliveries}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Completed</p>
            <p className="text-2xl font-bold text-stone-900">{completed}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-red-500">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Cancelled</p>
            <p className="text-2xl font-bold text-stone-900">{cancelled}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-stone-50 border border-stone-200/60 p-6">
          <h3 className="font-display font-semibold text-stone-800 mb-4">Delivery status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.deliveryData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                label
              >
                {data.deliveryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="font-display font-semibold text-stone-800 mb-4">Recent deliveries</h3>
          <div className="rounded-2xl border border-stone-200/60 overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-stone-200/80 hover:bg-transparent bg-stone-50/80">
                  <TableHead className="font-medium text-stone-600">Order</TableHead>
                  <TableHead className="font-medium text-stone-600">Status</TableHead>
                  <TableHead className="font-medium text-stone-600">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentDeliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="border-stone-100">
                    <TableCell className="font-medium text-stone-900">{delivery.order}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          delivery.status === "Completed"
                            ? "text-emerald-600 bg-emerald-50"
                            : delivery.status === "Cancelled"
                              ? "text-red-600 bg-red-50"
                              : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-stone-500">
                      {formatDateTime(delivery.time)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
