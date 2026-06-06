"use client";

import { CategoriaEnum, type LancamentoFilterDTO } from "@fin-ai/shared";

type CategoryChipsProps = {
  value: LancamentoFilterDTO;
  onChange: (filters: LancamentoFilterDTO) => void;
};

const categories = Object.values(CategoriaEnum);

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  const selected = value.categoria;

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Filtro rápido por categoria">
      <div className="flex min-w-max gap-2 py-1">
        <button
          type="button"
          className={chipClass(!selected)}
          aria-pressed={!selected}
          onClick={() => onChange({ ...value, categoria: undefined })}
        >
          Todos
        </button>
        {categories.map((categoria) => (
          <button
            key={categoria}
            type="button"
            className={chipClass(selected === categoria)}
            aria-pressed={selected === categoria}
            onClick={() => onChange({ ...value, categoria })}
          >
            {categoria}
          </button>
        ))}
      </div>
    </div>
  );
}

function chipClass(active: boolean) {
  return [
    "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-pill border px-4 text-caption transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95",
    active
      ? "border-primary bg-primary text-on-primary"
      : "border-hairline bg-canvas text-ink",
  ].join(" ");
}
