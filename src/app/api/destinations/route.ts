import db from "../../../db";
import { destinations } from "../../../db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 5)));
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      db.select().from(destinations).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(destinations),
    ]);

    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / limit);

    return Response.json({ data, total, page, totalPages, limit });
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
    return Response.json(
      { error: "Failed to fetch destinations" },
      { status: 500 }
    );
  }
}