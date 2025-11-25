import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "Fayl seçilməyib" }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop();
        const filename = `${timestamp}-${randomStr}.${extension}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, new Uint8Array(buffer));

        return {
          name: file.name,
          url: `/uploads/${filename}`,
          size: file.size,
          type: file.type,
        };
      }),
    );

    return NextResponse.json({
      message: `${uploadedFiles.length} fayl yükləndi`,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: error.message || "Fayl yükləmə xətası" },
      { status: 500 },
    );
  }
}

