import type { ChatMessage } from "@fin-ai/shared";
import { ImageIcon, Mic } from "lucide-react";
import { StatusIndicator } from "@/components/StatusIndicator";

function fallbackName(message: ChatMessage) {
  if (message.author?.displayName) return message.author.displayName;
  return message.role === "assistant" ? "Jarvis" : "Pessoa";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ChatBubble({ message, currentUserId }: { message: ChatMessage; currentUserId?: number }) {
  const authorName = fallbackName(message);
  const isAgent = message.author?.type === "agent" || message.role === "assistant";
  const isCurrentUser = message.author?.type === "user" && String(message.author.id) === String(currentUserId);
  const alignRight = isCurrentUser;
  const avatarUrl = message.author?.avatarUrl;

  return (
    <article className={`flex items-end gap-2 ${alignRight ? "justify-end" : "justify-start"}`}>
      {!alignRight ? (
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-hairline bg-surface-pearl text-caption text-ink-muted-80">
          {avatarUrl ? <img className="size-full object-cover" src={avatarUrl} alt={authorName} /> : initials(authorName)}
        </div>
      ) : null}
      <div
        className={`max-w-[82%] rounded-lg border border-hairline px-4 py-3 ${
          isAgent ? "bg-canvas-parchment text-ink" : "bg-canvas text-ink"
        }`}
      >
        <p className="mb-1 text-caption text-ink-muted-48">{authorName}</p>
        <p>{message.content}</p>
        {message.attachments?.length ? (
          <div className="mt-2 flex gap-2 text-caption text-ink-muted-48">
            {message.attachments.map((attachment, index) =>
              attachment.type === "image" ? <ImageIcon key={index} size={16} /> : <Mic key={index} size={16} />,
            )}
          </div>
        ) : null}
        <div className="mt-2 flex min-w-0 justify-end">
          <StatusIndicator status={message.status} />
        </div>
      </div>
      {alignRight ? (
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-hairline bg-surface-pearl text-caption text-ink-muted-80">
          {avatarUrl ? <img className="size-full object-cover" src={avatarUrl} alt={authorName} /> : initials(authorName)}
        </div>
      ) : null}
    </article>
  );
}
