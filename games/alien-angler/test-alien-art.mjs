import { testGame } from "@rarefriends/friendsdk/testing";

await testGame("./games/alien-angler", {
  width: 960,
  height: 720,
  timeout: 30_000,
  screenshot: "../../outputs/alien-angler-alien-model.png",
  check: async ({ game }) => {
    await game.locator(".phase-bite").waitFor({ state: "visible" });
    await game.getByRole("button", { name: /reel now/i }).click();
    await game.locator(".phase-reveal").waitFor({ state: "visible" });
    await game.getByText(/SPECIMEN 00[1-5]/).waitFor({ state: "visible" });
  },
});
