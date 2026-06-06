import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusIndicator } from "@/components/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders correct icon labels per status", () => {
    render(
      <>
        <StatusIndicator status="pending" />
        <StatusIndicator status="processing" />
        <StatusIndicator status="completed" />
        <StatusIndicator status="failed" />
      </>,
    );

    expect(screen.getByLabelText("pending")).toBeTruthy();
    expect(screen.getByLabelText("processing")).toBeTruthy();
    expect(screen.getByLabelText("completed")).toBeTruthy();
    expect(screen.getByLabelText("failed")).toBeTruthy();
  });
});
