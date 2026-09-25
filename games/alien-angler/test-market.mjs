import { testGame } from "@rarefriends/friendsdk/testing";

const width = Number(process.env.TEST_WIDTH || 960);

await testGame("./games/alien-angler", {
  width,
  height: 720,
  timeout: 30_000,
  screenshot: process.env.TEST_SCREENSHOT || "../../outputs/alien-angler-market.png",
  check: async ({ game }) => {
    await game.getByRole("button", { name: "MARKET", exact: true }).click();
    await game.getByRole("heading", { name: "STAR MARKET" }).waitFor();
    await game.getByRole("button", { name: "ufos", exact: true }).click();
    const scout = game.locator(".shop-card").filter({ hasText: "Scout UFO" });
    await scout.getByRole("button", { name: /75 RF/ }).click();
    await scout.getByRole("button", { name: "EQUIP", exact: true }).click();
    await scout.getByText("EQUIPPED", { exact: true }).first().waitFor();
    await game.getByText("◆ 925.0 RF", { exact: true }).first().waitFor();
  },
});
