"use client";

import { ImagePlus, Mic, Send, Square } from "lucide-react";
import { useRef, useState } from "react";

type ChatInputProps = {
  onSend: (content: string, file?: File) => Promise<void>;
  onToggleRecording: () => Promise<void>;
  isRecording: boolean;
};

export function ChatInput({ onSend, onToggleRecording, isRecording }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    await onSend(trimmed);
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem");
      return;
    }
    setError(null);
    await onSend("Comprovante anexado", file);
    event.target.value = "";
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {isRecording ? <p className="text-caption text-ink-muted-80">Gravando audio...</p> : null}
      {error ? <p role="alert" className="text-caption text-ink-muted-80">{error}</p> : null}
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-2">
        <button type="button" aria-label="Anexar imagem" className="btn-secondary-pill !px-3" onClick={() => fileRef.current?.click()}>
          <ImagePlus size={18} />
        </button>
        <input ref={fileRef} hidden type="file" accept="image/*" onChange={onFileChange} />
        <button type="button" aria-label={isRecording ? "Parar gravação" : "Gravar audio"} className="btn-secondary-pill !px-3" onClick={onToggleRecording}>
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </button>
        <input
          className="min-w-0 flex-1 bg-transparent px-2 outline-none"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Mensagem"
        />
        <button type="submit" aria-label="Enviar" className="btn-primary !px-4">
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
