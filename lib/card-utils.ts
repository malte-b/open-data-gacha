import { Card, CKANDataset, Rarity, FORMAT_SCORES, OwnedCard } from "./types";

// Calculate the 5-star Open Data score based on file formats
export function calculateRarity(resources: CKANDataset["resources"]): Rarity {
  if (!resources || resources.length === 0) return 1;

  // Find the highest-scoring format among all resources
  let maxScore: Rarity = 1;

  for (const resource of resources) {
    const format = resource.format?.toLowerCase().trim() || "";
    const score = FORMAT_SCORES[format] || 1;
    if (score > maxScore) {
      maxScore = score as Rarity;
    }
  }

  return maxScore;
}

// Calculate ATK based on popularity metrics
export function calculateATK(dataset: CKANDataset, rarity: Rarity): number {
  const resourceBonus = Math.min(dataset.num_resources * 200, 1000);

  const lastModified = new Date(dataset.metadata_modified);
  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24),
  );
  const recencyBonus =
    daysSinceUpdate < 365 ? 500 : daysSinceUpdate < 730 ? 250 : 100;

  const tagBonus = Math.min(dataset.num_tags * 100, 500);

  const hash = dataset.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const basePopularity = 500 + (hash % 1000);

  const rawATK =
    (basePopularity + resourceBonus + recencyBonus + tagBonus) * (rarity / 5);

  return Math.min(Math.round(rawATK), 15000);
}

// Calculate DEF (Depth + Effort) based on documentation quality
export function calculateDEF(dataset: CKANDataset, rarity: Rarity): number {
  const description = dataset.notes || "";
  const descriptionScore = Math.min(description.length / 10, 1000);
  const fileScore = Math.min(dataset.num_resources * 300, 1500);
  const tagScore = Math.min(dataset.num_tags * 150, 750);
  const maintainerBonus = dataset.maintainer_email ? 500 : 0;

  const rawDEF =
    (descriptionScore + fileScore + tagScore + maintainerBonus) * (rarity / 5);

  return Math.min(Math.round(rawDEF), 15000);
}

// Calculate quality score (0-100) for sorting
export function calculateQualityScore(card: Card): number {
  const rarityScore = card.rarity * 10; // 10-50
  const atkScore = Math.min(card.stats.atk / 300, 25); // 0-25
  const defScore = Math.min(card.stats.def / 300, 25); // 0-25
  return Math.round(rarityScore + atkScore + defScore);
}

// Get primary format from resources
export function getPrimaryFormat(resources: CKANDataset["resources"]): string {
  if (!resources || resources.length === 0) return "unknown";

  let bestFormat = resources[0].format || "unknown";
  let bestScore = 0;

  for (const resource of resources) {
    const format = resource.format?.toLowerCase().trim() || "";
    const score = FORMAT_SCORES[format] || 0;
    if (score > bestScore) {
      bestScore = score;
      bestFormat = resource.format || "unknown";
    }
  }

  return bestFormat.toUpperCase();
}

// Detect category from groups or tags
export function detectCategory(dataset: CKANDataset): string {
  const groups = dataset.groups || [];
  const tags = dataset.tags || [];

  if (groups.length > 0) {
    return groups[0].title || groups[0].name || "Sonstiges";
  }

  const tagNames = tags.map((t) => t.name.toLowerCase());

  if (
    tagNames.some(
      (t) => t.includes("umwelt") || t.includes("klima") || t.includes("grün"),
    )
  ) {
    return "Umwelt";
  }
  if (tagNames.some((t) => t.includes("verkehr") || t.includes("mobil"))) {
    return "Verkehr";
  }
  if (tagNames.some((t) => t.includes("sozial") || t.includes("bevölkerung"))) {
    return "Soziales";
  }
  if (tagNames.some((t) => t.includes("wirtschaft") || t.includes("arbeit"))) {
    return "Wirtschaft";
  }
  if (tagNames.some((t) => t.includes("gesundheit"))) {
    return "Gesundheit";
  }
  if (tagNames.some((t) => t.includes("bildung") || t.includes("schule"))) {
    return "Bildung";
  }

  return "Sonstiges";
}

// Transform CKAN dataset to Card
export function datasetToCard(dataset: CKANDataset): Card {
  const rarity = calculateRarity(dataset.resources);
  const atk = calculateATK(dataset, rarity);
  const def = calculateDEF(dataset, rarity);

  return {
    id: dataset.id,
    name: dataset.name,
    title: dataset.title || dataset.name,
    description:
      (dataset.notes || "").slice(0, 300) +
      (dataset.notes?.length > 300 ? "..." : ""),
    category: detectCategory(dataset),
    organization: dataset.organization?.title || "Unbekannt",
    rarity,
    stats: { atk, def },
    format: getPrimaryFormat(dataset.resources),
    tags: dataset.tags?.map((t) => t.name).slice(0, 5) || [],
    resourceCount: dataset.num_resources || 0,
    hasMaintainerEmail: !!dataset.maintainer_email,
    url: `https://daten.berlin.de/datensaetze/${dataset.name}`,
    createdAt: dataset.metadata_created,
    updatedAt: dataset.metadata_modified,
  };
}

// Gacha pull probability weights by rarity
const RARITY_WEIGHTS: Record<Rarity, number> = {
  1: 50, // 50% Common
  2: 25, // 25% Uncommon
  3: 15, // 15% Rare
  4: 8, // 8% Epic
  5: 2, // 2% Legendary
};

// Weighted random selection
export function weightedRandomRarity(): Rarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return parseInt(rarity) as Rarity;
    }
  }

  return 1;
}

// Select a random card from pool with rarity preference, avoiding duplicates
export function selectCardFromPool(
  cards: Card[],
  targetRarity: Rarity,
  collection: OwnedCard[] = [],
  alreadyPulledIds: Set<string> = new Set(),
): Card {
  const ownedIds = new Set(collection.map((oc) => oc.card.id));

  // Filter cards by rarity
  const matchingCards = cards.filter((c) => c.rarity === targetRarity);

  // Get pool to choose from
  const pool = matchingCards.length > 0 ? matchingCards : cards;

  // First, try to find cards not yet owned AND not pulled this session
  const freshCards = pool.filter(
    (c) => !ownedIds.has(c.id) && !alreadyPulledIds.has(c.id),
  );
  if (freshCards.length > 0) {
    return freshCards[Math.floor(Math.random() * freshCards.length)];
  }

  // Second, try cards not yet pulled in this session (but may be owned)
  const notPulledThisSession = pool.filter((c) => !alreadyPulledIds.has(c.id));
  if (notPulledThisSession.length > 0) {
    return notPulledThisSession[
      Math.floor(Math.random() * notPulledThisSession.length)
    ];
  }

  // Third, try any card not owned
  const notOwned = pool.filter((c) => !ownedIds.has(c.id));
  if (notOwned.length > 0) {
    return notOwned[Math.floor(Math.random() * notOwned.length)];
  }

  // If all cards of this rarity are owned, try other rarities for fresh cards
  const allFreshCards = cards.filter(
    (c) => !ownedIds.has(c.id) && !alreadyPulledIds.has(c.id),
  );
  if (allFreshCards.length > 0) {
    // Prefer cards close to target rarity
    const sorted = allFreshCards.sort(
      (a, b) =>
        Math.abs(a.rarity - targetRarity) - Math.abs(b.rarity - targetRarity),
    );
    return sorted[0];
  }

  // All cards owned - return random from pool (duplicate is unavoidable)
  return pool[Math.floor(Math.random() * pool.length)];
}
