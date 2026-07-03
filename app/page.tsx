"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { NavBar } from "@/components/nav-bar";
import { DataCard } from "@/components/data-card";
import { CardPack, PackOpeningAnimation } from "@/components/card-pack";
import { RuleBook } from "@/components/rule-book";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCards } from "@/hooks/use-cards";
import { useGameState } from "@/hooks/use-game-state";
import { PullResult, RARITY_NAMES, PackType, Rarity } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Star,
  AlertCircle,
  RefreshCw,
  ChevronUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  Check,
  BookOpen,
} from "lucide-react";

// Rarity emoji indicators for copy text
const RARITY_EMOJI: Record<Rarity, string> = {
  1: "\u2B1C", // white square (C)
  2: "\u{1F7E9}", // green square (UC)
  3: "\u{1F7E6}", // blue square (R)
  4: "\u{1F7E8}", // yellow square (E)
  5: "\u{1F7E5}", // red square (L)
};

export default function GachaPage() {
  const { cards, isLoading, isError, errorMessage, total } = useCards();
  const {
    state,
    isHydrated,
    canOpen,
    nextPackType,
    timeUntilNextPull,
    openPack,
    constants,
  } = useGameState();

  const [pullResults, setPullResults] = useState<PullResult[]>([]);
  const [currentPackType, setCurrentPackType] = useState<PackType>("standard");
  const [isOpening, setIsOpening] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showRuleBook, setShowRuleBook] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Touch/swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Format time remaining
  const formatTime = (ms: number) => {
    if (!ms || ms <= 0 || !Number.isFinite(ms)) return "0s";
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  // Trigger confetti for rare+ cards
  const triggerConfetti = useCallback((rarity: number) => {
    if (rarity >= 4) {
      const colors =
        rarity === 5
          ? ["#f43f5e", "#fbbf24", "#f472b6", "#a855f7"]
          : ["#fbbf24", "#f59e0b"];

      confetti({
        particleCount: rarity === 5 ? 150 : 80,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });
    }
  }, []);

  // Handle pack opening
  const handleOpenPack = useCallback(() => {
    if (!canOpen || cards.length === 0) return;

    setIsOpening(true);
    setPullResults([]);
    setCurrentCardIndex(0);
    setCurrentPackType(nextPackType);

    // Simulate opening delay
    setTimeout(() => {
      const result = openPack(cards);
      if (result) {
        setPullResults(result.results);
        setShowResults(true);

        // Big confetti for special packs
        if (result.packType === "rainbow" || result.packType === "gold") {
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
            colors:
              result.packType === "rainbow"
                ? [
                    "#f43f5e",
                    "#a855f7",
                    "#3b82f6",
                    "#22d3d3",
                    "#22c55e",
                    "#eab308",
                  ]
                : ["#fbbf24", "#f59e0b", "#d97706"],
          });
        }

        // Confetti for highest rarity card
        const maxRarity = Math.max(...result.results.map((r) => r.rarity));
        setTimeout(() => triggerConfetti(maxRarity), 300);
      }
      setIsOpening(false);
    }, 1000);
  }, [canOpen, cards, openPack, nextPackType, triggerConfetti]);

  // Keyboard navigation
  useEffect(() => {
    if (!showResults) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "<") {
        setCurrentCardIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === ">") {
        setCurrentCardIndex((prev) =>
          Math.min(pullResults.length - 1, prev + 1),
        );
      } else if (e.key === "Escape") {
        setShowResults(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResults, pullResults.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      // Swiped left -> next card
      setCurrentCardIndex((prev) => Math.min(pullResults.length - 1, prev + 1));
    } else if (diff < -threshold) {
      // Swiped right -> previous card
      setCurrentCardIndex((prev) => Math.max(0, prev - 1));
    }
  };

  // Generate share text
  const generateShareText = () => {
    const lines = pullResults.map((r) => {
      const emoji = RARITY_EMOJI[r.rarity];
      const rarityShort = ["C", "UC", "R", "E", "L"][r.rarity - 1];
      return `${emoji}[${rarityShort}] ${r.card.title.slice(0, 30)}${r.card.title.length > 30 ? "..." : ""} ATK ${r.card.stats.atk.toLocaleString()} / DEF ${r.card.stats.def.toLocaleString()}`;
    });

    return `Open Data Gacha Ergebnis:\n\n${lines.join("\n")}\n\nhttps://open-data-gacha.vercel.app\nQuelle: Berlin Open Data (CC BY 4.0)\n#OpenDataGacha #BerlinOpenData`;
  };

  // Copy result to clipboard
  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  // Share result (native share API)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Open Data Gacha Ergebnis",
          text: generateShareText(),
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyResult();
    }
  };

  // Calculate packs until next special
  const packsUntilGold = state
    ? constants.GOLD_PACK_INTERVAL -
      (state.totalPacks % constants.GOLD_PACK_INTERVAL)
    : 10;
  const packsUntilRainbow = state
    ? constants.RAINBOW_PACK_INTERVAL -
      (state.totalPacks % constants.RAINBOW_PACK_INTERVAL)
    : 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar
        freePulls={state?.freePulls ?? 0}
        maxPulls={constants.MAX_FREE_PULLS}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Lade Datensätze...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="font-medium mb-1">Fehler beim Laden der Datensätze</p>
            {errorMessage && (
              <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
                {errorMessage}
              </p>
            )}
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-lg">
            {/* Rule Book button */}
            <div className="self-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setShowRuleBook(true)}
              >
                <BookOpen className="w-4 h-4" />
                Regelbuch
              </Button>
            </div>
            {/* Pulls counter */}
            <div
              className={cn(
                "px-6 py-3 rounded-full border-2 text-center shadow-sm",
                state?.freePulls === constants.MAX_FREE_PULLS
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Freie Pakete:
                </span>
                <span
                  className={cn(
                    "font-mono text-2xl font-black",
                    state?.freePulls === constants.MAX_FREE_PULLS
                      ? "text-emerald-600"
                      : "text-foreground",
                  )}
                >
                  {state?.freePulls ?? 0}
                </span>
                <span className="text-muted-foreground font-mono text-lg">
                  / {constants.MAX_FREE_PULLS}
                </span>
              </div>
              {state?.freePulls === constants.MAX_FREE_PULLS ? (
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  Pakete voll!
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  Nächstes Paket in {formatTime(timeUntilNextPull)}
                </p>
              )}
            </div>

            {/* Pack type indicator */}
            {nextPackType !== "standard" && (
              <div
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold animate-pulse shadow-md",
                  nextPackType === "gold" &&
                    "bg-amber-100 text-amber-800 border border-amber-300",
                  nextPackType === "rainbow" &&
                    "bg-gradient-to-r from-rose-100 via-purple-100 to-cyan-100 text-purple-800 border border-purple-300",
                )}
              >
                {nextPackType === "gold" && "Gold Pack bereit!"}
                {nextPackType === "rainbow" && "Rainbow Pack bereit!"}
              </div>
            )}

            {/* Card Pack */}
            <div className="relative py-4">
              {isOpening ? (
                <PackOpeningAnimation packType={currentPackType} />
              ) : (
                <CardPack
                  packType={nextPackType}
                  onClick={handleOpenPack}
                  disabled={!canOpen || cards.length === 0}
                />
              )}
            </div>

            {/* Tap to open instruction */}
            {canOpen && !isOpening && (
              <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm uppercase tracking-wider font-medium">
                  Antippen zum Öffnen
                </span>
                <ChevronUp className="w-4 h-4" />
              </div>
            )}

            {/* Progress to special packs */}
            <div className="flex gap-8 text-xs text-muted-foreground mt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow" />
                  <span className="font-medium">Gold Pack</span>
                </div>
                <span className="font-mono">
                  {packsUntilGold === 10
                    ? "Jetzt!"
                    : `in ${packsUntilGold} Paketen`}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 shadow" />
                  <span className="font-medium">Rainbow Pack</span>
                </div>
                <span className="font-mono">
                  {packsUntilRainbow === 100
                    ? "Jetzt!"
                    : `in ${packsUntilRainbow} Paketen`}
                </span>
              </div>
            </div>

            {/* Stats */}
            {isHydrated && state && (
              <div className="flex gap-6 text-sm text-muted-foreground mt-2">
                <span>{state.collection.length} Karten gesammelt</span>
                <span>{state.totalPacks} Pakete geöffnet</span>
              </div>
            )}
          </div>
        )}

        {/* Rarity Guide */}
        <div className="mt-12 w-full max-w-3xl">
          <h2 className="text-lg font-bold mb-3 text-center">
            Seltenheits-System
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-4">
            Basierend auf dem Tim Berners-Lee 5-Star Open Data Score
          </p>
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as const).map((rarity) => (
              <div
                key={rarity}
                className={cn(
                  "p-2 rounded-lg border text-center shadow-sm",
                  `card-rarity-${rarity}`,
                )}
              >
                <div className="flex justify-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-2.5 h-2.5",
                        i <= rarity ? "star fill-current" : "star-empty",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium">{RARITY_NAMES[rarity]}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Results Modal - Swipeable Carousel */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-background">
          <DialogTitle className="sr-only">
            Ergebnis: {pullResults.length} neue Karten
          </DialogTitle>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {/* Back button — prominent, replaces the small X */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-medium"
              onClick={() => setShowResults(false)}
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück zu Paketen
            </Button>

            {/* Counter */}
            <span className="font-mono font-bold tabular-nums">
              {currentCardIndex + 1} / {pullResults.length}
            </span>

            {/* Share buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleCopyResult}
                title="Ergebnis kopieren"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleShare}
                title="Teilen"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Swipe instruction */}
          <p className="text-center text-xs text-muted-foreground pt-2 pb-0">
            Swipe links/rechts oder klicke die Seitenflächen
          </p>

          {/* Card carousel with always-visible nav zones */}
          <div
            className="relative h-[420px] swipe-area"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Card stack */}
            <div className="absolute inset-0 flex items-center justify-center card-stack">
              {pullResults.map((result, i) => {
                const offset = i - currentCardIndex;
                const isVisible = Math.abs(offset) <= 2;
                if (!isVisible) return null;
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute transition-all duration-300 card-stack-item",
                      offset === 0 && "z-30",
                      offset === 1 && "z-20",
                      offset === -1 && "z-20",
                      Math.abs(offset) === 2 && "z-10",
                    )}
                    style={{
                      transform: `translateX(${offset * 20}px) scale(${1 - Math.abs(offset) * 0.08})`,
                      opacity: offset === 0 ? 1 : 0.55,
                      filter: offset !== 0 ? "brightness(0.8)" : "none",
                    }}
                  >
                    <div className="relative">
                      <DataCard
                        card={result.card}
                        size="lg"
                        animate={offset === 0}
                        showFullDescription={offset === 0}
                      />
                      {result.isNew && offset === 0 && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                          NEU!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left nav zone — always visible outline */}
            <button
              className={cn(
                "absolute left-0 top-0 bottom-0 w-14 z-40",
                "flex items-center justify-center",
                "border-r-2 border-dashed border-border/60",
                "bg-secondary/20 hover:bg-secondary/40",
                "transition-colors duration-150",
                "rounded-l-none",
                currentCardIndex === 0 && "opacity-30 cursor-not-allowed",
              )}
              onClick={() =>
                setCurrentCardIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentCardIndex === 0}
              aria-label="Vorherige Karte"
            >
              <ChevronLeft className="w-6 h-6 text-foreground/70" />
            </button>

            {/* Right nav zone — always visible outline */}
            <button
              className={cn(
                "absolute right-0 top-0 bottom-0 w-14 z-40",
                "flex items-center justify-center",
                "border-l-2 border-dashed border-border/60",
                "bg-secondary/20 hover:bg-secondary/40",
                "transition-colors duration-150",
                currentCardIndex === pullResults.length - 1 &&
                  "opacity-30 cursor-not-allowed",
              )}
              onClick={() =>
                setCurrentCardIndex((prev) =>
                  Math.min(pullResults.length - 1, prev + 1),
                )
              }
              disabled={currentCardIndex === pullResults.length - 1}
              aria-label="Nächste Karte"
            >
              <ChevronRight className="w-6 h-6 text-foreground/70" />
            </button>
          </div>

          {/* Card indicator dots */}
          <div className="flex justify-center gap-1.5 py-2">
            {pullResults.map((result, i) => (
              <button
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  i === currentCardIndex
                    ? "scale-125"
                    : "opacity-50 hover:opacity-75",
                  result.rarity === 1 && "bg-zinc-400",
                  result.rarity === 2 && "bg-emerald-500",
                  result.rarity === 3 && "bg-sky-500",
                  result.rarity === 4 && "bg-amber-500",
                  result.rarity === 5 && "bg-rose-500",
                )}
                onClick={() => setCurrentCardIndex(i)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t">
            <Button
              className="flex-1"
              onClick={handleCopyResult}
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Kopiert!" : "Ergebnis kopieren"}
            </Button>
            <Button className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Teilen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Book modal */}
      <RuleBook
        open={showRuleBook}
        onOpenChange={setShowRuleBook}
        totalCards={total}
      />
    </div>
  );
}
