import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { convexServer } from "../../../../convex/server";


export async function POST(req: Request) {
  const body = await req.json();
  const { storageId } = body as { storageId: string };
  if (!storageId) return NextResponse.json({ error: "Missing storageId" }, { status: 400 });

  const url = await convexServer.query(api.files.getUrl, { storageId: storageId as any });
  return NextResponse.json({ url });
}