import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 30_000,
  check: async ({ page, game }) => {
    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    const market = game.locator(".shop-shell");
    await market.waitFor();
    for (const category of ["baits", "cosmetics", "ufos", "pools"]) {
      await game.getByRole("button", { name: category, exact: true }).click();
      await page.waitForTimeout(150);
      await market.screenshot({ path: `../../outputs/alien-angler-market-${category}.png` });
    }
  },
});
