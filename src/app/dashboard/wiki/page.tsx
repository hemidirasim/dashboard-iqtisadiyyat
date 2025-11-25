import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function WikiPage() {
  const wikiPosts = await prisma.wiki_posts.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      created_at: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Wiki bazası</h2>
          <p className="text-sm text-muted-foreground">
            Ensiklopediya məqalələrini idarə edin.
          </p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href="mailto:support@iqtisadiyyat.az">
            <Plus className="size-4" />
            Yeni wiki üçün müraciət
          </Link>
        </Button>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlıq</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Yaradılma</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wikiPosts.map((item) => (
              <TableRow key={item.id.toString()}>
                <TableCell>{item.title}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 1 ? "success" : "secondary"}>
                    {item.status === 1 ? "Aktiv" : "Gözləyir"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(item.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

