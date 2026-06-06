"use client";

import { CategoriaEnum, type LancamentoFilterDTO } from "@fin-ai/shared";
import { CategoryChips } from "@/components/CategoryChips";

type FilterBarProps = {
  value: LancamentoFilterDTO;
  onChange: (filters: LancamentoFilterDTO) => void;
};

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div className="card-utility grid gap-3">
      <label className="grid gap-1">
        <span className="text-caption text-ink-muted-48">Inicio</span>
        <input className="form-field" type="date" value={value.dataInicio ?? ""} onChange={(event) => onChange({ ...value, dataInicio: event.target.value || undefined })} />
      </label>
      <label className="grid gap-1">
        <span className="text-caption text-ink-muted-48">Fim</span>
        <input className="form-field" type="date" value={value.dataFim ?? ""} onChange={(event) => onChange({ ...value, dataFim: event.target.value || undefined })} />
      </label>
      <label className="grid gap-1">
        <span className="text-caption text-ink-muted-48">Categoria</span>
        <select className="form-field" value={value.categoria ?? ""} onChange={(event) => onChange({ ...value, categoria: (event.target.value || undefined) as CategoriaEnum | undefined })}>
          <option value="">Todas</option>
          {Object.values(CategoriaEnum).map((categoria) => (
            <option key={categoria} value={categoria}>{categoria}</option>
          ))}
        </select>
      </label>
      <CategoryChips value={value} onChange={onChange} />
      <button type="button" className="btn-secondary-pill" onClick={() => onChange({})}>Limpar</button>
    </div>
  );
}
