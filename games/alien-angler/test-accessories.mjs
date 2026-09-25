import { testGame } from "@rarefriends/friendsdk/testing";

const accessories = [
  ["Star Sprout", /110 RF/, "star-sprout"],
  ["Orbit Headphones", /140 RF/, "orbit-headphones"],
  ["Nebula Wings", /190 RF/, "nebula-wings"],
  ["Comet Buddy", /240 RF/, "comet-buddy"],
];

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 45_000,
  check: async ({ game }) => {
    for (const [name, price, slug] of accessories) {
      await game.getByRole("button", { name: "MARKET", exact: true }).click();
      await game.getByRole("button", { name: "cosmetics", exact: true }).click();
      const card = game.locator(".shop-card").filter({ hasText: name });
      await card.scrollIntoViewIfNeeded();
      await card.getByRole("button", { name: price }).click();
      await card.getByRole("button", { name: "EQUIP", exact: true }).click();
      await game.getByRole("button", { name: /CLOSE/ }).click();
      await game.locator(".shop-shell").waitFor({ state: "hidden" });
      await game.locator("body").screenshot({ path: `../../outputs/alien-angler-accessory-${slug}.png` });
    }
  },
});
