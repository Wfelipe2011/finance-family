import type { LancamentoDTO } from "@fin-ai/shared";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function LancamentoTable({ items }: { items: LancamentoDTO[] }) {
  if (!items.length) {
    return (
      <div className="card-utility flex min-h-48 items-center justify-center text-center text-ink-muted-48">
        Nenhum lançamento encontrado
      </div>
    );
  }

  return (
    <div className="card-utility overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead className="text-caption text-ink-muted-48">
          <tr>
            <th className="pb-3 font-semibold">Descrição</th>
            <th className="pb-3 font-semibold">Valor</th>
            <th className="pb-3 font-semibold">Data</th>
            <th className="pb-3 font-semibold">Categoria</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-divider-soft">
              <td className="py-3">{item.descricao}</td>
              <td className="py-3">{money.format(item.valor)}</td>
              <td className="py-3">{date.format(new Date(item.data))}</td>
              <td className="py-3">{item.categoria}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
