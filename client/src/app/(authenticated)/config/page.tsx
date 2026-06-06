import { IAConfigForm } from "@/components/IAConfigForm";

export default function ConfigPage() {
  return (
    <main className="space-y-4">
      <header>
        <p className="text-caption text-ink-muted-48">IA local</p>
        <h1 className="font-display text-display-lg font-semibold leading-display tracking-none">Config</h1>
      </header>
      <IAConfigForm />
    </main>
  );
}
