"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Rarity, RARITY_NAMES } from "@/lib/types";

const RARITY_TABLE: {
  short: string;
  name: string;
  meaning: string;
  score: string;
  color: string;
}[] = [
  {
    short: "L",
    name: "Legendary",
    meaning: "Verknüpfte Daten (Linked Data)",
    score: "RDF / SPARQL",
    color: "text-rose-600",
  },
  {
    short: "E",
    name: "Epic",
    meaning: "URI-basierte Formate",
    score: "JSON / GeoJSON",
    color: "text-amber-600",
  },
  {
    short: "R",
    name: "Rare",
    meaning: "Offenes, nicht-proprietäres Format",
    score: "CSV / XML",
    color: "text-sky-600",
  },
  {
    short: "UC",
    name: "Uncommon",
    meaning: "Maschinenlesbare Struktur",
    score: "XLSX / XLS",
    color: "text-emerald-600",
  },
  {
    short: "C",
    name: "Common",
    meaning: "Im Web verfügbar",
    score: "PDF / HTML",
    color: "text-zinc-500",
  },
];

interface RuleBookProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCards?: number;
}

function Section({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3
        className={`font-bold text-base mb-1 flex items-center gap-2 ${color}`}
      >
        <span className="inline-block w-3 h-3 rounded-sm bg-current opacity-80" />
        {title}
      </h3>
      <div className="text-sm text-foreground/80 space-y-1 pl-5">
        {children}
      </div>
    </div>
  );
}

export function RuleBook({ open, onOpenChange, totalCards }: RuleBookProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="px-5 pt-5 pb-3 text-xl font-bold border-b">
          Regelbuch
        </DialogTitle>
        <ScrollArea className="h-[70vh]">
          <div className="px-5 py-4">
            <Section color="text-primary" title="Über Open Data Gacha">
              <p>
                Diese App zeigt Berliner Open-Data-Datensätze als Sammelkarten.
                Datensätze mit höherer Datenqualität werden zu selteneren
                Karten.
              </p>
              <p>
                Jedes Paket enthält 5 Karten. Pakete regenerieren 1 pro Minute,
                bis zu 10.
              </p>
              <p>
                Alle{" "}
                {totalCards ? `${totalCards.toLocaleString("de-DE")} ` : ""}
                Datensätze stammen aus dem{" "}
                <a
                  href="https://daten.berlin.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Berliner Open-Data-Portal
                </a>{" "}
                und{" "}
                <a
                  href="https://www.govdata.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  GovData
                </a>
                .
              </p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1">
                <li>Jedes 10. Paket ist ein Gold-Paket (garantiert Epic+).</li>
                <li>
                  Jedes 100. Paket ist ein Regenbogen-Paket (garantiert
                  Legendary).
                </li>
                <li>
                  Karten in deiner Sammlung werden bevorzugt nicht doppelt
                  ausgegeben.
                </li>
              </ul>
            </Section>

            <Section color="text-primary" title="Seltenheit (Open Data Score)">
              <p>
                Basierend auf dem{" "}
                <a
                  href="https://5stardata.info/de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Tim Berners-Lee 5-Sterne Open Data Score
                </a>{" "}
                – je offener das Dateiformat, desto seltener die Karte.
              </p>
              <div className="mt-2 rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary text-muted-foreground">
                      <th className="text-left px-3 py-1.5 font-medium w-10">
                        Rang
                      </th>
                      <th className="text-left px-3 py-1.5 font-medium">
                        Bedeutung
                      </th>
                      <th className="text-right px-3 py-1.5 font-medium">
                        Format
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {RARITY_TABLE.map((row, i) => (
                      <tr
                        key={row.short}
                        className={
                          i % 2 === 0 ? "bg-background" : "bg-secondary/30"
                        }
                      >
                        <td className={`px-3 py-1.5 font-bold ${row.color}`}>
                          {row.short}
                        </td>
                        <td className="px-3 py-1.5">{row.meaning}</td>
                        <td
                          className={`px-3 py-1.5 text-right font-mono text-xs ${row.color}`}
                        >
                          {row.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section color="text-rose-600" title="ATK (Angriff / Popularität)">
              <p>
                Abgeleitet aus Datensatz-Metadaten &times;
                Seltenheits-Multiplikator.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1">
                <li>
                  <strong>Ressourcen-Bonus:</strong> Anzahl der Dateien (max.
                  +1.000)
                </li>
                <li>
                  <strong>Aktualitäts-Bonus:</strong> Kürzlich aktualisiert =
                  höher
                </li>
                <li>
                  <strong>Tag-Bonus:</strong> Anzahl der Schlagwörter (max.
                  +500)
                </li>
                <li>
                  <strong>Seltenheits-Faktor:</strong> Seltenheit 1–5 skaliert
                  den Wert
                </li>
              </ul>
              <p className="mt-1 text-muted-foreground">Maximalwert: 15.000</p>
            </Section>

            <Section color="text-sky-600" title="DEF (Verteidigung / Tiefe)">
              <p>
                Misst die Dokumentationsqualität des Datensatzes &times;
                Seltenheits-Multiplikator.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1">
                <li>
                  <strong>Beschreibungs-Score:</strong> Länge der Beschreibung
                  (max. +1.000)
                </li>
                <li>
                  <strong>Datei-Score:</strong> Anzahl der Ressourcen (max.
                  +1.500)
                </li>
                <li>
                  <strong>Tag-Score:</strong> Anzahl der Schlagwörter (max.
                  +750)
                </li>
                <li>
                  <strong>Maintainer-Bonus:</strong> E-Mail-Adresse angegeben =
                  +500
                </li>
              </ul>
              <p className="mt-1 text-muted-foreground">Maximalwert: 15.000</p>
            </Section>

            <Section color="text-amber-600" title="Qualitäts-Score (QUAL)">
              <p>
                Kombinierter Wert (0–100) für die Sortierung in der Sammlung.
                Setzt sich zusammen aus Seltenheits-Score (10–50), ATK-Score
                (0–25) und DEF-Score (0–25).
              </p>
            </Section>

            <Section color="text-primary" title="Kampfmodus (Supertrumpf)">
              <p>
                Wähle eine Karte aus deiner Sammlung und vergleiche ATK oder DEF
                mit dem Computer. Der höhere Wert gewinnt die Runde. Gewinner
                erhält die Karte des Verlierers. Inspiriert vom{" "}
                <a
                  href="https://odis-berlin.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  ODIS-Berlin Supertrumpf-Spiel
                </a>
                .
              </p>
            </Section>

            <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
              Daten lizenziert unter{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/deed.de"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                CC BY 4.0
              </a>{" "}
              &mdash; Quelle: Berliner Open-Data-Portal &amp; GovData.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
