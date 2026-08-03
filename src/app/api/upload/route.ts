import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth-server";

const IMAGE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
} as const;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const hasImageSignature = (buffer: Buffer, type: keyof typeof IMAGE_EXTENSIONS) => {
  switch (type) {
    case "image/jpeg":
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "image/gif": {
      const signature = buffer.subarray(0, 6).toString("ascii");
      return signature === "GIF87a" || signature === "GIF89a";
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const { role } = await auth();
    if (!role) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (role !== "admin") {
      return NextResponse.json({ error: "Only admins can upload images" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!(file.type in IMAGE_EXTENSIONS)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    }

    const type = file.type as keyof typeof IMAGE_EXTENSIONS;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasImageSignature(buffer, type)) {
      return NextResponse.json({ error: "File content does not match its image type" }, { status: 400 });
    }

    const filename = `${randomUUID()}${IMAGE_EXTENSIONS[type]}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
