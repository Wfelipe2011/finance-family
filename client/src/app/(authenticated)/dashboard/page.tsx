"use client";

import { Download } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { LancamentoTable } from "@/components/LancamentoTable";
import { useLancamentos } from "@/hooks/useLancamentos";

export default function DashboardPage() {
  const lancamentos = useLancamentos();

  return (
    <main className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-caption text-ink-muted-48">Lançamentos</p>
          <h1 className="font-display text-display-lg font-semibold leading-display tracking-none">Dashboard</h1>
        </div>
        <button className="btn-secondary-pill" type="button" onClick={lancamentos.exportCsv}>
          <Download size={18} />
          CSV
        </button>
      </header>
      <FilterBar value={lancamentos.filters} onChange={lancamentos.setFilters} />
      {lancamentos.loading ? (
        <div className="card-utility space-y-3" aria-label="Carregando lançamentos">
          {[0, 1, 2].map((row) => <div key={row} className="h-8 rounded-sm bg-canvas-parchment" />)}
        </div>
      ) : lancamentos.error ? (
        <div className="card-utility space-y-4">
          <p>{lancamentos.error}</p>
          <button className="btn-primary" type="button" onClick={lancamentos.retry}>Tentar novamente</button>
        </div>
      ) : (
        <LancamentoTable items={lancamentos.items} />
      )}
    </main>
  );
}
