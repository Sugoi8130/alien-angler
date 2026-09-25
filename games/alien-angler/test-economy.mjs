import { testGame } from "@rarefriends/friendsdk/testing";
import assert from "node:assert/strict";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 40_000,
  screenshot: "../../outputs/alien-angler-economy.png",
  check: async ({ game }) => {
    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByRole("button", { name: "CLAIM +3 BAIT", exact: true }).click();
    await game.getByRole("button", { name: "CLAIMED", exact: true }).waitFor();
    await game.getByText("STOCK 8", { exact: true }).first().waitFor();
    await game.getByRole("button", { name: /CLOSE/ }).click();

    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByText("FIRST DISCOVERY BONUS", { exact: true }).waitFor();
    const dust = await game.locator(".dust-balance").textContent();
    assert.notEqual(dust, "✦ 0", "A catch must credit Stardust");

    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByText("LEVEL 1 / 30", { exact: true }).waitFor();
    await game.getByText(/Stardust boost/).waitFor();
  },
});
