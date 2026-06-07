import "whatwg-fetch";

global.Response = {
  json: (data: unknown, init?: ResponseInit) => ({
    status: (init as { status?: number })?.status ?? 200,
    json: async () => data,
  }),
} as unknown as typeof Response;
import { GET } from "../app/api/destinations/route";

// Mock the db module so tests don't need a real database
jest.mock("../db", () => {
  const mockDestination = {
    name: "Machu Picchu",
    country: "Peru",
    region: "South America",
    costLevel: "Moderate",
    activities: ["Hiking & Trekking"],
    averageDailyBudget: 150,
    annualVisitors: 1500000,
    imageUrl: null,
  };

  let callCount = 0;
  return {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          // count query
          return Promise.resolve([{ count: 15 }]);
        }
        // data query
        return {
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockDestination]),
          }),
        };
      }),
    })),
  };
});

jest.mock("../db/schema", () => ({
  destinations: {},
}));

jest.mock("drizzle-orm", () => ({
  sql: jest.fn().mockReturnValue({}),
}));

const makeRequest = (params: Record<string, string> = {}) => {
  const url = new URL("http://localhost:3000/api/destinations");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
};

describe("GET /api/destinations", () => {
  it("returns data with pagination metadata", async () => {
    const response = await GET(makeRequest({ page: "1", limit: "5" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
    expect(json).toHaveProperty("total");
    expect(json).toHaveProperty("page");
    expect(json).toHaveProperty("totalPages");
    expect(json).toHaveProperty("limit");
  });

  it("defaults to page 1 when no params provided", async () => {
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(json.page).toBe(1);
  });

  it("clamps limit to a maximum of 50", async () => {
    const response = await GET(makeRequest({ limit: "999" }));
    const json = await response.json();

    expect(json.limit).toBeLessThanOrEqual(50);
  });

  it("clamps page to a minimum of 1 for invalid input", async () => {
    const response = await GET(makeRequest({ page: "-5" }));
    const json = await response.json();

    expect(json.page).toBeGreaterThanOrEqual(1);
  });

  it("returns 500 when the database throws", async () => {
    const db = require("../db");
    db.select.mockImplementationOnce(() => {
      throw new Error("DB connection failed");
    });

    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty("error");
  });
});