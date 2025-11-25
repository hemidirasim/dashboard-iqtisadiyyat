import { Eye, FileText, Layers, NotebookPen } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const [totalPosts, publishedPosts, categories, wikiPosts, latestPosts] = await Promise.all([
    prisma.posts.count(),
    prisma.posts.count({
      where: { status: true, publish: 1, deleted_at: null },
    }),
    prisma.categories.count({
      where: { deleted_at: null },
    }),
    prisma.wiki_posts.count({
      where: { deleted_at: null },
    }),
    prisma.posts.findMany({
      take: 8,
      where: { deleted_at: null },
      orderBy: { published_date: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        publish: true,
        published_date: true,
        view_count: true,
      },
    }),
  ]);

  const statCards = [
    {
      title: "Aktiv məqalə",
      value: publishedPosts,
      icon: FileText,
      description: `${totalPosts} ümumi məqalədən`,
    },
    {
      title: "Kateqoriyalar",
      value: categories,
      icon: Layers,
      description: "Navigasiya üçün açar bölmələr",
    },
    {
      title: "Wiki yazıları",
      value: wikiPosts,
      icon: NotebookPen,
      description: "İqtisadiyyat ensiklopediyası",
    },
    {
      title: "Ortalama baxış",
      value:
        latestPosts.reduce((sum, post) => sum + Number(post.view_count || BigInt(0)), 0) ||
        0,
      icon: Eye,
      description: "Son 8 məqalənin cəmi",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son yayımlanan məqalələr</CardTitle>
          <CardDescription>Yalnız yayımlanmış və ya planlanmış kontent.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlıq</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Yayımlanma</TableHead>
                <TableHead className="text-right">Baxış</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestPosts.map((post) => (
                <TableRow key={post.id.toString()}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.status ? "success" : "secondary"}>
                      {post.publish === 1 ? "Yayımda" : "Qaralama"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDate(post.published_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(post.view_count || BigInt(0)).toLocaleString("az-Latn-AZ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

