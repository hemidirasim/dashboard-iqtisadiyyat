import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { UserForm } from "@/components/admin/user-form";

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);
  
  // Database-dən birbaşa role götür
  let canCreateUser = false;
  if (session?.user?.id) {
    const dbUser = await prisma.users.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true },
    });
    canCreateUser = (dbUser?.role ?? 0) >= 1; // Editor və ya Admin
  }

  if (!canCreateUser) {
    redirect("/dashboard/users");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Yeni istifadəçi</h2>
        <p className="text-sm text-muted-foreground">Yeni istifadəçi hesabı yaradın</p>
      </div>
      <UserForm />
    </div>
  );
}

