"use client";

import { Card as CardType, Rarity, RARITY_NAMES } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Database,
  Swords,
  Shield,
  Star,
  ExternalLink,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface DataCardProps {
  card: CardType;
  showStats?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  highlight?: "atk" | "def" | null;
  onClick?: () => void;
  className?: string;
  showFullDescription?: boolean;
}

const sizeClasses = {
  sm: "w-40 h-56",
  md: "w-52 h-72",
  lg: "w-64 h-[22rem]",
};

const rarityBorderColors: Record<Rarity, string> = {
  1: "border-zinc-400",
  2: "border-emerald-500",
  3: "border-sky-500",
  4: "border-amber-500",
  5: "border-rose-500",
};

const rarityBadgeColors: Record<Rarity, string> = {
  1: "bg-zinc-500 text-white",
  2: "bg-emerald-500 text-white",
  3: "bg-sky-500 text-white",
  4: "bg-amber-500 text-white",
  5: "bg-rose-500 text-white",
};

const rarityBadgeShort: Record<Rarity, string> = {
  1: "C",
  2: "UC",
  3: "R",
  4: "E",
  5: "L",
};

// Check if card has geodata format
function hasGeoData(format: string): boolean {
  const geoFormats = ["geojson", "kml", "gpx", "wms", "wfs", "shp"];
  return geoFormats.includes(format.toLowerCase());
}

// Generate a preview image URL for geodata cards
function getPreviewImageUrl(card: CardType): string | null {
  // For geodata, generate a Berlin map placeholder
  if (hasGeoData(card.format)) {
    // Using a static map centered on Berlin
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/13.405,52.52,10,0/300x200?access_token=YOUR_MAPBOX_TOKEN`;
  }
  return null;
}

export function DataCard({
  card,
  showStats = true,
  size = "md",
  animate = false,
  highlight = null,
  onClick,
  className,
  showFullDescription = false,
}: DataCardProps) {
  const isClickable = !!onClick;
  const [imageError, setImageError] = useState(false);
  const previewUrl = !imageError ? getPreviewImageUrl(card) : null;
  const isGeoData = hasGeoData(card.format);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border-2 overflow-hidden transition-all duration-300",
        "shadow-lg",
        rarityBorderColors[card.rarity],
        card.rarity >= 4 && "shadow-xl",
        card.rarity === 5 && "animate-card-glow",
        sizeClasses[size],
        isClickable && "cursor-pointer hover:scale-105 hover:shadow-2xl",
        animate && "animate-card-reveal",
        `card-rarity-${card.rarity}`,
        className,
      )}
    >
      {/* Header with rarity badge and format */}
      <div
        className={cn(
          "flex items-center justify-between px-2 py-1.5",
          card.rarity === 1 && "bg-zinc-600",
          card.rarity === 2 && "bg-emerald-600",
          card.rarity === 3 && "bg-sky-600",
          card.rarity === 4 && "bg-amber-600",
          card.rarity === 5 && "bg-gradient-to-r from-rose-600 to-amber-600",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-black px-1.5 py-0.5 rounded",
              "bg-white/20 text-white",
            )}
          >
            {rarityBadgeShort[card.rarity]}
          </span>
          <span className="text-[10px] font-medium text-white/90 truncate max-w-20">
            {card.title}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
            "bg-white/20 text-white",
          )}
        >
          {card.format.toUpperCase()}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-col h-[calc(100%-36px)] p-2.5">
        {/* Title */}
        <h3
          className={cn(
            "font-bold leading-tight line-clamp-2 text-foreground",
            size === "sm"
              ? "text-xs mb-1"
              : size === "md"
                ? "text-sm mb-1.5"
                : "text-base mb-2",
          )}
        >
          {card.title}
        </h3>

        {/* Preview image for geodata */}
        {isGeoData && previewUrl && size !== "sm" && (
          <div className="relative w-full h-20 mb-2 rounded-lg overflow-hidden bg-muted">
            <Image
              src={previewUrl}
              alt={`Kartenvorschau für ${card.title}`}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              Berlin
            </div>
          </div>
        )}

        {/* Organization */}
        <p
          className={cn(
            "text-muted-foreground truncate",
            size === "sm" ? "text-[9px] mb-1" : "text-[10px] mb-1.5",
          )}
        >
          {card.organization}
        </p>

        {/* Stars */}
        <div className="flex gap-0.5 mb-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3",
                i <= card.rarity ? "star fill-current" : "star-empty",
              )}
            />
          ))}
        </div>

        {/* Description */}
        <p
          className={cn(
            "text-muted-foreground leading-relaxed flex-1 overflow-hidden",
            size === "sm"
              ? "text-[8px] line-clamp-2"
              : size === "md"
                ? "text-[10px] line-clamp-3"
                : "text-xs",
            showFullDescription
              ? "line-clamp-none overflow-y-auto"
              : size === "lg" && "line-clamp-4",
          )}
        >
          {card.description || "Keine Beschreibung verfügbar."}
        </p>

        {/* Stats */}
        {showStats && (
          <div className="mt-auto pt-2 grid grid-cols-2 gap-1.5">
            <div
              className={cn(
                "flex flex-col items-center px-2 py-1.5 rounded-lg",
                highlight === "atk"
                  ? "bg-rose-100 ring-2 ring-rose-400"
                  : "bg-rose-50",
              )}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <Swords className="w-3 h-3 text-rose-500" />
                <span className="text-[9px] font-medium text-rose-600">
                  ATK
                </span>
              </div>
              <span
                className={cn(
                  "font-bold font-mono text-rose-700",
                  size === "sm" ? "text-sm" : "text-base",
                )}
              >
                {card.stats.atk.toLocaleString()}
              </span>
            </div>

            <div
              className={cn(
                "flex flex-col items-center px-2 py-1.5 rounded-lg",
                highlight === "def"
                  ? "bg-sky-100 ring-2 ring-sky-400"
                  : "bg-sky-50",
              )}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <Shield className="w-3 h-3 text-sky-500" />
                <span className="text-[9px] font-medium text-sky-600">DEF</span>
              </div>
              <span
                className={cn(
                  "font-bold font-mono text-sky-700",
                  size === "sm" ? "text-sm" : "text-base",
                )}
              >
                {card.stats.def.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Shimmer effect for rare+ cards */}
      {card.rarity >= 4 && (
        <div className="absolute inset-0 pointer-events-none animate-shimmer" />
      )}
    </div>
  );
}

// Card back for reveal animations
export function DataCardBack({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-odis-blue overflow-hidden",
        "bg-gradient-to-br from-odis-blue to-odis-dark",
        "flex items-center justify-center shadow-lg",
        sizeClasses[size],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <Database className="w-12 h-12 text-white/30" />
      <div className="absolute inset-3 border border-white/20 rounded-lg" />
      <div className="absolute bottom-4 text-white/50 text-xs font-medium">
        Open Data Berlin
      </div>
    </div>
  );
}

// Detailed card view for modals (fixed UI)
export function DataCardDetail({ card }: { card: CardType }) {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      {/* Card preview */}
      <div className="flex justify-center">
        <DataCard card={card} size="lg" animate />
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "px-2 py-1 rounded text-xs font-bold",
              rarityBadgeColors[card.rarity],
            )}
          >
            {RARITY_NAMES[card.rarity]}
          </span>
          <span className="text-muted-foreground text-sm">
            {card.resourceCount}{" "}
            {card.resourceCount === 1 ? "Datei" : "Dateien"}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-bold leading-tight">{card.title}</h2>
          <p className="text-muted-foreground text-sm">{card.organization}</p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {card.description}
        </p>

        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-secondary rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <a
          href={card.url || `https://daten.berlin.de/datensaetze/${card.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Datensatz auf daten.berlin.de ansehen
        </a>
      </div>
    </div>
  );
}

// Compact card for share image generation
export function DataCardCompact({
  card,
  className,
}: {
  card: CardType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-44 rounded-lg border-2 overflow-hidden",
        rarityBorderColors[card.rarity],
        `card-rarity-${card.rarity}`,
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-2 py-1",
          card.rarity === 1 && "bg-zinc-600",
          card.rarity === 2 && "bg-emerald-600",
          card.rarity === 3 && "bg-sky-600",
          card.rarity === 4 && "bg-amber-600",
          card.rarity === 5 && "bg-gradient-to-r from-rose-600 to-amber-600",
        )}
      >
        <span className="text-[10px] font-black text-white">
          {rarityBadgeShort[card.rarity]}
        </span>
        <span className="text-[10px] font-medium text-white truncate max-w-24">
          {card.title}
        </span>
      </div>

      {/* Body */}
      <div className="p-2">
        <h4 className="text-xs font-bold line-clamp-2 mb-1">{card.title}</h4>
        <p className="text-[9px] text-muted-foreground line-clamp-3 mb-2">
          {card.description || "Keine Beschreibung verfügbar."}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1 text-center">
          <div className="bg-rose-50 rounded px-1 py-0.5">
            <div className="text-[8px] text-rose-600 font-medium">ATK</div>
            <div className="text-xs font-bold text-rose-700">
              {card.stats.atk.toLocaleString()}
            </div>
          </div>
          <div className="bg-sky-50 rounded px-1 py-0.5">
            <div className="text-[8px] text-sky-600 font-medium">DEF</div>
            <div className="text-xs font-bold text-sky-700">
              {card.stats.def.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
