import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { AdminLayout } from "~/components/AdminLayout";

interface LayoutProps {
  children: React.ReactNode;
}

export default async function AdminRouteLayout({ children }: LayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  return <AdminLayout user={user}>{children}</AdminLayout>;
}
