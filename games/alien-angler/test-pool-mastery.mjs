import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 45_000,
  check: async ({ game }) => {
    await game.locator("body").evaluate(() => { Math.random = () => 0.96; });
    await game.getByRole("button", { name: "MARKET" }).click();
    await game.getByRole("button", { name: /LV 10 COSMIC/ }).click();
    await game.getByRole("button", { name: /close/i }).click();
    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByText("COSMIC VARIANT", { exact: false }).waitFor({ state: "visible" });

    await game.getByRole("button", { name: "MARKET" }).click();
    await game.getByRole("button", { name: /LV 30 QUEST/ }).click();
    await game.getByRole("button", { name: "EQUIP POOL OUTFIT" }).click();
    await game.getByText("STABILIZE THE BOSS PORTAL", { exact: true }).waitFor({ state: "visible" });
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-pool-mastery-roadmap.png" });
    await game.getByRole("button", { name: /close/i }).click();
    await game.getByText("POOL LV 30", { exact: true }).waitFor({ state: "visible" });
    await game.getByText("BOSS PORTAL", { exact: true }).waitFor({ state: "visible" });
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-pool-mastery-lv30.png" });
  },
});
