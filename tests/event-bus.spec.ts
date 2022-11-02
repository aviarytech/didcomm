import { EventBus } from "$lib/event-bus";
import { expect, test, vi } from "vitest";

const mockCallback = vi.fn((x) => 42 + x);

test("event-bus registers and handles", () => {
  const bus = new EventBus();

  bus.register("foo", {
    handle: (e: any) => {
      mockCallback(0);
    },
  });

  bus.dispatch("foo");
  expect(mockCallback.mock.calls.length).toBe(1);
});
