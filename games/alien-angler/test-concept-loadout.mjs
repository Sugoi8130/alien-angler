import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 30_000,
  screenshot: "../../outputs/alien-angler-classic-restored.png",
  check: async ({ game }) => {
    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByRole("button", { name: "cosmetics", exact: true }).click();
    const royal = game.locator(".shop-card").filter({ hasText: "Royal Set" });
    await royal.getByRole("button", { name: /600 RF/ }).click();
    await royal.getByRole("button", { name: "EQUIP", exact: true }).click();
    await game.getByRole("button", { name: /CLOSE/ }).click();
    await game.locator(".shop-shell").waitFor({ state: "hidden" });
  },
});
