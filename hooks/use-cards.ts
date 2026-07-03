"use client";

import useSWR from "swr";
import { Card } from "@/lib/types";

interface CardsResponse {
  success: boolean;
  cards: Card[];
  fromCache: boolean;
  count: number;
  total?: number;
  source?: string;
  error?: string;
}

const fetcher = async (url: string): Promise<CardsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load cards (HTTP ${res.status})`);
  }
  const data: CardsResponse = await res.json();
  if (!data.success) {
    throw new Error(data.error || "API returned unsuccessful response");
  }
  return data;
};

export function useCards() {
  const { data, error, isLoading, mutate } = useSWR<CardsResponse>(
    "/api/cards",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000,
      shouldRetryOnError: false, // Don't retry forever on errors
      errorRetryCount: 1, // At most 1 retry
    },
  );

  return {
    cards: data?.cards ?? [],
    isLoading,
    isError: !!error || (data !== undefined && !data.success),
    errorMessage:
      error?.message ?? (data && !data.success ? data.error : undefined),
    fromCache: data?.fromCache ?? false,
    source: data?.source,
    total: data?.total ?? data?.count ?? 0,
    refresh: () => mutate(),
  };
}
