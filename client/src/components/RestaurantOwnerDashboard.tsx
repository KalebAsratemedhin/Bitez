import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useGetRestaurantOwnerDashboardQuery } from "@/redux/api/dashboardApi";
import { PlusCircle, Loader2, ShoppingBag, Building2 } from "lucide-react";

const COLORS = ["var(--brand)", "#0d9488", "#b45309", "#7c3aed", "#be185d"];

const RestaurantOwnerDashboard = () => {
  const { data, isLoading, isError } = useGetRestaurantOwnerDashboardQuery();

  if (isLoading || (!data && !isError)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
        <p className="mt-4 text-stone-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">
        <p className="text-stone-600 mb-4">Unable to load dashboard.</p>
        <Link
          href="/restaurant-management"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold px-6 py-2.5 transition"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create your first restaurant
        </Link>
      </div>
    );
  }

  const {
    totalSales,
    totalOrders,
    restaurantCount,
    salesOverTime,
    salesShare,
    ordersPerRestaurant,
    customersPerRestaurant,
  } = data;

  const restaurantNames = salesShare.map((r) => r.name);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">
            Sales, orders, and performance.
          </h1>
        </div>
        <Link
          href="/restaurant-management"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold px-5 py-2.5 transition shrink-0"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create restaurant
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-6 lg:p-8 text-white flex flex-col justify-between min-h-[140px]"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <span className="text-white/90 text-sm font-medium">Total sales</span>
          <p className="font-display text-3xl sm:text-4xl font-bold mt-1">
            ${totalSales.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-[var(--brand)]">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Total orders</p>
            <p className="text-2xl font-bold text-stone-900">{totalOrders}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Restaurants</p>
            <p className="text-2xl font-bold text-stone-900">{restaurantCount}</p>
          </div>
        </div>
      </div>

      {restaurantCount > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-stone-200/60 p-6">
              <h3 className="font-display font-semibold text-stone-800 mb-4">
                Monthly sales per restaurant
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {restaurantNames.map((name, index) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl bg-stone-50 border border-stone-200/60 p-6">
              <h3 className="font-display font-semibold text-stone-800 mb-4">
                Sales share by restaurant
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={salesShare}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {salesShare.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-stone-200/60 p-6">
              <h3 className="font-display font-semibold text-stone-800 mb-4">
                Orders per restaurant
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ordersPerRestaurant}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="var(--brand)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200/60 p-6">
              <h3 className="font-display font-semibold text-stone-800 mb-4">
                Customers per restaurant
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={customersPerRestaurant}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fill: "#57534e", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="customers" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {restaurantCount === 0 && (
        <div className="rounded-2xl bg-stone-50 border border-stone-200/60 p-10 text-center">
          <p className="text-stone-600 mb-6">You don’t have any restaurants yet.</p>
          <Link
            href="/restaurant-management"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-semibold px-6 py-3 transition"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create your first restaurant
          </Link>
        </div>
      )}
    </div>
  );
};

export default RestaurantOwnerDashboard;
