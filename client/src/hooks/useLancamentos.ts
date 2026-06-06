"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LancamentoDTO, LancamentoFilterDTO } from "@fin-ai/shared";
import { api } from "@/lib/api";

export function useLancamentos() {
  const [items, setItems] = useState<LancamentoDTO[]>([]);
  const [filters, setFilters] = useState<LancamentoFilterDTO>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.lancamentos(filters);
      setItems([...data].sort((a, b) => b.data.localeCompare(a.data)));
    } catch {
      setError("Erro ao carregar lançamentos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchItems(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchItems]);

  const exportCsv = useCallback(async () => {
    const csv = await api.exportLancamentos(filters);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lancamentos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [filters]);

  return useMemo(
    () => ({ items, filters, setFilters, loading, error, retry: fetchItems, exportCsv }),
    [error, exportCsv, fetchItems, filters, items, loading],
  );
}
