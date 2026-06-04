# Discussion

## Section 1: Project Setup

The original repo committed a `.env` file containing a database connection string. This is a security issue — secrets should never be in version control, even in a private repo, because they persist in git history. I added `.env` to `.gitignore`, renamed the local file to `.env.local` (which was already gitignored by the Next.js default), and created a `.env.example` to document the required environment variables for anyone setting up the project.

Added a `.prettierrc` for consistent code formatting across the team.

Added a `docker-compose.yml` so developers can spin up a local PostgreSQL instance without needing to install or configure one manually — `docker compose up -d` is all that's needed to get a database running. The compose config matches the default values in `.env.example` so everything connects out of the box. After starting the container, run `npm run generate` to generate migration files from the schema, then `npm run migrate:up` to create the tables, and hit `POST /api/seed` to populate the data.

One thing worth noting: the `migrate:up` script runs with plain Node, not through Next.js, so it does not automatically pick up `.env.local` the way the dev server does. Next.js handles env file loading itself, but bare Node scripts do not have that behavior. The workaround is to pass the variable inline (`DATABASE_URL=... npm run migrate:up`) or use a package like `dotenv` to load the env file explicitly in the script. I opted for the inline approach to keep the setup simple and documented it in the README.

The app renders an empty table on first load until the seed endpoint is called — this is expected behavior since the database starts empty. Running `POST /api/seed` populates the destinations and the UI updates on next load.

## Section 2: Database & API

## Section 3: User Interface

The existing `page.tsx` had several issues I identified through code review and checking the browser console:

**Bugs fixed:**
- `averageDailyBudget` and `annualVisitors` are numbers, not strings — calling `.includes()` on them would throw a TypeError at runtime. Fixed by wrapping in `String()`.
- `activities.includes(searchTerm)` was checking whether the array contained an exact match for the search term, which would never work for partial matches. Fixed with `.some((a) => a.toLowerCase().includes(term))`.
- Search was case-sensitive, so searching "peru" returned no results even though "Peru" exists. Fixed by normalizing both sides to lowercase.
- Direct DOM manipulation via `document.getElementById("search-term").innerHTML` bypasses React's virtual DOM and is an XSS vector. Replaced with a controlled input using a `searchTerm` state variable.
- `<thead>` was missing a `<tr>` wrapper around the `<th>` elements — invalid HTML per spec.
- Missing `key` props on mapped `<tr>` and activity `<div>` elements, causing React warnings.

**What I'd do with more time:**
- Move filtering server-side via query params on the API rather than loading all records client-side
- Add debounce to the search input to avoid filtering on every keystroke
- Add loading and empty states
- Add TypeScript types throughout
- Add pagination for large datasets