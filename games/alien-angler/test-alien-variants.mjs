import { testGame } from "@rarefriends/friendsdk/testing";
import assert from "node:assert/strict";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 30_000,
  check: async ({ game }) => {
    await game.locator("body").evaluate(() => { Math.random = () => 0.995; });
    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByText("SEASONAL VARIANT", { exact: false }).waitFor({ state: "visible" });
    await game.getByText(/1\/6 VARIANTS/).waitFor({ state: "visible" });
    const reward = await game.locator(".reward-line").textContent();
    assert.match(reward || "", /\+25\.0 RF/, "Variant roll must not multiply the species RF reward or first-discovery bonus");
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-seasonal-variant.png" });
    await game.getByRole("button", { name: "View Star Eater variants" }).click();
    const archive = game.getByRole("dialog", { name: "STAR EATER" });
    await archive.waitFor({ state: "visible" });
    await archive.getByText("SEASONAL", { exact: true }).waitFor({ state: "visible" });
    await archive.getByText("CAUGHT ×1", { exact: true }).waitFor({ state: "visible" });
    assert.equal(await archive.locator("article.locked").count(), 5, "Only the caught Seasonal variant should be unlocked");
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-variant-archive.png" });
    await archive.getByRole("button", { name: /close/i }).click();
    await archive.waitFor({ state: "hidden" });
  },
});
