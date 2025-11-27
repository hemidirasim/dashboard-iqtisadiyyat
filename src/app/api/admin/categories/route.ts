import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categorySchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  order: z.number().optional(),
  home: z.boolean().optional(),
  content: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lite = searchParams.get("lite");

  const categories = await prisma.categories.findMany({
    where: { deleted_at: null, status: true },
    select: lite
      ? { id: true, title: true }
      : { id: true, title: true, slug: true, order: true, home: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({
    categories: categories.map((category) => ({
      ...category,
      id: category.id.toString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = categorySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Verilənlər düzgün deyil",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const category = await prisma.categories.create({
    data: {
      title: data.title,
      slug: data.slug,
      order: data.order,
      home: data.home ?? false,
      content: data.content,
      status: true,
    },
  });

  return NextResponse.json({ id: category.id.toString() }, { status: 201 });
}



