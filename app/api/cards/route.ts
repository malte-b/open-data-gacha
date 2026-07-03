import { NextResponse } from "next/server";
import { datasetToCard } from "@/lib/card-utils";
import { Card, CKANDataset } from "@/lib/types";
import { SEED_DATASETS } from "@/lib/seed-data";

const BERLIN_CKAN_API =
  "https://datenregister.berlin.de/api/3/action/package_search";
const GOVDATA_CKAN_API = "https://ckan.govdata.de/api/3/action/package_search";
const CACHE_DURATION = 3600; // 1 hour
const FETCH_TIMEOUT = 12000; // 12 second timeout per batch

// In-memory cache
let cachedCards: Card[] | null = null;
let cacheTimestamp = 0;

function buildSeedCards(): Card[] {
  return SEED_DATASETS.map((dataset) => datasetToCard(dataset));
}

// Fetch one page from a CKAN endpoint
async function fetchCKANPage(
  baseUrl: string,
  params: Record<string, string>,
  start: number,
  rows: number,
): Promise<{ results: CKANDataset[]; total: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  const url = new URL(baseUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("start", String(start));

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.success || !data.result?.results)
      throw new Error("Invalid CKAN response");

    return {
      results: data.result.results as CKANDataset[],
      total: data.result.count as number,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Fetch all pages from a CKAN endpoint concurrently
async function fetchAllCKANDatasets(
  baseUrl: string,
  params: Record<string, string> = {},
  maxDatasets = 3000,
): Promise<CKANDataset[]> {
  const PAGE_SIZE = 1000;

  // Fetch first page to get total count
  const firstPage = await fetchCKANPage(baseUrl, params, 0, PAGE_SIZE);
  const total = Math.min(firstPage.total, maxDatasets);
  const allDatasets = [...firstPage.results];

  if (total <= PAGE_SIZE) return allDatasets;

  // Fetch remaining pages concurrently
  const remainingPages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
  const pagePromises = Array.from({ length: remainingPages }, (_, i) =>
    fetchCKANPage(baseUrl, params, (i + 1) * PAGE_SIZE, PAGE_SIZE).then(
      (r) => r.results,
    ),
  );

  const pages = await Promise.allSettled(pagePromises);
  for (const page of pages) {
    if (page.status === "fulfilled") allDatasets.push(...page.value);
  }

  return allDatasets;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "true";
  const now = Date.now();

  // Return cached data if valid
  if (!refresh && cachedCards && now - cacheTimestamp < CACHE_DURATION * 1000) {
    return NextResponse.json({
      success: true,
      cards: cachedCards,
      fromCache: true,
      count: cachedCards.length,
    });
  }

  try {
    // Fetch Berlin Open Data (all ~2603 datasets) and GovData Berlin in parallel
    const [berlinDatasets, govDataDatasets] = await Promise.allSettled([
      fetchAllCKANDatasets(BERLIN_CKAN_API, {}, 3000),
      fetchAllCKANDatasets(
        GOVDATA_CKAN_API,
        { fq: "organization:berlin-open-data" },
        1000,
      ),
    ]);

    const berlin =
      berlinDatasets.status === "fulfilled" ? berlinDatasets.value : [];
    const govdata =
      govDataDatasets.status === "fulfilled" ? govDataDatasets.value : [];

    if (berlin.length === 0 && govdata.length === 0) {
      throw new Error("Both sources returned 0 datasets");
    }

    // Merge and deduplicate by dataset name (Berlin is authoritative)
    const berlinNames = new Set(berlin.map((d) => d.name));
    const uniqueGovdata = govdata.filter((d) => !berlinNames.has(d.name));
    const merged = [...berlin, ...uniqueGovdata];

    // Transform to cards
    const cards = merged.map((dataset) => datasetToCard(dataset));

    cachedCards = cards;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      cards,
      fromCache: false,
      count: cards.length,
      total: merged.length,
      sources: {
        berlin: berlin.length,
        govdata: uniqueGovdata.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch datasets:", error);

    if (cachedCards) {
      return NextResponse.json({
        success: true,
        cards: cachedCards,
        fromCache: true,
        stale: true,
        count: cachedCards.length,
        total: cachedTotal || cachedCards.length,
      });
    }

    const seedCards = buildSeedCards();
    cachedCards = seedCards;
    cachedTotal = seedCards.length;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      cards: seedCards,
      fromCache: false,
      count: seedCards.length,
      total: seedCards.length,
      source: "seed",
    });
  }
}
