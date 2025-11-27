import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SettingsPage() {
  const settings = await prisma.settings.findMany({
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sistem parametrləri</h2>
        <p className="text-sm text-muted-foreground">
          Mövcud açar sözləri və əsas dəyərləri izləyin. Dəyişiklik üçün texniki komandaya müraciət edin.
        </p>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açar</TableHead>
              <TableHead>Başlıq</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.id.toString()}>
                <TableCell className="font-medium">{setting.key}</TableCell>
                <TableCell>{setting.title}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



