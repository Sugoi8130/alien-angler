import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 40_000,
  check: async ({ game }) => {
    await game.getByRole("button", { name: "MARKET" }).click();
    await game.getByRole("button", { name: "workshop" }).click();
    await game.getByRole("button", { name: "DEMO +2500 DUST" }).click();
    await game.getByRole("button", { name: "DEMO +20 FRAGMENTS" }).click();
    const recipe = name => game.locator(".workshop-card").filter({ hasText: name });
    await recipe("Basic Bait Bundle").getByRole("button").click();
    await recipe("Shimmer Bait").getByRole("button").click();
    await recipe("Variant Scanner").getByRole("button").click();
    await recipe("Contract Reroll").getByRole("button").click();
    await game.locator("body").evaluate(() => { Math.random = () => 0.1; });
    await recipe("Mystery Cosmetic Chest").getByRole("button").click();
    await game.getByRole("button", { name: "cosmetics" }).click();
    await game.locator(".shop-card").filter({ hasText: "Space Fisher" }).getByRole("button", { name: "EQUIP" }).click();
    await game.getByRole("button", { name: "workshop" }).click();
    const upgrade = () => game.locator(".upgrade-card").getByRole("button").click();
    await upgrade();
    await game.getByText("RECOLOR UPGRADE APPLIED", { exact: true }).waitFor({ state: "visible" });
    await game.getByRole("button", { name: /close/i }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-cosmetic-recolor.png" });

    await game.getByRole("button", { name: "MARKET" }).click();
    await game.getByRole("button", { name: "workshop" }).click();
    await upgrade();
    await game.getByText("GLOW UPGRADE APPLIED", { exact: true }).waitFor({ state: "visible" });
    await game.getByRole("button", { name: /close/i }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-cosmetic-glow.png" });

    await game.getByRole("button", { name: "MARKET" }).click();
    await game.getByRole("button", { name: "workshop" }).click();
    await upgrade();
    await game.getByText("ANIMATED UPGRADE APPLIED", { exact: true }).waitFor({ state: "visible" });
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-cosmetic-workshop.png" });
    await game.getByRole("button", { name: /close/i }).click();

    await game.locator("body").evaluate(() => { Math.random = () => 0.5; });
    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByText("SHINY VARIANT", { exact: false }).waitFor({ state: "visible" });
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-cosmetic-animated.png" });
  },
});
