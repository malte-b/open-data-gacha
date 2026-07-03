"use client";

import { PackType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardPackProps {
  packType: PackType;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

function ODISLogo({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 260 258"
      className={className}
      style={style}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M229.193775,53.2418167 C216.667207,53.2418167 206.540047,43.1324326 206.540047,30.6968641 C206.540047,18.2612956 216.667207,8.1518491 229.193775,8.1518491 C241.720966,8.1518491 251.848126,18.2612956 251.848126,30.6968641 C251.848126,43.1324326 241.720966,53.2418167 229.193775,53.2418167 Z M198.388173,30.6968641 C198.388173,47.6659224 212.196463,61.3935036 229.193775,61.3935036 C246.191711,61.3935036 260,47.6659224 260,30.6968641 C260,13.7278058 246.191711,0 229.193775,0 C212.196463,0 198.388173,13.7278058 198.388173,30.6968641 Z M110.483902,249.483496 C53.9516846,249.483496 8.15187405,203.846723 8.15187405,147.586318 C8.15187405,91.3259128 53.9516846,45.6895139 110.483902,45.6895139 C167.016244,45.6895139 212.815805,91.3259128 212.815805,147.586318 C212.815805,203.846723 167.016244,249.483496 110.483902,249.483496 Z M0,147.586318 C0,208.380462 49.4810647,257.63537 110.483902,257.63537 C171.486989,257.63537 220.967679,208.380462 220.967679,147.586318 C220.967679,86.7921735 171.486989,37.5376399 110.483902,37.5376399 C49.4810647,37.5376399 0,86.7921735 0,147.586318 Z"
      />
    </svg>
  );
}

const PACK_CONFIG = {
  standard: {
    bg: "linear-gradient(170deg, #e8eef8 0%, #f4f7fc 30%, #ffffff 50%, #eef2fb 70%, #d8e2f0 100%)",
    headerBg: "linear-gradient(90deg, #1e4b8e 0%, #2563b0 50%, #1e4b8e 100%)",
    footerBg: "linear-gradient(90deg, #1e4b8e 0%, #2563b0 50%, #1e4b8e 100%)",
    logoColor: "#1e3a6e",
    titleColor: "#1e3a6e",
    subtitleColor: "#2563b0",
    labelText: "Standard Pack",
    labelColor: "#ffffff",
    shadow: "0 20px 60px rgba(30,75,142,0.30), 0 8px 20px rgba(30,75,142,0.15)",
  },
  gold: {
    bg: "linear-gradient(170deg, #fdf3d0 0%, #fdf8e8 30%, #fffef5 50%, #fdf5d5 70%, #f5e4a0 100%)",
    headerBg: "linear-gradient(90deg, #92620a 0%, #c8860e 50%, #92620a 100%)",
    footerBg: "linear-gradient(90deg, #92620a 0%, #c8860e 50%, #92620a 100%)",
    logoColor: "#7a4e00",
    titleColor: "#6b3e00",
    subtitleColor: "#9a6200",
    labelText: "Gold Pack",
    labelColor: "#fff9e0",
    shadow: "0 20px 60px rgba(180,120,0,0.35), 0 8px 20px rgba(180,120,0,0.18)",
  },
  rainbow: {
    bg: "linear-gradient(170deg, #f0e8ff 0%, #f8f0ff 30%, #fff5ff 50%, #ede8ff 70%, #d8c8f8 100%)",
    headerBg: "linear-gradient(90deg, #5b21b6 0%, #7c3aed 50%, #5b21b6 100%)",
    footerBg: "linear-gradient(90deg, #5b21b6 0%, #7c3aed 50%, #5b21b6 100%)",
    logoColor: "#4c1d95",
    titleColor: "#3b0764",
    subtitleColor: "#6d28d9",
    labelText: "Rainbow Pack",
    labelColor: "#f0e0ff",
    shadow:
      "0 20px 60px rgba(109,40,217,0.35), 0 8px 20px rgba(109,40,217,0.18)",
  },
};

export function CardPack({
  packType,
  onClick,
  disabled,
  className,
}: CardPackProps) {
  const c = PACK_CONFIG[packType];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative group focus:outline-none select-none",
        !disabled && "cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      style={{ width: 220, height: 330 }}
      aria-label={`${c.labelText} öffnen`}
    >
      {/* Ground shadow */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-5 rounded-[50%] blur-2xl pointer-events-none transition-all duration-500 group-hover:w-40"
        style={{ background: "rgba(30,75,142,0.20)" }}
      />

      {/* 3D float + tilt */}
      <div
        className={cn(
          "absolute inset-0",
          !disabled && "animate-pack-float animate-pack-3d-rotate",
        )}
        style={{ transformStyle: "preserve-3d", perspective: "900px" }}
      >
        {/* ── Single cohesive pack body ── */}
        <div
          className="absolute inset-0 rounded-[10px] overflow-hidden"
          style={{ background: c.bg, boxShadow: c.shadow }}
        >
          {/* Left edge gloss */}
          <div
            className="absolute top-0 left-0 bottom-0 w-4 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.50) 0%, transparent 100%)",
            }}
          />
          {/* Right edge shadow */}
          <div
            className="absolute top-0 right-0 bottom-0 w-4 pointer-events-none"
            style={{
              background:
                "linear-gradient(270deg, rgba(0,0,0,0.10) 0%, transparent 100%)",
            }}
          />

          {/* Top colour band */}
          <div
            className="absolute top-0 inset-x-0 h-14 flex items-center justify-center"
            style={{ background: c.headerBg }}
          >
            <span
              className="font-black uppercase tracking-[0.28em] text-white/90"
              style={{ fontSize: 9 }}
            >
              Open Data Gacha
            </span>
          </div>

          {/* Bottom colour band */}
          <div
            className="absolute bottom-0 inset-x-0 h-10 flex items-center justify-between px-4"
            style={{ background: c.footerBg }}
          >
            <span
              className="font-bold uppercase tracking-widest"
              style={{ fontSize: 7.5, color: c.labelColor }}
            >
              {c.labelText}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 7, color: c.labelColor, opacity: 0.75 }}
            >
              daten.berlin.de
            </span>
          </div>

          {/* Branding area between the two bands */}
          <div
            className="absolute inset-x-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ top: 56, bottom: 40 }}
          >
            {/* ODIS logo in a soft circle */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 84,
                height: 84,
                background: "rgba(255,255,255,0.65)",
                boxShadow:
                  "0 2px 14px rgba(30,75,142,0.10), 0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <ODISLogo className="w-11 h-11" style={{ color: c.logoColor }} />
            </div>

            {/* Title */}
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="font-black uppercase tracking-[0.3em]"
                style={{ fontSize: 11, color: c.titleColor }}
              >
                Open Data
              </span>
              <span
                className="font-black uppercase tracking-[0.22em]"
                style={{ fontSize: 24, color: c.titleColor, lineHeight: 1 }}
              >
                Berlin
              </span>
            </div>

            {/* Thin rule */}
            <div
              style={{
                width: 30,
                height: 1,
                background: c.subtitleColor,
                opacity: 0.35,
              }}
            />

            <span
              className="font-medium"
              style={{
                fontSize: 8,
                color: c.subtitleColor,
                letterSpacing: "0.08em",
              }}
            >
              Offene Daten als Sammelkarten
            </span>
          </div>

          {/* Overall foil sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.08) 100%)",
            }}
          />

          {/* Rainbow prismatic layer */}
          {packType === "rainbow" && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: 0.12,
                background:
                  "linear-gradient(135deg, #f43f5e, #a855f7, #3b82f6, #22c55e, #eab308)",
                backgroundSize: "300% 300%",
                animation: "foil-shimmer 3s ease infinite",
              }}
            />
          )}

          {/* Animated shine sweep */}
          {!disabled && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute h-[220%] -top-[60%] animate-shine-sweep-slow"
                style={{
                  left: "-50%",
                  width: "28%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
                  transform: "rotate(15deg)",
                }}
              />
            </div>
          )}
        </div>

        {/* Hover glow ring */}
        <div
          className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: c.shadow }}
        />
      </div>

      {/* Sparkles for special packs */}
      {packType !== "standard" && !disabled && (
        <>
          <div
            className="absolute top-10  left-2   w-1.5 h-1.5 rounded-full bg-white animate-sparkle pointer-events-none"
            style={{ animationDelay: "0.0s" }}
          />
          <div
            className="absolute top-20  right-4  w-1   h-1   rounded-full bg-white animate-sparkle pointer-events-none"
            style={{ animationDelay: "0.6s" }}
          />
          <div
            className="absolute top-1/2 left-1   w-1.5 h-1.5 rounded-full bg-white animate-sparkle pointer-events-none"
            style={{ animationDelay: "1.2s" }}
          />
          <div
            className="absolute bottom-28 right-3 w-1   h-1   rounded-full bg-white animate-sparkle pointer-events-none"
            style={{ animationDelay: "1.8s" }}
          />
          <div
            className="absolute bottom-14 left-4  w-1.5 h-1.5 rounded-full bg-white animate-sparkle pointer-events-none"
            style={{ animationDelay: "2.4s" }}
          />
        </>
      )}
    </button>
  );
}

export function PackOpeningAnimation({ packType }: { packType: PackType }) {
  return (
    <div className="relative opacity-75 pointer-events-none">
      <CardPack packType={packType} disabled />
    </div>
  );
}
