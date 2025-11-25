import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { CategoryForm } from "@/components/admin/category-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function CategoriesPage() {
  const categories = await prisma.categories.findMany({
    where: { deleted_at: null },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      home: true,
      order: true,
      status: true,
      created_at: true,
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
      <div>
        <h2 className="text-2xl font-semibold">Kateqoriya əlavə et</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Mövcud strukturu pozmadan yeni kateqoriyalar yarada bilərsiniz.
        </p>
        <CategoryForm />
      </div>
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <p className="text-lg font-semibold">Mövcud kateqoriyalar</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlıq</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Home</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Tarix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id.toString()}>
                <TableCell className="font-medium">{category.title}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>
                  <Badge variant={category.home ? "success" : "secondary"}>
                    {category.home ? "Bəli" : "Xeyr"}
                  </Badge>
                </TableCell>
                <TableCell>{category.order ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(category.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

