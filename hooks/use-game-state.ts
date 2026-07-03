"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, Card, PullResult, PackType } from "@/lib/types";
import {
  loadGameState,
  saveGameState,
  regeneratePulls,
  addCardToCollection,
  canOpenPack,
  deductPull,
  getPackType,
  updatePityCounters,
  getTimeUntilNextPull,
  getCollectionStats,
  GAME_CONSTANTS,
} from "@/lib/game-state";
import { weightedRandomRarity, selectCardFromPool } from "@/lib/card-utils";

export function useGameState() {
  const [state, setState] = useState<GameState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [timeUntilNextPull, setTimeUntilNextPull] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load state on mount
  useEffect(() => {
    setState(loadGameState());
    setIsHydrated(true);
  }, []);

  // Save state on change
  useEffect(() => {
    if (state && isHydrated) {
      saveGameState(state);
    }
  }, [state, isHydrated]);

  // Timer for pull regeneration
  useEffect(() => {
    if (!state || !isHydrated) return;

    const updateTimer = () => {
      const remaining = getTimeUntilNextPull(state);
      setTimeUntilNextPull(remaining);

      // Regenerate pulls if timer hits 0
      if (remaining === 0 && state.freePulls < GAME_CONSTANTS.MAX_FREE_PULLS) {
        setState(regeneratePulls(state));
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state, isHydrated]);

  // Get pack type for next pack
  const nextPackType = state ? getPackType(state) : "standard";

  // Open a pack (5 cards) - strongly avoiding duplicates
  const openPack = useCallback(
    (
      cardPool: Card[],
    ): { results: PullResult[]; packType: PackType } | null => {
      if (!state || cardPool.length === 0) return null;
      if (!canOpenPack(state)) return null;

      const packType = getPackType(state);
      const results: PullResult[] = [];
      let currentState = deductPull(state);
      let hadEpic = false;
      let hadLegendary = false;

      // Track cards already pulled in this pack to avoid within-pack duplicates
      const alreadyPulledIds = new Set<string>();

      // Generate 5 cards
      for (let i = 0; i < GAME_CONSTANTS.CARDS_PER_PACK; i++) {
        let rarity = weightedRandomRarity();

        // Pity system for last card in pack
        if (i === GAME_CONSTANTS.CARDS_PER_PACK - 1) {
          // Rainbow pack: guaranteed legendary
          if (packType === "rainbow") {
            rarity = 5;
          }
          // Gold pack: guaranteed epic (4) or better
          else if (packType === "gold" && rarity < 4) {
            rarity = 4;
          }
          // Regular pity: if no epic in 9 packs, guarantee one
          else if (
            currentState.pityCounter >= GAME_CONSTANTS.GOLD_PACK_INTERVAL - 1 &&
            rarity < 4
          ) {
            rarity = 4;
          }
        }

        // Select card, avoiding duplicates (pass collection and already pulled IDs)
        const card = selectCardFromPool(
          cardPool,
          rarity,
          currentState.collection,
          alreadyPulledIds,
        );
        alreadyPulledIds.add(card.id);

        const { newState, isNew } = addCardToCollection(currentState, card);
        currentState = newState;

        if (card.rarity >= 4) hadEpic = true;
        if (card.rarity >= 5) hadLegendary = true;

        results.push({ card, isNew, rarity: card.rarity });
      }

      // Update pity counters
      currentState = updatePityCounters(currentState, hadEpic, hadLegendary);
      setState(currentState);

      return { results, packType };
    },
    [state],
  );

  // Reset game
  const resetGame = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("open-data-gacha-state");
      setState(loadGameState());
    }
  }, []);

  return {
    state,
    isHydrated,
    stats: state ? getCollectionStats(state) : null,
    canOpen: state ? canOpenPack(state) : false,
    nextPackType,
    timeUntilNextPull,
    openPack,
    resetGame,
    constants: GAME_CONSTANTS,
  };
}
