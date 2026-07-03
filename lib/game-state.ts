"use client";

import { GameState, Card, OwnedCard, PackType } from "./types";

const STORAGE_KEY = "open-data-gacha-state";
const MAX_FREE_PULLS = 10;
const PULL_REGEN_MS = 60 * 1000; // 1 minute per pull
const CARDS_PER_PACK = 5;
const GOLD_PACK_INTERVAL = 10; // Every 10 packs
const RAINBOW_PACK_INTERVAL = 100; // Every 100 packs

// Default game state
const defaultState: GameState = {
  collection: [],
  totalPacks: 0,
  freePulls: MAX_FREE_PULLS,
  lastPullRegenTime: new Date().toISOString(),
  pityCounter: 0,
  legendaryPityCounter: 0,
};

// Load game state from localStorage
export function loadGameState(): GameState {
  if (typeof window === "undefined") return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migrate from old currency-based system to new free pulls system
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: GameState = {
        collection: parsed.collection ?? [],
        totalPacks: parsed.totalPacks ?? parsed.totalPulls ?? 0,
        freePulls: parsed.freePulls ?? MAX_FREE_PULLS,
        lastPullRegenTime: parsed.lastPullRegenTime ?? new Date().toISOString(),
        pityCounter: parsed.pityCounter ?? 0,
        legendaryPityCounter: parsed.legendaryPityCounter ?? 0,
      };

      // Calculate regenerated pulls since last visit
      return regeneratePulls(state);
    }
  } catch (error) {
    console.error("Failed to load game state:", error);
  }

  return defaultState;
}

// Regenerate pulls based on time elapsed
export function regeneratePulls(state: GameState): GameState {
  if (state.freePulls >= MAX_FREE_PULLS) {
    return { ...state, lastPullRegenTime: new Date().toISOString() };
  }

  const now = Date.now();
  const lastRegen = new Date(state.lastPullRegenTime).getTime();
  const elapsed = now - lastRegen;
  const pullsToRegen = Math.floor(elapsed / PULL_REGEN_MS);

  if (pullsToRegen > 0) {
    const newPulls = Math.min(MAX_FREE_PULLS, state.freePulls + pullsToRegen);
    const remainderMs = elapsed % PULL_REGEN_MS;
    const newRegenTime = new Date(now - remainderMs).toISOString();

    return {
      ...state,
      freePulls: newPulls,
      lastPullRegenTime: newRegenTime,
    };
  }

  return state;
}

// Save game state to localStorage
export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
}

// Add a card to collection
export function addCardToCollection(
  state: GameState,
  card: Card,
): { newState: GameState; isNew: boolean } {
  const existingIndex = state.collection.findIndex(
    (oc) => oc.card.id === card.id,
  );
  let isNew = false;

  let newCollection: OwnedCard[];

  if (existingIndex >= 0) {
    // Increment quantity
    newCollection = state.collection.map((oc, i) =>
      i === existingIndex ? { ...oc, quantity: oc.quantity + 1 } : oc,
    );
  } else {
    // Add new card
    isNew = true;
    newCollection = [
      ...state.collection,
      {
        card,
        quantity: 1,
        firstObtained: new Date().toISOString(),
      },
    ];
  }

  return {
    newState: { ...state, collection: newCollection },
    isNew,
  };
}

// Check if can open a pack
export function canOpenPack(state: GameState): boolean {
  return state.freePulls >= 1;
}

// Deduct pull for opening a pack
export function deductPull(state: GameState): GameState {
  return {
    ...state,
    freePulls: state.freePulls - 1,
    totalPacks: state.totalPacks + 1,
    lastPullRegenTime:
      state.freePulls === MAX_FREE_PULLS
        ? new Date().toISOString()
        : state.lastPullRegenTime,
  };
}

// Get current pack type based on pity
export function getPackType(state: GameState): PackType {
  const nextPackNumber = state.totalPacks + 1;

  if (nextPackNumber % RAINBOW_PACK_INTERVAL === 0) {
    return "rainbow";
  }
  if (nextPackNumber % GOLD_PACK_INTERVAL === 0) {
    return "gold";
  }
  return "standard";
}

// Update pity counters after opening pack
export function updatePityCounters(
  state: GameState,
  hadEpic: boolean,
  hadLegendary: boolean,
): GameState {
  return {
    ...state,
    pityCounter: hadEpic ? 0 : state.pityCounter + 1,
    legendaryPityCounter: hadLegendary ? 0 : state.legendaryPityCounter + 1,
  };
}

// Calculate time until next pull regenerates
export function getTimeUntilNextPull(state: GameState): number {
  if (state.freePulls >= MAX_FREE_PULLS) return 0;

  const now = Date.now();
  const lastRegen = new Date(state.lastPullRegenTime).getTime();
  const elapsed = now - lastRegen;
  const remaining = PULL_REGEN_MS - elapsed;

  return Math.max(0, remaining);
}

// Get collection stats
export function getCollectionStats(state: GameState) {
  const uniqueCards = state.collection.length;
  const totalCards = state.collection.reduce((sum, oc) => sum + oc.quantity, 0);

  const byRarity = {
    1: state.collection.filter((oc) => oc.card.rarity === 1).length,
    2: state.collection.filter((oc) => oc.card.rarity === 2).length,
    3: state.collection.filter((oc) => oc.card.rarity === 3).length,
    4: state.collection.filter((oc) => oc.card.rarity === 4).length,
    5: state.collection.filter((oc) => oc.card.rarity === 5).length,
  };

  const avgATK =
    state.collection.length > 0
      ? Math.round(
          state.collection.reduce((sum, oc) => sum + oc.card.stats.atk, 0) /
            state.collection.length,
        )
      : 0;

  const avgDEF =
    state.collection.length > 0
      ? Math.round(
          state.collection.reduce((sum, oc) => sum + oc.card.stats.def, 0) /
            state.collection.length,
        )
      : 0;

  return {
    uniqueCards,
    totalCards,
    byRarity,
    avgATK,
    avgDEF,
    totalPacks: state.totalPacks,
    freePulls: state.freePulls,
  };
}

// Constants export
export const GAME_CONSTANTS = {
  MAX_FREE_PULLS,
  PULL_REGEN_MS,
  CARDS_PER_PACK,
  GOLD_PACK_INTERVAL,
  RAINBOW_PACK_INTERVAL,
};
