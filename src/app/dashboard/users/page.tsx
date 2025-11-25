import Link from "next/link";
import { Plus } from "lucide-react";

import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { UserActionsWrapper } from "@/components/admin/user-actions-wrapper";
import { UsersSearch } from "@/components/admin/users-search";

type Props = {
  searchParams: {
    q?: string;
    role?: string;
  };
};

const ROLE_COLORS: Record<number, "default" | "secondary" | "success"> = {
  0: "secondary",
  1: "default",
  2: "success",
};

const ROLE_NAMES: Record<number, string> = {
  0: "Reporter",
  1: "Editor",
  2: "Admin",
};

export default async function UsersPage({ searchParams }: Props) {
  const search = searchParams.q;
  const role = searchParams.role ? Number(searchParams.role) : undefined;
  
  // Database-dən birbaşa role götür
  const session = await getServerSession(authOptions);
  let canCreateUser = false;
  if (session?.user?.id) {
    const dbUser = await prisma.users.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true },
    });
    canCreateUser = (dbUser?.role ?? 0) >= 1; // Editor və ya Admin
  }

  const users = await prisma.users.findMany({
    where: {
      deleted_at: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { surname: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
      ...(role !== undefined ? { role } : {}),
    },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">İstifadəçilər</h2>
          <p className="text-sm text-muted-foreground">
            İstifadəçiləri idarə edin, rolları təyin edin və statusları dəyişdirin.
          </p>
        </div>
        {canCreateUser && (
          <Button asChild className="gap-2">
            <Link href="/dashboard/users/new">
              <Plus className="size-4" />
              Yeni istifadəçi
            </Link>
          </Button>
        )}
      </div>

      <UsersSearch />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-poçt</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Yaradılma tarixi</TableHead>
              <TableHead className="text-right">Əməliyyatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  İstifadəçi tapılmadı
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id.toString()}>
                  <TableCell className="font-medium">
                    {user.name} {user.surname || ""}
                  </TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[user.role] || "secondary"}>
                      {ROLE_NAMES[user.role] || "Naməlum"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status ? "default" : "secondary"}>
                      {user.status ? "Aktiv" : "Deaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <UserActionsWrapper
                      userId={user.id.toString()}
                      userName={`${user.name} ${user.surname || ""}`.trim()}
                      status={user.status}
                      role={user.role}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

