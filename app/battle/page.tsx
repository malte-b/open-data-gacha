"use client";

import { useState, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { NavBar } from "@/components/nav-bar";
import { DataCard } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/hooks/use-game-state";
import { useCards } from "@/hooks/use-cards";
import { Card, BattleState, RoundResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Swords,
  Shield,
  Trophy,
  RotateCcw,
  Play,
  Crown,
  Zap,
  Users,
  AlertCircle,
} from "lucide-react";

const ROUNDS_TO_WIN = 5;
const DECK_SIZE = 5;

// Shuffle array
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create opponent deck from card pool
function createOpponentDeck(cardPool: Card[], deckSize: number): Card[] {
  const shuffled = shuffle(cardPool);
  return shuffled.slice(0, deckSize);
}

export default function BattlePage() {
  const { state, isHydrated } = useGameState();
  const { cards: allCards, isLoading: cardsLoading } = useCards();

  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(
    null,
  );

  const playerCards = state?.collection.map((oc) => oc.card) ?? [];
  const hasEnoughCards = playerCards.length >= DECK_SIZE;

  // Start new battle
  const startBattle = useCallback(() => {
    if (!hasEnoughCards || allCards.length < DECK_SIZE) return;

    const playerDeck = shuffle(playerCards).slice(0, DECK_SIZE);
    const opponentDeck = createOpponentDeck(allCards, DECK_SIZE);

    setBattleState({
      playerDeck,
      opponentDeck,
      playerScore: 0,
      opponentScore: 0,
      currentRound: 1,
      selectedStat: null,
      isPlayerTurn: true, // Player always starts
      roundHistory: [],
      gameOver: false,
      winner: null,
    });
    setLastRoundResult(null);
    setShowRoundResult(false);
  }, [hasEnoughCards, playerCards, allCards]);

  // Select stat to battle with
  const selectStat = useCallback(
    (stat: "atk" | "def") => {
      if (!battleState || battleState.gameOver || isAnimating) return;
      if (!battleState.isPlayerTurn) return;

      setIsAnimating(true);

      const playerCard = battleState.playerDeck[0];
      const opponentCard = battleState.opponentDeck[0];

      const playerValue =
        stat === "atk" ? playerCard.stats.atk : playerCard.stats.def;
      const opponentValue =
        stat === "atk" ? opponentCard.stats.atk : opponentCard.stats.def;

      let roundWinner: "player" | "opponent" | "tie";
      if (playerValue > opponentValue) {
        roundWinner = "player";
      } else if (opponentValue > playerValue) {
        roundWinner = "opponent";
      } else {
        roundWinner = "tie";
      }

      const roundResult: RoundResult = {
        round: battleState.currentRound,
        playerCard,
        opponentCard,
        selectedStat: stat,
        playerValue,
        opponentValue,
        winner: roundWinner,
      };

      setLastRoundResult(roundResult);
      setShowRoundResult(true);

      // Trigger confetti for player win
      if (roundWinner === "player") {
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { x: 0.3, y: 0.5 },
            colors: ["#38bdf8", "#22d3ee"],
          });
        }, 300);
      }

      // Update battle state after animation
      setTimeout(() => {
        setBattleState((prev) => {
          if (!prev) return null;

          const newPlayerScore =
            prev.playerScore + (roundWinner === "player" ? 1 : 0);
          const newOpponentScore =
            prev.opponentScore + (roundWinner === "opponent" ? 1 : 0);

          // Check for game over
          const gameOver =
            newPlayerScore >= ROUNDS_TO_WIN ||
            newOpponentScore >= ROUNDS_TO_WIN ||
            prev.currentRound >= DECK_SIZE;
          let winner: "player" | "opponent" | "tie" | null = null;

          if (gameOver) {
            if (newPlayerScore > newOpponentScore) {
              winner = "player";
              confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.6 },
                colors: ["#fbbf24", "#f59e0b", "#38bdf8"],
              });
            } else if (newOpponentScore > newPlayerScore) {
              winner = "opponent";
            } else {
              winner = "tie";
            }
          }

          return {
            ...prev,
            playerDeck: prev.playerDeck.slice(1),
            opponentDeck: prev.opponentDeck.slice(1),
            playerScore: newPlayerScore,
            opponentScore: newOpponentScore,
            currentRound: prev.currentRound + 1,
            selectedStat: stat,
            isPlayerTurn: roundWinner === "player", // Winner picks next stat
            roundHistory: [...prev.roundHistory, roundResult],
            gameOver,
            winner,
          };
        });

        setIsAnimating(false);
        setShowRoundResult(false);
      }, 2000);
    },
    [battleState, isAnimating],
  );

  // AI opponent selects stat
  useEffect(() => {
    if (!battleState || battleState.gameOver || isAnimating) return;
    if (battleState.isPlayerTurn) return;
    if (battleState.playerDeck.length === 0) return;

    // AI logic: pick the stat where opponent has advantage
    const opponentCard = battleState.opponentDeck[0];
    const playerCard = battleState.playerDeck[0];

    const atkAdvantage = opponentCard.stats.atk - playerCard.stats.atk;
    const defAdvantage = opponentCard.stats.def - playerCard.stats.def;

    const aiChoice: "atk" | "def" =
      atkAdvantage >= defAdvantage ? "atk" : "def";

    // Delay AI selection
    const timer = setTimeout(() => {
      // Temporarily make it player's turn to process the selection
      setBattleState((prev) => (prev ? { ...prev, isPlayerTurn: true } : null));
      selectStat(aiChoice);
    }, 1500);

    return () => clearTimeout(timer);
  }, [battleState, isAnimating, selectStat]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar freePulls={state?.freePulls ?? 0} maxPulls={10} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            Supertrumpf Kampf
          </h1>
          <p className="text-muted-foreground">
            Tritt gegen den Computer an! Waehle ATK oder DEF - der hoechste Wert
            gewinnt.
          </p>
        </div>

        {/* Not enough cards warning */}
        {isHydrated && !hasEnoughCards && (
          <div className="max-w-md mx-auto mb-8 p-6 rounded-xl bg-secondary/50 border border-border text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Nicht genug Karten</h3>
            <p className="text-muted-foreground mb-4">
              Du brauchst mindestens {DECK_SIZE} Karten in deiner Sammlung, um
              zu kaempfen. Du hast aktuell {playerCards.length} Karten.
            </p>
            <Button asChild>
              <a href="/">Mehr Karten ziehen</a>
            </Button>
          </div>
        )}

        {/* Pre-battle state */}
        {!battleState && hasEnoughCards && (
          <div className="max-w-md mx-auto text-center">
            <div className="p-8 rounded-2xl bg-secondary/30 border border-border mb-6">
              <Users className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Bereit zum Kampf?</h2>
              <p className="text-muted-foreground mb-6">
                Du spielst mit {DECK_SIZE} zufaelligen Karten aus deiner
                Sammlung gegen den Computer. Gewinne {ROUNDS_TO_WIN} Runden um
                zu siegen!
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-rose-400 mb-1">
                    <Swords className="w-4 h-4" />
                    <span className="text-sm font-medium">ATK</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Popularitaet des Datensatzes
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 text-sky-400 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">DEF</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tiefe und Dokumentation
                  </p>
                </div>
              </div>

              <Button size="lg" onClick={startBattle} disabled={cardsLoading}>
                <Play className="w-5 h-5 mr-2" />
                Kampf starten
              </Button>
            </div>
          </div>
        )}

        {/* Active battle */}
        {battleState && (
          <div className="max-w-4xl mx-auto">
            {/* Score */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Du</p>
                <p className="text-4xl font-bold text-primary">
                  {battleState.playerScore}
                </p>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">
                  Runde {Math.min(battleState.currentRound, DECK_SIZE)}/
                  {DECK_SIZE}
                </span>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Computer</p>
                <p className="text-4xl font-bold text-destructive">
                  {battleState.opponentScore}
                </p>
              </div>
            </div>

            {/* Game over */}
            {battleState.gameOver ? (
              <div className="text-center py-12">
                <div
                  className={cn(
                    "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4",
                    battleState.winner === "player"
                      ? "bg-amber-500/20"
                      : battleState.winner === "opponent"
                        ? "bg-destructive/20"
                        : "bg-secondary",
                  )}
                >
                  {battleState.winner === "player" ? (
                    <Trophy className="w-10 h-10 text-amber-400" />
                  ) : battleState.winner === "opponent" ? (
                    <Crown className="w-10 h-10 text-destructive" />
                  ) : (
                    <Zap className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>

                <h2 className="text-3xl font-bold mb-2">
                  {battleState.winner === "player" && "Sieg!"}
                  {battleState.winner === "opponent" && "Niederlage"}
                  {battleState.winner === "tie" && "Unentschieden"}
                </h2>

                <p className="text-muted-foreground mb-6">
                  Endergebnis: {battleState.playerScore} -{" "}
                  {battleState.opponentScore}
                </p>

                <div className="flex gap-4 justify-center">
                  <Button onClick={startBattle}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nochmal spielen
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/collection">Zur Sammlung</a>
                  </Button>
                </div>

                {/* Round history */}
                <div className="mt-8 max-w-lg mx-auto">
                  <h3 className="text-sm font-medium mb-3 text-left">
                    Rundenverlauf
                  </h3>
                  <div className="space-y-2">
                    {battleState.roundHistory.map((round, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-sm",
                          round.winner === "player"
                            ? "bg-primary/10"
                            : round.winner === "opponent"
                              ? "bg-destructive/10"
                              : "bg-secondary/50",
                        )}
                      >
                        <span className="truncate flex-1">
                          {round.playerCard.title.slice(0, 20)}...
                        </span>
                        <span className="px-2 font-mono">
                          {round.playerValue} vs {round.opponentValue}
                        </span>
                        <span
                          className={cn(
                            "w-16 text-right text-xs font-medium",
                            round.winner === "player"
                              ? "text-primary"
                              : round.winner === "opponent"
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {round.selectedStat.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Battle arena */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-8">
                  {/* Player card */}
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium mb-3 text-primary">
                      Deine Karte
                    </p>
                    {battleState.playerDeck[0] && (
                      <DataCard
                        card={battleState.playerDeck[0]}
                        size="md"
                        highlight={
                          showRoundResult ? lastRoundResult?.selectedStat : null
                        }
                      />
                    )}
                  </div>

                  {/* VS / Action area */}
                  <div className="flex flex-col items-center justify-center py-4">
                    {showRoundResult && lastRoundResult ? (
                      <div
                        className={cn(
                          "text-center p-4 rounded-xl",
                          lastRoundResult.winner === "player"
                            ? "bg-primary/20"
                            : lastRoundResult.winner === "opponent"
                              ? "bg-destructive/20"
                              : "bg-secondary",
                        )}
                      >
                        <p className="text-2xl font-bold mb-1">
                          {lastRoundResult.playerValue} vs{" "}
                          {lastRoundResult.opponentValue}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            lastRoundResult.winner === "player"
                              ? "text-primary"
                              : lastRoundResult.winner === "opponent"
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {lastRoundResult.winner === "player" &&
                            "Du gewinnst!"}
                          {lastRoundResult.winner === "opponent" &&
                            "Computer gewinnt"}
                          {lastRoundResult.winner === "tie" && "Unentschieden"}
                        </p>
                      </div>
                    ) : battleState.isPlayerTurn ? (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                          Waehle einen Wert:
                        </p>
                        <div className="flex flex-col gap-3">
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => selectStat("atk")}
                            disabled={isAnimating}
                            className="border-rose-500/50 hover:bg-rose-500/10"
                          >
                            <Swords className="w-5 h-5 mr-2 text-rose-400" />
                            ATK (
                            {battleState.playerDeck[0]?.stats.atk.toLocaleString()}
                            )
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => selectStat("def")}
                            disabled={isAnimating}
                            className="border-sky-500/50 hover:bg-sky-500/10"
                          >
                            <Shield className="w-5 h-5 mr-2 text-sky-400" />
                            DEF (
                            {battleState.playerDeck[0]?.stats.def.toLocaleString()}
                            )
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Computer waehlt...
                        </p>
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* Opponent card */}
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium mb-3 text-destructive">
                      Computer
                    </p>
                    {battleState.opponentDeck[0] && (
                      <DataCard
                        card={battleState.opponentDeck[0]}
                        size="md"
                        highlight={
                          showRoundResult ? lastRoundResult?.selectedStat : null
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Remaining cards indicator */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{battleState.playerDeck.length} Karten uebrig</span>
                  <span>{battleState.opponentDeck.length} Karten uebrig</span>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
