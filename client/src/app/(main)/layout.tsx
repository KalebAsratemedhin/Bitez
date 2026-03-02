import { MainLayout } from "@/components/layout";


export default function MainLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
