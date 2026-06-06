import type { ChatMessage } from "@fin-ai/shared";
import { ImageIcon, Mic } from "lucide-react";
import { StatusIndicator } from "@/components/StatusIndicator";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const user = message.role === "user";

  return (
    <article className={`flex ${user ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-lg border border-hairline px-4 py-3 ${
          user ? "bg-primary/10 text-ink" : "bg-canvas-parchment text-ink"
        }`}
      >
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
    </article>
  );
}
