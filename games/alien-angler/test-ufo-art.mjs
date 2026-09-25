import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 30_000,
  screenshot: "../../outputs/alien-angler-concept-game.png",
  check: async ({ game }) => {
    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByRole("button", { name: "ufos", exact: true }).click();
    const bio = game.locator(".shop-card").filter({ hasText: "Bio Saucer" });
    await bio.getByRole("button", { name: /350 RF/ }).click();
    await bio.getByRole("button", { name: "EQUIP", exact: true }).click();
    await game.getByRole("button", { name: /CLOSE/ }).click();
    await game.locator(".shop-shell").waitFor({ state: "hidden" });
  },
});
