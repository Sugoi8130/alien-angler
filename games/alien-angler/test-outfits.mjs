import { testGame } from "@rarefriends/friendsdk/testing";

const outfits = [
  ["Space Fisher", /40 RF/, "space-fisher"],
  ["Astro Suit", /225 RF/, "astro-suit"],
  ["Cosmic Aura", /375 RF/, "cosmic-aura"],
  ["Royal Set", /600 RF/, "royal-set"],
];

for (const [name, price, slug] of outfits) {
  await testGame("./games/alien-angler", {
    width: 960,
    height: 720,
    timeout: 45_000,
    check: async ({ game }) => {
      await game.getByRole("button", { name: "MARKET", exact: true }).click();
      await game.getByRole("button", { name: "cosmetics", exact: true }).click();
      const card = game.locator(".shop-card").filter({ hasText: name });
      await card.getByRole("button", { name: price }).click();
      await card.getByRole("button", { name: "EQUIP", exact: true }).click();
      await game.getByRole("button", { name: /CLOSE/ }).click();
      await game.locator(".shop-shell").waitFor({ state: "hidden" });
      await game.locator("body").screenshot({ path: `../../outputs/alien-angler-outfit-${slug}.png` });
    },
  });
}
