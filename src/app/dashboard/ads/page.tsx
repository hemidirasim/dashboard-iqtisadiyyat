import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { DATE_FORMAT } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdsPage() {
  const ads = await prisma.advertising.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Reklam blokları</h2>
        <p className="text-sm text-muted-foreground">
          Aktiv reklam kampaniyalarını izləyin və statusa nəzarət edin.
        </p>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlıq</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bitmə tarixi</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad.id.toString()}>
                <TableCell>{ad.title}</TableCell>
                <TableCell>
                  <Badge variant={ad.status ? "success" : "secondary"}>
                    {ad.status ? "Aktiv" : "Deaktiv"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ad.finish_date ? format(ad.finish_date, DATE_FORMAT) : "-"}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                  {ad.url}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



