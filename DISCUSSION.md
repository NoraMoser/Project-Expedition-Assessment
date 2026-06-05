# Discussion

## Section 1: Project Setup

The original repo committed a `.env` file containing a database connection string. This is a security issue — secrets should never be in version control, even in a private repo, because they persist in git history. I added `.env` to `.gitignore`, renamed the local file to `.env.local` (which was already gitignored by the Next.js default), and created a `.env.example` to document the required environment variables for anyone setting up the project.

Added a `.prettierrc` for consistent code formatting across the team.

Added a `docker-compose.yml` so developers can spin up a local PostgreSQL instance without needing to install or configure one manually — `docker compose up -d` is all that's needed to get a database running. The compose config matches the default values in `.env.example` so everything connects out of the box. After starting the container, run `npm run generate` to generate migration files from the schema, then `npm run migrate:up` to create the tables, and hit `POST /api/seed` to populate the data.

One thing worth noting: the `migrate:up` script runs with plain Node, not through Next.js, so it does not automatically pick up `.env.local` the way the dev server does. Next.js handles env file loading itself, but bare Node scripts do not have that behavior. The workaround is to pass the variable inline (`DATABASE_URL=... npm run migrate:up`) or use a package like `dotenv` to load the env file explicitly in the script. I opted for the inline approach to keep the setup simple and documented it in the README.

The app renders an empty table on first load until the seed endpoint is called — this is expected behavior since the database starts empty. Running `POST /api/seed` populates the destinations and the UI updates on next load.

Note on branch workflow: in a real team environment I would have kept strictly to branch-per-section. Due to time constraints I consolidated the work into a single branch.

## Section 2: Database & API

The original GET endpoint imported `destinationData` directly from the seed file and returned it as-is. The database was never queried — the API looked like it was fetching live data but was just returning static hardcoded records.

Replaced the hardcoded return with a real Drizzle query using `.select().from(destinations)`. This hits the actual PostgreSQL database and returns live records.

Added pagination via `page` and `limit` query params. The API now accepts `?page=1&limit=5`, uses Drizzle's `.limit()` and `.offset()` to fetch the right slice, and runs a parallel count query via `Promise.all` to return total count and total pages alongside the data. This avoids loading the full dataset on every request.

Also fixed `src/db/index.ts`. The original used a fallback object `{ select: () => ({ from: () => [] }) }` when no `DATABASE_URL` was set, which caused TypeScript to union the return type with the real Drizzle instance. This meant the compiler couldn't guarantee `.limit()` and `.offset()` existed on `db`, producing type errors. Replaced the fallback with an early `throw` — if `DATABASE_URL` is missing the app fails fast with a clear error rather than silently returning empty data. This is better behavior in both development and production.

Added error handling around all queries. The original had none — if the database was unavailable the app would crash with an unhandled error. Now it catches failures, logs them server-side, and returns a proper 500 response.

**What I'd do with more time:**
- Add server-side search filtering via a `?search=` query param so filtering happens in the database rather than client-side
- Add input validation on query params
- Add sorting support

## Section 3: User Interface

Added SEO metadata via Next.js `Metadata` export in `layout.tsx` — title and description that will appear in search results and browser tabs. This lives in `layout.tsx` rather than `page.tsx` because metadata exports are only supported in server components, and `page.tsx` uses `"use client"` for its interactive state. The `<h1>` was already in place (important for SEO), and the `<Image>` components include descriptive `alt` text on every destination photo, which helps both SEO and accessibility.


The existing `page.tsx` had several issues I identified through code review and checking the browser console:

**Bugs fixed:**
- `averageDailyBudget` and `annualVisitors` are numbers, not strings — calling `.includes()` on them would throw a TypeError at runtime. Fixed by wrapping in `String()`.
- `activities.includes(searchTerm)` was checking whether the array contained an exact match for the search term, which would never work for partial matches. Fixed with `.some((a) => a.toLowerCase().includes(term))`.
- Search was case-sensitive, so searching "peru" returned no results even though "Peru" exists. Fixed by normalizing both sides to lowercase.
- Direct DOM manipulation via `document.getElementById("search-term").innerHTML` bypasses React's virtual DOM and is an XSS vector. Replaced with a controlled input using a `searchTerm` state variable.
- `<thead>` was missing a `<tr>` wrapper around the `<th>` elements — invalid HTML per spec.
- Missing `key` props on mapped `<tr>` and activity `<div>` elements, causing React warnings.
- `useState([])` with no type argument caused TypeScript to infer `never[]`, producing type errors throughout the component. Fixed by adding a `Destination` interface and typing both state declarations explicitly.

**Improvements added:**
- Loading state — shows "Loading destinations..." while the fetch is in flight.
- Error state — if the API call fails, a clear error message is shown rather than silently failing.
- Empty state — if the search returns no matches, a message shows "No destinations found for X" rather than an empty table.
- Rewrote the fetch logic using async/await with try/catch instead of nested `.then()` calls. The original nested approach made error handling difficult — errors thrown inside an inner `.then()` would silently disappear. The async/await version uses a single `catch` block to handle any failure and a `finally` block to always clear the loading state. Note that `useEffect` callbacks cannot be async directly in React, so the async logic lives in an inner function that is called immediately.
- Typed the `onChange` handler with `React.ChangeEvent<HTMLInputElement>` to remove the implicit `any`.
- Added pagination controls — prev/next buttons that update the current page, with the page number and total displayed between them. Page is stored in state and passed as a query param to the API (`?page=N&limit=5`), so each page change triggers a real re-fetch from the database rather than slicing client-side data. The `useEffect` has `page` in its dependency array so it fires automatically on change. Pagination controls are hidden during search since search filters the current page client-side. Prev and next buttons are disabled at the boundaries.
- Added Tailwind styling throughout. The design uses a warm stone palette with a clean header, color-coded cost level badges (green for budget, amber for moderate, rose for luxury), activity pill tags, alternating row colors, and hover states. Annual visitors are formatted with `.toLocaleString()` for readability.

**What I'd do with more time:**
- Move search filtering server-side via query params on the API
- Add debounce to the search input
- Add sorting by column
- Added lazy loading for destination images using Next.js `<Image>` with `loading="lazy"`. Images are fetched from Unsplash via the `source.unsplash.com` API using destination-specific search terms. Added `imageUrl` as a nullable text column to the schema and ran a new migration. Next.js requires external image domains to be whitelisted in `next.config.js` — added `source.unsplash.com` to `remotePatterns`. The image cell falls back to a neutral placeholder div when `imageUrl` is null, so the layout never breaks if a URL is missing.

**Accessibility improvements:**
- Added a visually hidden `<label>` for the search input via `sr-only` — placeholders disappear on type and aren't reliably announced by screen readers, so a proper label is important.
- Added `aria-label` to the Clear, Previous, and Next buttons for screen reader clarity.
- Added `role="status"` and `aria-live="polite"` to the loading and empty states so screen readers announce changes without interrupting the user.
- Added `role="alert"` to the error state so it's announced immediately.
- Added `scope="col"` to all `<th>` elements so screen readers understand they're column headers.
- Added `aria-label` to the table and wrapped pagination in a `<nav>` with `aria-label="Pagination"`.
- Added `aria-hidden="true"` to the placeholder div shown when no image is available — it's decorative and shouldn't be announced.
- Added `aria-current="page"` to the page indicator.
- Fixed `costLevelColor` to handle "premium" — it was falling through to the default gray. Added a purple badge for premium destinations.
- Accessibility was a deliberate consideration throughout, not an afterthought — informed by building explorAble, a React Native app focused on accessible outdoor trail information.

**Skeleton loader:**
Replaced the plain "Loading destinations..." text with a skeleton loader that mirrors the table structure — each column shows an animated pulsing placeholder at the correct size and position. The table header stays visible during loading so the layout doesn't shift when data arrives. The table uses `aria-busy={isLoading}` to communicate loading state to screen readers. The skeleton renders exactly `LIMIT` rows so the layout matches what will appear once data loads.