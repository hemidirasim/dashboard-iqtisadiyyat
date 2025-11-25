import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  name: z.string().min(2, "Ad çox qısadır").optional(),
  surname: z.string().optional(),
  email: z.string().email("Düzgün e-poçt ünvanı daxil edin").optional(),
  password: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır").optional(),
  role: z.number().int().min(0).max(2).optional(),
  status: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId: userIdParam } = await params;
    const userId = BigInt(userIdParam);
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    if (!user || user.deleted_at) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id.toString(),
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error: any) {
    console.error("GET /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { message: error.message || "Server xətası baş verdi" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Həmişə database-dən role götür
    const currentUser = await prisma.users.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true, deleted_at: true, status: true },
    });

    if (!currentUser || currentUser.deleted_at || !currentUser.status) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Yalnız admin və editor istifadəçi redaktə edə bilər
    if (currentUser.role < 1) {
      return NextResponse.json(
        { 
          message: "Bu əməliyyat üçün Editor və ya Admin icazəsi lazımdır",
          role: currentUser.role,
        },
        { status: 403 }
      );
    }

    const { userId: userIdParam } = await params;
    const userId = BigInt(userIdParam);
    const payload = await request.json();
    const parsed = updateUserSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Form məlumatları yanlışdır", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    const data = parsed.data;

    // Email unikal olmalıdır (əgər dəyişdirilirsə)
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.users.findFirst({
        where: {
          email: data.email,
          deleted_at: null,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return NextResponse.json({ message: "Bu e-poçt ünvanı artıq istifadə olunur" }, { status: 400 });
      }
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.surname !== undefined) updateData.surname = data.surname;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;

    // Şifrə yalnız təmin edilərsə yenilə
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({
      id: updatedUser.id.toString(),
      name: updatedUser.name,
      surname: updatedUser.surname,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    });
  } catch (error: any) {
    console.error("PUT /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { message: error.message || "Server xətası baş verdi" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Həmişə database-dən role götür
    const currentUser = await prisma.users.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true, deleted_at: true, status: true },
    });

    if (!currentUser || currentUser.deleted_at || !currentUser.status) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Yalnız admin silə bilər
    if (currentUser.role < 2) {
      return NextResponse.json(
        { 
          message: "Bu əməliyyat üçün Admin icazəsi lazımdır",
          role: currentUser.role,
        },
        { status: 403 }
      );
    }

    const { userId: userIdParam } = await params;
    const userId = BigInt(userIdParam);

    // Özünü silməyə icazə vermə
    if (userId.toString() === session.user.id) {
      return NextResponse.json({ message: "Öz hesabınızı silə bilməzsiniz" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Soft delete
    await prisma.users.update({
      where: { id: userId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { message: error.message || "Server xətası baş verdi" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Həmişə database-dən role götür
    const currentUser = await prisma.users.findUnique({
      where: { id: BigInt(session.user.id) },
      select: { role: true, deleted_at: true, status: true },
    });

    if (!currentUser || currentUser.deleted_at || !currentUser.status) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Yalnız admin və editor status dəyişdirə bilər
    if (currentUser.role < 1) {
      return NextResponse.json(
        { 
          message: "Bu əməliyyat üçün Editor və ya Admin icazəsi lazımdır",
          role: currentUser.role,
        },
        { status: 403 }
      );
    }

    const { userId: userIdParam } = await params;
    const userId = BigInt(userIdParam);
    const payload = await request.json();
    const action = payload.action;

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      return NextResponse.json({ message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    if (action === "toggle-status") {
      await prisma.users.update({
        where: { id: userId },
        data: {
          status: !user.status,
          updated_at: new Date(),
        },
      });
    } else if (action === "toggle-role" && currentUser.role >= 2) {
      // Yalnız admin role dəyişdirə bilər
      const newRole = user.role === 0 ? 1 : user.role === 1 ? 2 : 0;
      await prisma.users.update({
        where: { id: userId },
        data: {
          role: newRole,
          updated_at: new Date(),
        },
      });
    } else {
      return NextResponse.json({ message: "Yanlış əməliyyat" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[userId] error:", error);
    return NextResponse.json(
      { message: error.message || "Server xətası baş verdi" },
      { status: 500 },
    );
  }
}

