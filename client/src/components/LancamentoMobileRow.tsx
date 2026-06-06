"use client";

import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { LancamentoDTO } from "@fin-ai/shared";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function LancamentoMobileRow({ item }: { item: LancamentoDTO }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `lancamento-${item.id}-details`;

  return (
    <article className="rounded-lg border border-hairline bg-canvas">
      <button
        type="button"
        className="grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{item.descricao}</span>
          <span className="block truncate text-caption text-ink-muted-48">{item.categoria}</span>
        </span>
        <span className="flex min-w-fit items-center gap-2">
          <span className="whitespace-nowrap font-semibold text-ink">{money.format(item.valor)}</span>
          <ChevronDown
            aria-hidden="true"
            size={18}
            className={expanded ? "rotate-180 text-primary transition-transform" : "text-primary transition-transform"}
          />
        </span>
      </button>
      {expanded ? (
        <div id={panelId} className="grid gap-4 border-t border-divider-soft px-4 py-4">
          <dl className="grid grid-cols-2 gap-3 text-caption">
            <div>
              <dt className="text-ink-muted-48">Data</dt>
              <dd className="font-semibold text-ink">{date.format(new Date(item.data))}</dd>
            </div>
            <div>
              <dt className="text-ink-muted-48">Responsável</dt>
              <dd className="font-semibold text-ink">Usuário {item.usuario_id}</dd>
            </div>
          </dl>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary-pill min-w-0 px-4" aria-label={`Editar ${item.descricao}`}>
              <Pencil size={17} />
              Editar
            </button>
            <button type="button" className="btn-destructive min-w-0 px-4" aria-label={`Excluir ${item.descricao}`}>
              <Trash2 size={17} />
              Excluir
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
