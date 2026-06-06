import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHAT_MESSAGE_STATUSES } from "@fin-ai/shared";
import { StatusIndicator } from "@/components/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders labels for every lifecycle status", () => {
    render(
      <>
        {CHAT_MESSAGE_STATUSES.map((status) => (
          <StatusIndicator key={status} status={status} />
        ))}
      </>,
    );

    expect(screen.getByLabelText("pending")).toBeTruthy();
    expect(screen.getByLabelText("job_created")).toBeTruthy();
    expect(screen.getByLabelText("transcribing")).toBeTruthy();
    expect(screen.getByLabelText("processing_ia")).toBeTruthy();
    expect(screen.getByLabelText("completed")).toBeTruthy();
    expect(screen.getByLabelText("failed")).toBeTruthy();
    expect(screen.getByLabelText("processing_ia").className).toContain("text-primary");
    expect(screen.getByLabelText("job_created").className).toContain("text-ink-muted-48");
  });
});
