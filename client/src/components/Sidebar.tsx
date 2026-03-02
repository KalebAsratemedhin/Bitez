"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useGetCurrentUserQuery } from "@/redux/api/authApi";
import {
  Home,
  Settings,
  Utensils,
  Users,
  BellElectricIcon,
  FormInputIcon,
  HotelIcon,
  LucideBike,
  LayoutDashboardIcon,
} from "lucide-react";
import Link from "next/link";
import { SidebarNavLink } from "@/components/layout";

type MenuItemType = {
  title: string;
  url: string;
  icon: React.ElementType;
};

type RoleGroupItemType = {
  role: string;
  items: MenuItemType[];
};

export function AppSidebar() {
  const { data: user } = useGetCurrentUserQuery(undefined);

  const baseItems: MenuItemType[] = [
    { title: "Home", url: "/", icon: Home },
    { title: "Restaurants", url: "/restaurants", icon: HotelIcon },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  ];

  const ownerItems: RoleGroupItemType[] = [
    {
      role: "restaurant_owner",
      items: [
        { title: "My Restaurant", url: "/restaurant-management", icon: Utensils },
        { title: "Restaurant Orders", url: "/restaurant-orders", icon: BellElectricIcon },
      ],
    },
  ];

  const deliveryPersonItems: RoleGroupItemType[] = [
    {
      role: "delivery_person",
      items: [
        { title: "My Deliveries", url: "/deliveries/delivery-person", icon: LucideBike },
      ],
    },
  ];

  const adminItems: RoleGroupItemType[] = [
    {
      role: "admin",
      items: [
        { title: "Manage Users", url: "/user-management", icon: Users },
        { title: "Restaurant Apps", url: "/restaurant-applications", icon: FormInputIcon },
      ],
    },
  ];

  const customerItems: RoleGroupItemType[] = [
    {
      role: "customer",
      items: [
        { title: "My Orders", url: "/orders", icon: BellElectricIcon },
        { title: "Track Deliveries", url: "/deliveries/customer", icon: LucideBike },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItemType) => (
    <SidebarMenuItem key={item.title}>
      <SidebarNavLink href={item.url} icon={item.icon}>
        {item.title}
      </SidebarNavLink>
    </SidebarMenuItem>
  );

  const renderRoleGroup = (
    label: string,
    roleSpecificItems: RoleGroupItemType[]
  ) => {
    const filteredItems = roleSpecificItems
      .filter((group) => user?.role === group.role)
      .flatMap((group) => group.items);

    if (!filteredItems.length) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="px-4 pt-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden md:block">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1 px-2 pt-4 md:px-3">
            {filteredItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className="[--sidebar-width:16rem] border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/bitez-logo.svg" alt="" className="h-7 w-7 shrink-0" />
          <span className="font-display text-xl font-bold text-stone-800">
            Bitez
          </span>
        </Link>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </div>

      <SidebarContent className="flex-grow overflow-y-auto py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 pt-4 pb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider hidden md:block">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 md:px-3">
              {baseItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderRoleGroup("Restaurant", ownerItems)}
        {renderRoleGroup("Administration", adminItems)}
        {renderRoleGroup("My Account", customerItems)}
        {renderRoleGroup("Delivery Tasks", deliveryPersonItems)}
      </SidebarContent>
    </Sidebar>
  );
}
