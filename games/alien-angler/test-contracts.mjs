import { testGame } from "@rarefriends/friendsdk/testing";
import assert from "node:assert/strict";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 35_000,
  check: async ({ game }) => {
    await game.locator("body").evaluate(() => { Math.random = () => 0.01; });
    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByRole("button", { name: "CONTRACTS" }).click();
    const board = game.getByRole("region", { name: "Contracts board" });
    await board.getByRole("button", { name: "WEEKLY CONSTELLATION" }).click();
    assert.equal(await board.locator(".constellation-board article.filled").count(), 1, "A real catch should fill one matching weekly slot");
    await board.getByRole("button", { name: "DAILY CONTRACTS" }).click();
    await board.getByRole("button", { name: "DEMO FILL" }).click();
    assert.equal(await board.locator(".daily-contracts>article.complete").count(), 3, "All selected daily contracts should complete");
    await board.getByRole("button", { name: "OPEN SIGNAL" }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-daily-contracts.png" });

    await board.getByRole("button", { name: "WEEKLY CONSTELLATION" }).click();
    await board.getByRole("button", { name: "DEMO FILL" }).click();
    assert.equal(await board.locator(".constellation-board article.filled").count(), 9, "Every weekly constellation slot should fill");
    for (let row = 0; row < 3; row++) await board.getByRole("button", { name: "CLAIM", exact: true }).first().click();
    await board.getByRole("button", { name: "EQUIP LIMITED CONSTELLATION HALO" }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-weekly-constellation.png" });
    await board.getByRole("button", { name: /close/i }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-constellation-halo.png" });
  },
});
