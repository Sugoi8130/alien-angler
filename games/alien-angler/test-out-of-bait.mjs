import { testGame } from "@rarefriends/friendsdk/testing";
import assert from "node:assert/strict";

await testGame("./games/alien-angler", {
  width: Number(process.env.TEST_WIDTH || 960),
  height: 720,
  timeout: 30_000,
  check: async ({ game }) => {
    await game.locator("body").evaluate(() => {
      const nativeTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((handler, timeout, ...args) => nativeTimeout(handler, Number(timeout) === 1_500 ? 5_000 : Number(timeout) === 2_600 ? 500 : Math.min(Number(timeout), 90), ...args));
    });

    for (let cast = 0; cast < 5; cast += 1) {
      await game.locator(".phase-bite").waitFor({ state: "visible" });
      await game.getByRole("button", { name: /reel now/i }).click();
      await game.locator(".phase-reveal").waitFor({ state: "visible" });
    }

    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByText("OUT OF BAIT", { exact: true }).waitFor();
    assert.equal(await game.locator(".shop-shell").count(), 0, "Market must remain closed when bait reaches zero");
    await game.locator("body").screenshot({ path: process.env.TEST_SCREENSHOT || "../../outputs/alien-angler-out-of-bait.png" });

    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByRole("heading", { name: "STAR MARKET" }).waitFor();
  },
});
