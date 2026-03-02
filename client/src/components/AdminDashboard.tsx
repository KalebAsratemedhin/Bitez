import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { formatDateTime } from "@/lib/utils";
import { Loader2, Building2, Bike } from "lucide-react";


export default function AdminDashboard() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
        <p className="mt-4 text-stone-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl bg-stone-100 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load dashboard.</p>
      </div>
    );
  }

  const { stats, salesData, userData, revenueData, recentUsers } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
          Platform overview and key metrics.
        </h1>
      </div>

      {/* Hero stat + compact stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-6 lg:p-8 text-white flex flex-col justify-between min-h-[140px]"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <span className="text-white/90 text-sm font-medium">Total customers</span>
          <p className="font-display text-3xl sm:text-4xl font-bold mt-1">{stats.totalCustomers}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Restaurants</p>
            <p className="text-2xl font-bold text-stone-900">{stats.totalRestaurants}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <Bike className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Delivery people</p>
            <p className="text-2xl font-bold text-stone-900">{stats.totalDeliveryPeople}</p>
          </div>
        </div>
      </div>

      {/* Bento: 2 charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-stone-200/60 p-6">
          <h3 className="font-display font-semibold text-stone-800 mb-4">Sales trend (monthly)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis tick={{ fill: "#78716c", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-stone-50 border border-stone-200/60 p-6">
          <h3 className="font-display font-semibold text-stone-800 mb-4">User distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis tick={{ fill: "#78716c", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-stone-200/60 p-6">
        <h3 className="font-display font-semibold text-stone-800 mb-4">Revenue breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} />
            <YAxis tick={{ fill: "#78716c", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#b45309" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="font-display font-semibold text-stone-800 mb-4">Recently joined users</h3>
        <div className="rounded-2xl border border-stone-200/60 overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-stone-200/80 hover:bg-transparent bg-stone-50/80">
                <TableHead className="font-medium text-stone-600">Name</TableHead>
                <TableHead className="font-medium text-stone-600">Email</TableHead>
                <TableHead className="font-medium text-stone-600">Role</TableHead>
                <TableHead className="font-medium text-stone-600">Joined</TableHead>
                <TableHead className="font-medium text-stone-600">Status</TableHead>
                <TableHead className="text-right font-medium text-stone-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user._id} className="border-stone-100">
                  <TableCell className="font-medium text-stone-900">{user.name}</TableCell>
                  <TableCell className="text-stone-500">{user.email}</TableCell>
                  <TableCell className="capitalize text-stone-500">{user.role}</TableCell>
                  <TableCell className="text-stone-500">{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        user.isActive
                          ? "text-emerald-600 font-medium"
                          : "text-red-500 font-medium"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/user-management")}
                      className="border-stone-200 hover:bg-stone-50"
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
