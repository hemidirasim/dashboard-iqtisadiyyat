import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  name: z.string().min(2, "Ad çox qısadır"),
  surname: z.string().optional(),
  email: z.string().email("Düzgün e-poçt ünvanı daxil edin"),
  password: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır"),
  role: z.number().int().min(0).max(2).default(0),
  status: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? undefined;
    const role = searchParams.get("role") ? Number(searchParams.get("role")) : undefined;

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

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { message: error.message || "Server xətası baş verdi" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Həmişə database-dən role götür (session-də role düzgün gəlməyə bilər)
    const currentUser = await prisma.users.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true, deleted_at: true, status: true },
    });

    if (!currentUser || currentUser.deleted_at || !currentUser.status) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Yalnız admin və editor yeni istifadəçi yarada bilər
    if (currentUser.role < 1) {
      return NextResponse.json(
        { 
          message: "Bu əməliyyat üçün Editor və ya Admin icazəsi lazımdır",
          role: currentUser.role,
        },
        { status: 403 }
      );
    }

    const payload = await request.json();
    const parsed = createUserSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form məlumatları yanlışdır", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Email unikal olmalıdır
    const existingUser = await prisma.users.findFirst({
      where: {
        email: data.email,
        deleted_at: null,
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Bu e-poçt ünvanı artıq istifadə olunur" }, { status: 400 });
    }

    // Şifrəni hash et
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const now = new Date();
    const user = await prisma.users.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        status: data.status,
        created_at: now,
        updated_at: now,
      },
    });

    return NextResponse.json(
      {
        id: user.id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { message: error.message || "Server xətası baş verdi" },
      { status: 500 },
    );
  }
}

