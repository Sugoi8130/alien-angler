import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 35_000,
  check: async ({ game }) => {
    await game.getByRole("button", { name: "CONTRACTS" }).click();
    const board = game.getByRole("region", { name: "Contracts board" });
    await board.getByRole("button", { name: "WEEKLY CONSTELLATION" }).click();
    await board.getByRole("button", { name: "DEMO FILL" }).click();
    for (let row = 0; row < 3; row++) await board.getByRole("button", { name: "CLAIM", exact: true }).first().click();
    await board.getByRole("button", { name: "EQUIP LIMITED CONSTELLATION HALO I" }).click();
    await board.getByRole("button", { name: /close/i }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-halo-i.png" });

    await game.getByRole("button", { name: "MARKET" }).click();
    await game.getByRole("button", { name: "workshop" }).click();
    await game.getByRole("button", { name: "DEMO +2500 DUST" }).click();
    await game.getByRole("button", { name: "DEMO +20 FRAGMENTS" }).click();
    for (let tier = 0; tier < 3; tier++) await game.locator(".upgrade-card").getByRole("button").click();
    await game.getByText("ANIMATED UPGRADE APPLIED", { exact: true }).waitFor({ state: "visible" });
    await game.getByRole("button", { name: /close/i }).click();
    await game.locator("body").screenshot({ path: "../../outputs/alien-angler-halo-iii.png" });
  },
});
