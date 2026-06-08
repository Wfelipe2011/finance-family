"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = useChat(user);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  return (
    <main className="flex min-h-[calc(100dvh-7rem)] flex-col gap-4">
      <header>
        <p className="text-caption text-ink-muted-48">
          {chat.groupName ? `${chat.groupName} - ` : ""}
          {chat.connected ? "SSE conectado" : "Aguardando stream"}
        </p>
        <h1 className="font-display text-display-lg font-semibold leading-display tracking-none">Chat</h1>
      </header>
      <section className="card-utility flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {chat.loadingHistory ? (
            <div className="flex min-h-80 items-center justify-center text-center text-ink-muted-48">
              Carregando histórico...
            </div>
          ) : chat.messages.length === 0 ? (
            <div className="flex min-h-80 items-center justify-center text-center text-ink-muted-48">
              Nenhuma mensagem ainda.
            </div>
          ) : (
            chat.messages.map((message) => (
              <ChatBubble key={message.id} message={message} currentUserId={user?.userId} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
        {chat.error ? <p className="text-caption text-ink-muted-80">{chat.error}</p> : null}
        <ChatInput onSend={chat.send} onToggleRecording={chat.toggleRecording} isRecording={chat.isRecording} />
      </section>
    </main>
  );
}
