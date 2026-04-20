import { NextRequest, NextResponse } from "next/server";
import { getPosts } from "@/lib/content";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tagsParam = searchParams.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

  const locationSlug = searchParams.get("locationSlug") ?? undefined;

  const limitParam = searchParams.get("limit");
  const limit = limitParam === "all" ? "all" : limitParam ? parseInt(limitParam) : 6;

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;

  const result = await getPosts({ tags, locationSlug, limit, page });

  return NextResponse.json(result);
}
