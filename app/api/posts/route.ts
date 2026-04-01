import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function getText(key: string): Promise<string> {
  const res = await s3.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }));
  return res.Body!.transformToString();
}

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

export async function GET() {
  const index = await getIndex();
  const posts = await Promise.all(
    index.map(async (p: any) => {
      const text = await getText(p.textKey);
      const imageUrl = p.imageKey
        ? `${process.env.R2_PUBLIC_BASE}/${p.imageKey}`
        : null;
      return { id: p.id, timestamp: p.timestamp, text, imageUrl };
    })
  );
  return NextResponse.json(posts);
}
