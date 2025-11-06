// src/app/api/like/route.ts
import { redis } from "@/lib/redis";
import { NextRequest } from "next/server";

// レート制限設定
const WINDOW_SECONDS = 10;
const MAX_REQUESTS = 50;

async function rateLimit(ip: string) {
  const key = `rate:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  return current <= MAX_REQUESTS;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (!postId) return Response.json({ error: "postId is required" }, { status: 400 });

  if (!(await rateLimit(ip))) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const key = `likes:${postId}`;
  const count = await redis.get<number>(key);
  return Response.json({ count: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const { postId } = await req.json();
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (!postId) return Response.json({ error: "postId is required" }, { status: 400 });

  if (!(await rateLimit(ip))) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const key = `likes:${postId}`;
  const count = await redis.incr(key);
  return Response.json({ count });
}
