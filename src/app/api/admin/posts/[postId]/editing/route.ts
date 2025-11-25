import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

// Memory-də editing session-ları saxlayaq
// Format: Map<postId, Array<{ userId: number, userName: string, startedAt: Date }>>
const editingSessions = new Map<
  string,
  Array<{ userId: number; userName: string; startedAt: Date }>
>();

// Hər 5 dəqiqədə bir köhnə session-ları təmizlə
setInterval(() => {
  const now = new Date();
  for (const [postId, sessions] of editingSessions.entries()) {
    const activeSessions = sessions.filter((session) => {
      const diff = now.getTime() - session.startedAt.getTime();
      return diff <= 5 * 60 * 1000; // 5 dəqiqədən az
    });
    if (activeSessions.length === 0) {
      editingSessions.delete(postId);
    } else {
      editingSessions.set(postId, activeSessions);
    }
  }
}, 60 * 1000); // Hər dəqiqə yoxla

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const currentUserId = Number(session.user.id);
  const sessions = editingSessions.get(postId) || [];

  // Cari istifadəçidən başqa bütün editing session-ları qaytar
  const otherSessions = sessions.filter((s) => s.userId !== currentUserId);

  if (otherSessions.length === 0) {
    return NextResponse.json({ 
      editing: false,
      otherUsers: [],
      currentUserEditing: sessions.some((s) => s.userId === currentUserId),
    });
  }

  return NextResponse.json({
    editing: true,
    otherUsers: otherSessions.map((s) => ({
      userId: s.userId,
      userName: s.userName,
      startedAt: s.startedAt.toISOString(),
    })),
    currentUserEditing: sessions.some((s) => s.userId === currentUserId),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.name) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const userId = Number(session.user.id);
  const userName = session.user.name || "Naməlum istifadəçi";

  // Mövcud session-ları al
  const sessions = editingSessions.get(postId) || [];

  // Əgər bu istifadəçi üçün artıq session yoxdursa, əlavə et
  if (!sessions.some((s) => s.userId === userId)) {
    sessions.push({
      userId,
      userName,
      startedAt: new Date(),
    });
    editingSessions.set(postId, sessions);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const userId = Number(session.user.id);

  const sessions = editingSessions.get(postId);

  if (sessions) {
    // Yalnız cari istifadəçinin session-unu sil
    const filteredSessions = sessions.filter((s) => s.userId !== userId);
    if (filteredSessions.length === 0) {
      editingSessions.delete(postId);
    } else {
      editingSessions.set(postId, filteredSessions);
    }
  }

  return NextResponse.json({ success: true });
}

