"use client";

import { useState, useMemo } from "react";
import { NavBar } from "@/components/nav-bar";
import { DataCardDetail } from "@/components/data-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useGameState } from "@/hooks/use-game-state";
import { useCards } from "@/hooks/use-cards";
import { Card, Rarity, RARITY_SHORT } from "@/lib/types";
import { calculateQualityScore } from "@/lib/card-utils";
import { cn } from "@/lib/utils";
import {
  Search,
  Star,
  Swords,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type SortOption =
  | "count"
  | "rarity"
  | "category"
  | "name"
  | "id"
  | "atk"
  | "def"
  | "atk+def"
  | "obtained"
  | "quality";

const ITEMS_PER_PAGE = 20;

export default function CollectionPage() {
  const { state, isHydrated, stats, constants } = useGameState();
  const { total: totalPoolSize } = useCards();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("quality");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [starredOnly, setStarredOnly] = useState(false);
  const [starredCards, setStarredCards] = useState<Set<string>>(new Set());

  // Toggle star
  const toggleStar = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  // Filter and sort collection
  const filteredCollection = useMemo(() => {
    if (!state) return [];

    let filtered = [...state.collection];

    // Star filter
    if (starredOnly) {
      filtered = filtered.filter((oc) => starredCards.has(oc.card.id));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (oc) =>
          oc.card.title.toLowerCase().includes(query) ||
          oc.card.id.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (categoryFilter) {
      const query = categoryFilter.toLowerCase();
      filtered = filtered.filter((oc) =>
        oc.card.category.toLowerCase().includes(query),
      );
    }

    // Rarity filter
    if (selectedRarity !== "all") {
      filtered = filtered.filter((oc) => oc.card.rarity === selectedRarity);
    }

    // Sort
    switch (sortBy) {
      case "quality":
        filtered.sort(
          (a, b) =>
            calculateQualityScore(b.card) - calculateQualityScore(a.card),
        );
        break;
      case "count":
        filtered.sort(
          (a, b) => b.quantity - a.quantity || b.card.rarity - a.card.rarity,
        );
        break;
      case "rarity":
        filtered.sort((a, b) => b.card.rarity - a.card.rarity);
        break;
      case "category":
        filtered.sort((a, b) =>
          a.card.category.localeCompare(b.card.category, "de"),
        );
        break;
      case "name":
        filtered.sort((a, b) => a.card.title.localeCompare(b.card.title, "de"));
        break;
      case "id":
        filtered.sort((a, b) => a.card.id.localeCompare(b.card.id));
        break;
      case "atk":
        filtered.sort((a, b) => b.card.stats.atk - a.card.stats.atk);
        break;
      case "def":
        filtered.sort((a, b) => b.card.stats.def - a.card.stats.def);
        break;
      case "atk+def":
        filtered.sort(
          (a, b) =>
            b.card.stats.atk +
            b.card.stats.def -
            (a.card.stats.atk + a.card.stats.def),
        );
        break;
      case "obtained":
        filtered.sort(
          (a, b) =>
            new Date(b.firstObtained).getTime() -
            new Date(a.firstObtained).getTime(),
        );
        break;
    }

    return filtered;
  }, [
    state,
    searchQuery,
    categoryFilter,
    selectedRarity,
    sortBy,
    starredOnly,
    starredCards,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredCollection.length / ITEMS_PER_PAGE);
  const paginatedCollection = filteredCollection.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, selectedRarity, sortBy, starredOnly]);

  // Rarity distribution data
  const rarityData =
    stats && totalPoolSize > 0
      ? [
          {
            rarity: 5 as Rarity,
            name: "L",
            fullName: "Legendary",
            count: stats.byRarity[5],
            total: Math.ceil(totalPoolSize * 0.04),
            color: "bg-rose-500",
          },
          {
            rarity: 4 as Rarity,
            name: "E",
            fullName: "Epic",
            count: stats.byRarity[4],
            total: Math.ceil(totalPoolSize * 0.12),
            color: "bg-amber-500",
          },
          {
            rarity: 3 as Rarity,
            name: "R",
            fullName: "Rare",
            count: stats.byRarity[3],
            total: Math.ceil(totalPoolSize * 0.2),
            color: "bg-sky-500",
          },
          {
            rarity: 2 as Rarity,
            name: "UC",
            fullName: "Uncommon",
            count: stats.byRarity[2],
            total: Math.ceil(totalPoolSize * 0.28),
            color: "bg-emerald-500",
          },
          {
            rarity: 1 as Rarity,
            name: "C",
            fullName: "Common",
            count: stats.byRarity[1],
            total: Math.ceil(totalPoolSize * 0.36),
            color: "bg-zinc-400",
          },
        ]
      : [];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "quality", label: "QUAL" },
    { value: "rarity", label: "RARITY" },
    { value: "category", label: "CATEGORY" },
    { value: "name", label: "NAME" },
    { value: "id", label: "ID" },
    { value: "atk", label: "ATK" },
    { value: "def", label: "DEF" },
    { value: "atk+def", label: "ATK+DEF" },
    { value: "count", label: "COUNT" },
    { value: "obtained", label: "OBTAINED" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar
        freePulls={state?.freePulls ?? 0}
        maxPulls={constants.MAX_FREE_PULLS}
      />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {/* Header with Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Collection Stats</h1>
            <div className="text-sm">
              <span className="text-muted-foreground">Unique Cards: </span>
              <span className="font-bold">{stats?.uniqueCards ?? 0}</span>
              <span className="text-muted-foreground">
                {" "}
                / {totalPoolSize > 0 ? totalPoolSize.toLocaleString() : "..."}
              </span>
              <span className="text-primary ml-2">
                (
                {stats && totalPoolSize > 0
                  ? ((stats.uniqueCards / totalPoolSize) * 100).toFixed(4)
                  : "0.0000"}
                %)
              </span>
              <span className="text-muted-foreground ml-4">
                | Total Packs:{" "}
              </span>
              <span className="font-bold">{stats?.totalPacks ?? 0}</span>
            </div>
          </div>

          {/* Rarity Distribution Boxes */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {rarityData.map((r) => (
              <button
                key={r.rarity}
                onClick={() =>
                  setSelectedRarity(
                    selectedRarity === r.rarity ? "all" : r.rarity,
                  )
                }
                className={cn(
                  "p-3 rounded-lg border transition-all text-left",
                  selectedRarity === r.rarity && "ring-2 ring-primary",
                  "hover:border-primary/50",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      r.rarity === 5 && "bg-rose-100 text-rose-700",
                      r.rarity === 4 && "bg-amber-100 text-amber-700",
                      r.rarity === 3 && "bg-sky-100 text-sky-700",
                      r.rarity === 2 && "bg-emerald-100 text-emerald-700",
                      r.rarity === 1 && "bg-zinc-100 text-zinc-700",
                    )}
                  >
                    {r.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.count}/{r.total}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full transition-all", r.color)}
                    style={{
                      width: `${r.total > 0 ? (r.count / r.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {r.total > 0 ? ((r.count / r.total) * 100).toFixed(2) : 0}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Sort By:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary hover:bg-secondary/80 border-transparent",
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setStarredOnly(!starredOnly)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full border transition-colors flex items-center gap-1",
              starredOnly
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-secondary hover:bg-secondary/80 border-transparent",
            )}
          >
            <Star className="w-3 h-3" />
            ONLY
          </button>
        </div>

        {/* Search Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative flex-1">
            <Input
              placeholder="Search by category..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Page
            <Input
              type="number"
              min={1}
              max={totalPages || 1}
              value={currentPage}
              onChange={(e) =>
                setCurrentPage(
                  Math.max(
                    1,
                    Math.min(totalPages, parseInt(e.target.value) || 1),
                  ),
                )
              }
              className="w-16 text-center"
            />
            of {totalPages || 1}
          </div>
        </div>

        {/* Table Header */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[60px_60px_1fr_80px_80px_50px] gap-2 px-4 py-2 bg-secondary/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
            <span>Rank</span>
            <span>Qual</span>
            <span>Title (ID)</span>
            <span className="text-right">ATK</span>
            <span className="text-right">DEF</span>
            <span className="text-right">CNT</span>
          </div>

          {/* Table Body */}
          {!isHydrated ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : paginatedCollection.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {state?.collection.length === 0
                ? "No cards yet. Open some packs!"
                : "No cards match your filters."}
            </div>
          ) : (
            <div className="divide-y">
              {paginatedCollection.map(({ card, quantity }) => {
                const qualScore = calculateQualityScore(card);
                const isStarred = starredCards.has(card.id);

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="w-full grid grid-cols-[60px_60px_1fr_80px_80px_50px] gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors text-left items-center cursor-pointer"
                  >
                    {/* Rank/Rarity */}
                    <span
                      className={cn(
                        "font-bold text-sm",
                        card.rarity === 5 && "text-rose-500",
                        card.rarity === 4 && "text-amber-500",
                        card.rarity === 3 && "text-sky-500",
                        card.rarity === 2 && "text-emerald-500",
                        card.rarity === 1 && "text-zinc-500",
                      )}
                    >
                      {RARITY_SHORT[card.rarity]}
                    </span>

                    {/* Quality Score */}
                    <span
                      className={cn(
                        "font-mono text-sm",
                        qualScore >= 70 && "text-rose-500",
                        qualScore >= 50 && qualScore < 70 && "text-amber-500",
                        qualScore >= 30 && qualScore < 50 && "text-sky-500",
                        qualScore < 30 && "text-muted-foreground",
                      )}
                    >
                      {qualScore.toFixed(1)}
                    </span>

                    {/* Title & Category */}
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={(e) => toggleStar(card.id, e)}
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          isStarred
                            ? "text-amber-500"
                            : "text-muted-foreground/30 hover:text-muted-foreground",
                        )}
                      >
                        <Star
                          className={cn("w-4 h-4", isStarred && "fill-current")}
                        />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {card.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-medium",
                              "bg-secondary text-muted-foreground",
                            )}
                          >
                            {card.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            #{card.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ATK */}
                    <div className="text-right">
                      <span className="font-mono font-bold">
                        {card.stats.atk.toLocaleString()}
                      </span>
                    </div>

                    {/* DEF */}
                    <div className="text-right">
                      <span className="font-mono font-bold">
                        {card.stats.def.toLocaleString()}
                      </span>
                    </div>

                    {/* Count */}
                    <div className="text-right">
                      <span className="text-muted-foreground">x{quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Card Detail Modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">
            {selectedCard?.title || "Karten-Details"}
          </DialogTitle>
          {selectedCard && <DataCardDetail card={selectedCard} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
