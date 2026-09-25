import { testGame } from "@rarefriends/friendsdk/testing";

const upgrades = [
  ["Scout UFO", /75 RF/, "scout"],
  ["Retro Cruiser", /180 RF/, "retro-cruiser"],
  ["Bio Saucer", /350 RF/, "bio-saucer"],
];

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 45_000,
  check: async ({ page, game }) => {
    await page.waitForTimeout(250);
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-ufo-starter.png" });

    for (const [name, price, slug] of upgrades) {
      await game.getByRole("button", { name: "MARKET", exact: true }).click();
      await game.getByRole("button", { name: "ufos", exact: true }).click();
      const card = game.locator(".shop-card").filter({ hasText: name });
      await card.getByRole("button", { name: price }).click();
      await card.getByRole("button", { name: "EQUIP", exact: true }).click();
      await game.getByRole("button", { name: /CLOSE/ }).click();
      await game.locator(".shop-shell").waitFor({ state: "hidden" });
      await page.waitForTimeout(250);
      await game.locator("body").screenshot({ path: `../../outputs/alien-angler-ufo-${slug}.png` });
    }
  },
});
