import { redis } from "@/lib/redis";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return Response.json({ error: "postId is required" }, { status: 400 });
  }

  const key = `likes:${postId}`;
  const count = await redis.get<number>(key);

  return Response.json({ count: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const { postId } = await req.json();

  if (!postId) {
    return Response.json({ error: "postId is required" }, { status: 400 });
  }

  const key = `likes:${postId}`;
  const count = await redis.incr(key);

  return Response.json({ count });
}
