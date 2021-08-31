import { EventBus } from "../src/utils/event-bus";
const mockCallback = jest.fn((x) => 42 + x);

test("event-bus registers and handles", () => {
  const bus = new EventBus();

  bus.register("foo", {
    handle: (e) => {
      mockCallback(0);
    },
  });

  bus.dispatch("foo");
  expect(mockCallback.mock.calls.length).toBe(1);
});
