import { testGame } from "@rarefriends/friendsdk/testing";
import assert from "node:assert/strict";

await testGame("./games/alien-angler", {
  width: 360,
  timeout: 30_000,
  check: async ({ game }) => {
    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByText(/SPECIMEN 00[1-5]/).waitFor({ state: "visible" });
    await game.getByText("01", { exact: true }).waitFor({ state: "visible" });
    await game.getByText("DEMO REWARD", { exact: true }).waitFor({ state: "visible" });
    const balance = await game.locator(".hud-actions>strong").textContent();
    assert.notEqual(balance, "◆ 1000.0 RF", "A revealed catch must credit the local RF demo balance");
  },
});
