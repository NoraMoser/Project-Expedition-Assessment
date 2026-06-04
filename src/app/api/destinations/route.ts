import db from "../../../db";
import { destinations } from "../../../db/schema";

export async function GET(request: Request) {
  try {
    const data = await db.select().from(destinations);
    return Response.json({ data });
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
    return Response.json(
      { error: "Failed to fetch destinations" },
      { status: 500 }
    );
  }
}