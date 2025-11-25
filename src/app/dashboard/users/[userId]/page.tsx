import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { UserForm } from "@/components/admin/user-form";

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function EditUserPage({ params }: Props) {
  const { userId } = await params;
  const id = BigInt(userId);
  const user = await prisma.users.findUnique({
    where: { id },
  });

  if (!user || user.deleted_at) {
    notFound();
  }

  const defaultValues = {
    name: user.name,
    surname: user.surname ?? "",
    email: user.email ?? "",
    password: "", // Şifrə göstərilmir
    role: user.role,
    status: user.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">İstifadəçini redaktə et</h2>
        <p className="text-sm text-muted-foreground">
          {user.name} {user.surname || ""}
        </p>
      </div>
      <UserForm userId={user.id.toString()} defaultValues={defaultValues} />
    </div>
  );
}

