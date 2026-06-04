import db from "../../../db";
import { destinations } from "../../../db/schema";
import { destinationData } from "../../../db/seed/destinations";

export async function POST() {
  await db.delete(destinations);
  const records = await db.insert(destinations).values(destinationData).returning();

  return Response.json({ destinations: records });
}
