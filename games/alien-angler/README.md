# Alien Angler

Alien Angler is an idle fishing prototype for the Rare Friends Vibeathon. The
player's verified Rare Friend sits on a living, gently bobbing UFO and lowers a
signal line into a cosmic pool. The demo contains five catchable alien species.

## Run

From the FriendSDK v0.1.3 repository root:

```sh
npm ci
npm run dev:game -- games/alien-angler --host 0.0.0.0 --port 4173
```

Open `http://localhost:4173`. The FriendSDK runtime requires a browser wallet on
Robinhood mainnet (chain 4663) that owns a hardwired Rare Friends Generations NFT
(generation 1 or higher).

Run `node games/alien-angler/test.mjs` for the focused phone-width catch test.

## Demo loop

1. The UFO casts a signal line automatically.
2. The galaxy pool is scanned for about three seconds.
3. When **ALIEN DETECTED!** appears, the player may press **REEL NOW**.
4. If the player does nothing, idle mode reels automatically.
5. One alien is revealed and added to its species slot in the session collection.
6. The next cast starts automatically.

When the equipped bait reaches zero, the loop pauses on an **OUT OF BAIT** notice.
The Market remains closed until the player opens it manually, buys bait or equips
another stocked bait, and then closes the Market to resume fishing.

| Alien | Rarity | Catch chance |
| --- | --- | ---: |
| Nebula Glorp | Normal | 50% |
| Orbit Jelly | Rare | 30% |
| Void Crab | Epic | 11% |
| Comet Koi | Legendary | 6% |
| Star Eater | Mythical | 3% |

The five rarity weights total exactly 100%. Each specimen starts as **UNKNOWN**.
Its pixel model, name, rarity and rate unlock only after that species is caught
for the first time, while the guide tracks the session count.

Every catch also rolls an independent collectible visual variant. **Default** is
70%, **Shiny** 12%, **Glitched** 5%, **Baby** 8%, **Cosmic** 3%, and
**Seasonal** 2%. Each species has all six slots, creating a 30-variant archive;
the collection guide shows the latest caught look and the number unlocked for
that species. Selecting any discovered species opens its Variant Archive with
all six slots, unlocked pixel models, individual catch counts, and hidden
**UNKNOWN** cards for looks not yet found. Opening the archive pauses the current
fishing phase until it is closed. Variants change the pixel model and reveal treatment only. They do
not alter RF, Stardust, Pool XP, or species catch odds.

Reloading resets the demo because FriendSDK v0.1.3 does not supply persistent
save storage. Sound begins muted, reduced motion is supported, and the loop pauses
while the trusted FriendSDK menu is open.

## Local economy demo

The **Star Market** previews a session-only economy with a 1,000 RF test balance.
It includes four bait offers, four cosmetics, four UFOs and four galaxy pools.
Purchases update the balance and inventory locally; owned cosmetics, craft and
pools can be equipped immediately and change the canvas artwork. Bait stock is
consumed per cast. Shimmer bait adds a visual catch aura, while Discovery bait
rerolls once when the first result is a species already present in the collection.

The market deliberately performs no wallet signature and no token transfer. Its
balance, ownership and loadout reset on reload because the sandbox cannot access
browser storage. Persistent RF purchases require a separately reviewed store
contract or a future SDK action rather than trusting client-side state.

Market cards use the approved 4×4 pixel concept sheet in
`assets/economy-concepts-v2.png` as a sprite atlas. The revised models use
chunkier 8/16-bit silhouettes, one bright accent colour and deliberately playful
details, including smiling bait, antenna ears, a crooked crown and a friendly bio
saucer eye. Gameplay keeps the earlier code-native canvas treatment but now makes
equipped items much easier to distinguish: each outfit changes the Friend's
silhouette, each UFO has its own pods/antennae/eye, each pool adds a large animated
landmark, and each bait uses a different bobber shape and colour.

Each local reveal also credits the market balance with the manifest's displayed
demo reward (0.2 / 0.5 / 1 / 3 / 10 RF). This fixes the previous UX where a catch
only changed collection count. It remains simulated session state—not minted or
redeemable RF—because this prototype still makes no `settle` or `redeem` call.

The retention economy adds four session-only systems. **Daily Supply** may be
claimed once per loaded session for three Basic Baits. Every catch grants
Stardust (5 / 12 / 30 / 75 / 200 before bonuses) and Pool Mastery XP
(10 / 16 / 28 / 48 / 90). Each 100 XP raises that pool by one level, up to 30;
every five mastery levels add a 10% Stardust bonus. Shimmer Bait adds a further
25% Stardust bonus.

Pool Mastery now has visible and functional milestone rewards. At level 5 the
equipped pool gains a brighter third spiral lane and evolved event horizon. At
level 10 that pool enables the 3% Cosmic variant roll (before then its weight is
folded into Default). Level 15 adds a pool-coloured orbit ring, signal nodes and
twin thruster trails to every equipped UFO. Level 20 unlocks an equipable outfit
whose visor, cape and energy core inherit the pool palette. Level 30 opens an
animated boss portal and a Mythical Quest: catch Epic+, catch a non-Default
variant, and complete ten casts in that pool. Once all three objectives are met,
the next catch becomes the Cosmic **Star Eater Prime** boss signal without an RF
multiplier.

The Market shows a six-node mastery roadmap for the active pool. Because this is
a review build, its level nodes may be selected to preview LV1/5/10/15/20/30
immediately; the selected session XP is updated to the matching threshold. Normal
play still awards mastery from catches, and each pool keeps independent XP and
quest state. These preview controls and all mastery progress reset on reload.

Duplicate catches fill the **Signal Meter**. At 10 duplicate signals the next
eligible roll protects an undiscovered species, at 25 it protects an
undiscovered Epic-or-better species, and at 60 it protects an undiscovered
Legendary-or-better species. A new discovery resets the meter and adds a one-time
RF bonus of 0.5 / 1 / 2 / 5 / 15 RF by rarity. All balances, daily claims,
mastery and meter progress reset on reload; these are economy UX simulations,
not persistent or on-chain rewards. The variant archive is also session-only and
resets on reload.

## Contracts

The HUD **Contracts** button opens two session-based retention boards. Daily
Contracts deterministically select three of five objectives for the current UTC
day: catch ten aliens, use two bait types, catch Rare+, collect 100 Stardust, or
fish in two pools. Catch resolution updates every relevant counter. Completing
all three opens one Mystery Signal with either three Basic Baits, one cosmetic
fragment, or 1.5 simulated RF.

Weekly Constellation presents nine requested alien slots in three rows. Each
catch fills the first matching empty slot, so repeated Normal aliens remain
useful. Row 1 grants three Shimmer Baits; row 2 grants 150 Stardust and one
fragment; row 3 grants 2 simulated RF and the limited **Constellation Halo**
cosmetic, which can be equipped directly from the board. The review build has
clearly labelled **Demo Fill** controls for checking reward states without a
full day or week of play.

FriendSDK currently provides no persistent game save or trusted reset scheduler,
so the prototype derives board layouts from UTC day/week but resets progress,
claims and fragments on reload. Production daily/weekly claims must be stored
and validated against trusted server time rather than client state.

## Stardust Workshop

Stardust is now the demo's spendable soft currency. The Market **Workshop** tab
offers six session recipes: three Basic Baits for 40 Stardust, one Shimmer Bait
for 75, a one-use Variant Scanner for 120, one Daily Contract reroll for 25,
a Mystery Cosmetic Chest for three fragments plus 250 Stardust, and tier upgrades for
the currently equipped cosmetic. The review build includes clearly
labelled demo grants for inspecting recipes without grinding.

The Variant Scanner doubles every eligible non-Default variant weight on the
next catch, with Default reduced so the roll still totals exactly 100%. Cosmic
remains unavailable before Pool Mastery level 10, Scanner or not. The charge is
consumed when reeling begins and never modifies species odds or RF rewards.
Mystery Cosmetic Chests have a 30% chance to unlock an unowned market cosmetic
and a 70% chance to drop bait (35% Basic, 25% Shimmer, 10% Discovery). A
cosmetic roll after completing the collection converts into five fragments.
Every cosmetic keeps
its own progression: **Base → Recolor → Glow → Animated**. Recolor costs two
fragments plus 300 Stardust, Glow costs four plus 500, and Animated costs five
plus 750. Recolor preserves the silhouette while swapping accent plates; Glow
adds a cyan rim, core and sparks; Animated adds segmented orbits, comet nodes and
trails. The Weekly Constellation reward begins as **Halo I** and reaches the
double-ring, six-star **Halo III** treatment only at Animated tier.
Each Daily board may be rerolled only once per session and not after its Mystery
Signal has been claimed.

## SDK and economy scope

FriendSDK v0.1.3 provides wallet connection, Friend selection, fresh ownership
checks, canonical Friend artwork, the sandbox and initial session read. This demo
does not call `buy`, `play`, `settle` or `redeem`; all catches are local and have
no RF value. `game.json` is a schema-compatible placeholder required by the
current CLI and mirrors the local rarity weights, but its RF reward values are
not presented as an implemented economy. Future bait, rewards and RF integration
will be documented when those mechanics exist.

The gameplay interface and animated scene remain code-native canvas/CSS artwork.
The builder-approved generated economy concept sheet is bundled for the Star
Market previews; no third-party assets are bundled.
