"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Destination {
  name: string;
  country: string;
  region: string;
  costLevel: string;
  activities: string[];
  averageDailyBudget: number;
  annualVisitors: number;
  imageUrl: string | null;
}

const LIMIT = 5;

function SkeletonRow() {
  return (
    <tr className="border-b border-stone-100">
      <td className="px-5 py-4">
        <div className="w-16 h-12 rounded-md bg-stone-200 animate-pulse" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-32 rounded bg-stone-200 animate-pulse" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-20 rounded bg-stone-200 animate-pulse" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-24 rounded bg-stone-200 animate-pulse" />
      </td>
      <td className="px-5 py-4">
        <div className="h-6 w-20 rounded-full bg-stone-200 animate-pulse" />
      </td>
      <td className="px-5 py-4">
        <div className="flex gap-1">
          <div className="h-4 w-16 rounded bg-stone-200 animate-pulse" />
          <div className="h-4 w-20 rounded bg-stone-200 animate-pulse" />
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="h-4 w-12 rounded bg-stone-200 animate-pulse ml-auto" />
      </td>
      <td className="px-5 py-4 text-right">
        <div className="h-4 w-16 rounded bg-stone-200 animate-pulse ml-auto" />
      </td>
    </tr>
  );
}

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/destinations?page=${page}&limit=${LIMIT}`);
        if (!response.ok) throw new Error("Failed to fetch destinations");
        const jsonResponse = await response.json();
        setDestinations(jsonResponse.data);
        setFilteredDestinations(jsonResponse.data);
        setTotalPages(jsonResponse.totalPages);
        setTotal(jsonResponse.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinations();
  }, [page]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(e.target.value);

    if (!term) {
      setFilteredDestinations(destinations);
      return;
    }

    const filtered = destinations.filter((destination) => {
      return (
        destination.name.toLowerCase().includes(term) ||
        destination.country.toLowerCase().includes(term) ||
        destination.region.toLowerCase().includes(term) ||
        destination.costLevel.toLowerCase().includes(term) ||
        destination.activities.some((a) => a.toLowerCase().includes(term)) ||
        String(destination.averageDailyBudget).includes(term) ||
        String(destination.annualVisitors).includes(term)
      );
    });

    setFilteredDestinations(filtered);
  };

  const onClear = () => {
    setSearchTerm("");
    setFilteredDestinations(destinations);
  };

  const costLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "budget": return "bg-emerald-100 text-emerald-800";
      case "moderate": return "bg-amber-100 text-amber-800";
      case "premium": return "bg-purple-100 text-purple-800";
      case "luxury": return "bg-rose-100 text-rose-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-1">
            Project Expedition
          </p>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
            Destination Explorer
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1">
            <label htmlFor="destination-search" className="sr-only">
              Search destinations
            </label>
            <input
              id="destination-search"
              type="text"
              placeholder="Search by name, country, region, activity..."
              value={searchTerm}
              onChange={onChange}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 text-sm"
            />
          </div>
          {searchTerm && (
            <button
              onClick={onClear}
              aria-label="Clear search"
              className="px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {!isLoading && !error && (
          <p className="text-xs text-stone-400 mb-4 tracking-wide" aria-live="polite">
            {searchTerm
              ? `${filteredDestinations.length} result${filteredDestinations.length !== 1 ? "s" : ""} on this page matching "${searchTerm}"`
              : `${total} destination${total !== 1 ? "s" : ""} total — page ${page} of ${totalPages}`}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-rose-50 border border-rose-200 px-6 py-4 text-rose-700 text-sm"
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredDestinations.length === 0 && (
          <div
            role="status"
            aria-live="polite"
            className="text-center py-24 text-stone-400 text-sm"
          >
            No destinations found{searchTerm ? ` for "${searchTerm}"` : ""}.
          </div>
        )}

        {/* Table — shows skeleton rows while loading, real rows when done */}
        {(isLoading || (!error && filteredDestinations.length > 0)) && (
          <>
            <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full text-sm" aria-label="Travel destinations" aria-busy={isLoading}>
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200">
                    <th scope="col" className="text-left px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Photo</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Name</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Country</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Region</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Cost Level</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Activities</th>
                    <th scope="col" className="text-right px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Avg. Daily Budget</th>
                    <th scope="col" className="text-right px-5 py-3 font-semibold text-stone-500 uppercase tracking-wider text-xs">Annual Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: LIMIT }).map((_, i) => <SkeletonRow key={i} />)
                    : filteredDestinations.map((destination, i) => (
                        <tr
                          key={destination.name}
                          className={`border-b border-stone-100 hover:bg-stone-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}`}
                        >
                          <td className="px-5 py-4">
                            {destination.imageUrl ? (
                              <div className="relative w-16 h-12 rounded-md overflow-hidden bg-stone-100">
                                <Image
                                  src={destination.imageUrl}
                                  alt={`Photo of ${destination.name}`}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-12 rounded-md bg-stone-100" aria-hidden="true" />
                            )}
                          </td>
                          <td className="px-5 py-4 font-medium text-stone-900">{destination.name}</td>
                          <td className="px-5 py-4 text-stone-600">{destination.country}</td>
                          <td className="px-5 py-4 text-stone-600">{destination.region}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${costLevelColor(destination.costLevel)}`}>
                              {destination.costLevel}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1">
                              {destination.activities.map((a) => (
                                <span key={a} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right text-stone-600">${destination.averageDailyBudget}</td>
                          <td className="px-5 py-4 text-right text-stone-600">{destination.annualVisitors.toLocaleString()}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && !searchTerm && totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-stone-500" aria-current="page">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-500 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}