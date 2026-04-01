import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function getIndex() {
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: "posts/index.json",
    }));
    const body = await res.Body!.transformToString();
    return JSON.parse(body);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const text = formData.get("text") as string;
  const image = formData.get("image") as File | null;

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const id = Date.now().toString();

  // upload text file
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `posts/text/${id}.txt`,
    Body: text,
    ContentType: "text/plain",
  }));

  // upload image if present
  let imageKey = null;
  if (image && image.size > 0) {
    const ext = image.name.split(".").pop();
    imageKey = `posts/images/${id}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: imageKey,
      Body: buffer,
      ContentType: image.type,
    }));
  }

  // update index
  const index = await getIndex();
  index.unshift({ id, timestamp: new Date().toISOString(), textKey: `posts/text/${id}.txt`, imageKey });
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: "posts/index.json",
    Body: JSON.stringify(index),
    ContentType: "application/json",
  }));

  return NextResponse.json({ ok: true, id });
}
