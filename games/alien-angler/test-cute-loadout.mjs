import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 30_000,
  screenshot: "../../outputs/alien-angler-cute-loadout.png",
  check: async ({ game }) => {
    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByRole("button", { name: "cosmetics", exact: true }).click();
    const aura = game.locator(".shop-card").filter({ hasText: "Cosmic Aura" });
    await aura.getByRole("button", { name: /375 RF/ }).click();
    await aura.getByRole("button", { name: "EQUIP", exact: true }).click();
    await game.getByRole("button", { name: "ufos", exact: true }).click();
    const scout = game.locator(".shop-card").filter({ hasText: "Scout UFO" });
    await scout.getByRole("button", { name: /75 RF/ }).click();
    await scout.getByRole("button", { name: "EQUIP", exact: true }).click();
    await game.getByRole("button", { name: "pools", exact: true }).click();
    const crystal = game.locator(".shop-card").filter({ hasText: "Crystal Void" });
    await crystal.getByRole("button", { name: /450 RF/ }).click();
    await crystal.getByRole("button", { name: "EQUIP", exact: true }).click();
    await game.getByRole("button", { name: /CLOSE/ }).click();
    await game.locator(".shop-shell").waitFor({ state: "hidden" });
  },
});
