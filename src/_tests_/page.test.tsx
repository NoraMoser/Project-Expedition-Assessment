/// <reference types="@testing-library/jest-dom" />
import "whatwg-fetch";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Home from "../app/page";

global.Response = {
    json: (data: unknown, init?: ResponseInit) => ({
        status: (init as { status?: number })?.status ?? 200,
        json: async () => data,
    }),
} as unknown as typeof Response;

// Mock next/image since jsdom can't render it
jest.mock("next/image", () => ({
    __esModule: true,
    default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockDestinations = [
    {
        name: "Machu Picchu",
        country: "Peru",
        region: "South America",
        costLevel: "Moderate",
        activities: ["Hiking & Trekking"],
        averageDailyBudget: 150,
        annualVisitors: 1500000,
        imageUrl: null,
  },
  {
    name: "Santorini",
    country: "Greece",
    region: "Europe",
    costLevel: "Premium",
    activities: ["Beach & Relaxation"],
    averageDailyBudget: 250,
    annualVisitors: 2000000,
    imageUrl: null,
  },
];

const mockFetchResponse = {
  ok: true,
  json: async () => ({
    data: mockDestinations,
    total: 2,
    page: 1,
    totalPages: 1,
    limit: 5,
  }),
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(mockFetchResponse);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Home page", () => {
  it("shows skeleton rows while loading", () => {
    render(<Home />);
    // Table headers should be visible immediately
    expect(screen.getByText("Name")).toBeInTheDocument();
    // Skeleton rows are rendered as empty cells — no destination names yet
    expect(screen.queryByText("Machu Picchu")).not.toBeInTheDocument();
  });

  it("renders destinations after fetch resolves", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Machu Picchu")).toBeInTheDocument();
      expect(screen.getByText("Santorini")).toBeInTheDocument();
    });
  });

  it("renders destination details correctly", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Peru")).toBeInTheDocument();
      expect(screen.getByText("South America")).toBeInTheDocument();
      expect(screen.getByText("Moderate")).toBeInTheDocument();
      expect(screen.getByText("$150")).toBeInTheDocument();
    });
  });

  it("filters destinations when searching", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Machu Picchu")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "Search by name, country, region, activity..."
    );
    fireEvent.change(input, { target: { value: "peru" } });

    expect(screen.getByText("Machu Picchu")).toBeInTheDocument();
    expect(screen.queryByText("Santorini")).not.toBeInTheDocument();
  });

  it("shows empty state when search has no matches", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Machu Picchu")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "Search by name, country, region, activity..."
    );
    fireEvent.change(input, { target: { value: "zzzzz" } });

    expect(screen.getByText(/No destinations found/)).toBeInTheDocument();
  });

  it("clears search when clear button is clicked", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Machu Picchu")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "Search by name, country, region, activity..."
    );
    fireEvent.change(input, { target: { value: "peru" } });
    expect(screen.queryByText("Santorini")).not.toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(screen.getByText("Santorini")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to fetch destinations/)
      ).toBeInTheDocument();
    });
  });
});

