// Types for Open Data Gacha Game

// Raw dataset from Berlin Open Data CKAN API
export interface CKANResource {
  id: string;
  name: string;
  format: string;
  url: string;
  created: string;
  last_modified: string;
}

export interface CKANDataset {
  id: string;
  name: string;
  title: string;
  notes: string;
  author: string;
  author_email: string;
  maintainer: string;
  maintainer_email: string;
  license_title: string;
  license_url: string;
  url: string;
  metadata_created: string;
  metadata_modified: string;
  num_resources: number;
  num_tags: number;
  tags: { name: string }[];
  groups: { name: string; title: string }[];
  organization: {
    name: string;
    title: string;
  };
  resources: CKANResource[];
}

// Rarity based on 5-Star Open Data Score
export type Rarity = 1 | 2 | 3 | 4 | 5;

// Card stats computed from dataset metadata
export interface CardStats {
  atk: number; // Popularity * Rarity (max 15k)
  def: number; // (Description + Files + Tags + Maintainer) * Rarity (max 15k)
}

// A card in the game
export interface Card {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  organization: string;
  rarity: Rarity;
  stats: CardStats;
  format: string; // Primary file format
  tags: string[];
  resourceCount: number;
  hasMaintainerEmail: boolean;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// Player's card collection
export interface OwnedCard {
  card: Card;
  quantity: number;
  firstObtained: string;
}

// Pack types
export type PackType = "standard" | "gold" | "rainbow";

// Game state stored in localStorage
export interface GameState {
  collection: OwnedCard[];
  totalPacks: number; // Total packs opened
  freePulls: number; // Current available pulls (max 10)
  lastPullRegenTime: string; // ISO timestamp for last regen
  pityCounter: number; // Counts packs since last epic (resets at 10)
  legendaryPityCounter: number; // Counts packs since last legendary (resets at 100)
}

// Battle state
export interface BattleState {
  playerDeck: Card[];
  opponentDeck: Card[];
  playerScore: number;
  opponentScore: number;
  currentRound: number;
  selectedStat: "atk" | "def" | null;
  isPlayerTurn: boolean;
  roundHistory: RoundResult[];
  gameOver: boolean;
  winner: "player" | "opponent" | "tie" | null;
}

export interface RoundResult {
  round: number;
  playerCard: Card;
  opponentCard: Card;
  selectedStat: "atk" | "def";
  playerValue: number;
  opponentValue: number;
  winner: "player" | "opponent" | "tie";
}

// Gacha pull result
export interface PullResult {
  card: Card;
  isNew: boolean;
  rarity: Rarity;
}

// Format to 5-star mapping (Tim Berners-Lee scale)
export const FORMAT_SCORES: Record<string, Rarity> = {
  // 1 Star: Available on the web (any format)
  pdf: 1,
  doc: 1,
  docx: 1,
  jpg: 1,
  jpeg: 1,
  png: 1,
  gif: 1,
  zip: 1,
  html: 1,

  // 2 Stars: Machine-readable structured data
  xls: 2,
  xlsx: 2,

  // 3 Stars: Non-proprietary format
  csv: 3,
  tsv: 3,
  txt: 3,
  xml: 3,
  ods: 3,

  // 4 Stars: Uses URIs to identify things
  json: 4,
  geojson: 4,
  kml: 4,
  gpx: 4,
  wms: 4,
  wfs: 4,
  api: 4,

  // 5 Stars: Linked data
  rdf: 5,
  sparql: 5,
  n3: 5,
  turtle: 5,
  jsonld: 5,
  "json-ld": 5,
};

// Rarity colors for UI
export const RARITY_COLORS: Record<
  Rarity,
  { border: string; bg: string; text: string; glow: string }
> = {
  1: {
    border: "border-zinc-400",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    glow: "shadow-zinc-400/30",
  },
  2: {
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    glow: "shadow-emerald-400/30",
  },
  3: {
    border: "border-sky-400",
    bg: "bg-sky-50",
    text: "text-sky-600",
    glow: "shadow-sky-400/30",
  },
  4: {
    border: "border-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-600",
    glow: "shadow-amber-400/40",
  },
  5: {
    border: "border-rose-400",
    bg: "bg-gradient-to-br from-rose-50 to-amber-50",
    text: "text-rose-600",
    glow: "shadow-rose-400/50",
  },
};

// Rarity names
export const RARITY_NAMES: Record<Rarity, string> = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
};

// Rarity short codes for table display
export const RARITY_SHORT: Record<Rarity, string> = {
  1: "C",
  2: "UC",
  3: "R",
  4: "E",
  5: "L",
};

// Category icons mapping
export const CATEGORY_ICONS: Record<string, string> = {
  umwelt: "Leaf",
  verkehr: "Car",
  soziales: "Users",
  wirtschaft: "TrendingUp",
  gesundheit: "Heart",
  bildung: "GraduationCap",
  verwaltung: "Building",
  infrastruktur: "Construction",
  kultur: "Music",
  geographie: "Map",
  default: "Database",
};
