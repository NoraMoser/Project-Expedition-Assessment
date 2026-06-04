import db from "../../../db";
import { destinations } from "../../../db/schema";
import { destinationData } from "../../../db/seed/destinations";

export async function GET() {
  const data = destinationData;

  return Response.json({ data });
}
