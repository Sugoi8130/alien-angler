"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { createFriendReader, spriteFrame, type GenerationSprites } from "@rarefriends/friendsdk/sprites";
import { createFriendSoundKit, type FriendSoundKit } from "@rarefriends/friendsdk/sounds";
import economyConcepts from "./assets/economy-concepts-v2.png";
import "./style.css";

type Phase = "casting" | "waiting" | "bite" | "reeling" | "reveal";
const phaseDuration: Record<Phase, number> = { casting: 1_100, waiting: 3_200, bite: 1_500, reeling: 1_700, reveal: 2_600 };
const nextPhase: Record<Phase, Phase> = { casting: "waiting", waiting: "bite", bite: "reeling", reeling: "reveal", reveal: "casting" };
const aliens = [
  { name: "Nebula Glorp", rarity: "Normal", chanceBps: 5_000, reward: .2, accent: "#b8ff58" },
  { name: "Orbit Jelly", rarity: "Rare", chanceBps: 3_000, reward: .5, accent: "#5de8ff" },
  { name: "Void Crab", rarity: "Epic", chanceBps: 1_100, reward: 1, accent: "#bd7cff" },
  { name: "Comet Koi", rarity: "Legendary", chanceBps: 600, reward: 3, accent: "#ffd25d" },
  { name: "Star Eater", rarity: "Mythical", chanceBps: 300, reward: 10, accent: "#ff6fae" },
] as const;
const alienVariants = [
  { id: "default", name: "Default", chanceBps: 7_000, accent: "#f7f2df" },
  { id: "shiny", name: "Shiny", chanceBps: 1_200, accent: "#ffd25d" },
  { id: "glitched", name: "Glitched", chanceBps: 500, accent: "#ff6fae" },
  { id: "baby", name: "Baby", chanceBps: 800, accent: "#b8ff58" },
  { id: "cosmic", name: "Cosmic", chanceBps: 300, accent: "#bd7cff" },
  { id: "seasonal", name: "Seasonal", chanceBps: 200, accent: "#5de8ff" },
] as const;
const emptyVariantCollection = () => aliens.map(() => alienVariants.map(() => 0));
type StoreCategory = "baits" | "cosmetics" | "ufos" | "pools" | "workshop";
type StoreItem = { id: string; name: string; category: StoreCategory; price: number; accent: string; description: string; amount?: number };
type DemoEconomy = {
  balance: number;
  stardust: number;
  fragments: number;
  signal: number;
  dailyClaimed: boolean;
  dailyContractClaimed: boolean;
  dailyRerolled: boolean;
  dailyContractOffset: number;
  variantScanners: number;
  cosmeticUpgrades: Record<string, number>;
  dailyProgress: { catches: number; baits: string[]; rarePlus: number; stardust: number; pools: string[] };
  weeklyProgress: boolean[];
  weeklyClaims: boolean[];
  poolXp: Record<string, number>;
  owned: string[];
  baitStock: Record<string, number>;
  poolQuests: Record<string, { epic: boolean; variant: boolean; casts: number; bossCaught: boolean }>;
  equipped: { bait: string; cosmetic: string; ufo: string; pool: string };
};
type CatchReward = { rf: number; stardust: number; masteryXp: number; discovery: boolean };
const storeItems: StoreItem[] = [
  { id: "basic-bait", name: "Basic Signal", category: "baits", price: 1, amount: 1, accent: "#b8ff58", description: "+1 standard cast" },
  { id: "signal-pack", name: "Signal Pack", category: "baits", price: 9.5, amount: 10, accent: "#f7f2df", description: "+10 standard casts" },
  { id: "shimmer-bait", name: "Shimmer Bait", category: "baits", price: 10, amount: 5, accent: "#5de8ff", description: "+5 cosmetic-variant casts" },
  { id: "discovery-bait", name: "Discovery Bait", category: "baits", price: 15, amount: 5, accent: "#ffd25d", description: "+5 undiscovered signals" },
  { id: "space-fisher", name: "Space Fisher", category: "cosmetics", price: 40, accent: "#b8ff58", description: "Hat + signal glasses" },
  { id: "astro-suit", name: "Astro Suit", category: "cosmetics", price: 225, accent: "#f7f2df", description: "Classic explorer shell" },
  { id: "cosmic-aura", name: "Cosmic Aura", category: "cosmetics", price: 375, accent: "#bd7cff", description: "Orbiting stardust" },
  { id: "royal-set", name: "Royal Set", category: "cosmetics", price: 600, accent: "#ffd25d", description: "Crown + void cape" },
  { id: "star-sprout", name: "Star Sprout", category: "cosmetics", price: 110, accent: "#b8ff58", description: "Bouncy lucky antenna" },
  { id: "orbit-headphones", name: "Orbit Headphones", category: "cosmetics", price: 140, accent: "#5de8ff", description: "Cosmic beat ear cups" },
  { id: "nebula-wings", name: "Nebula Wings", category: "cosmetics", price: 190, accent: "#bd7cff", description: "Tiny animated star wings" },
  { id: "comet-buddy", name: "Comet Buddy", category: "cosmetics", price: 240, accent: "#ffd25d", description: "A cheerful orbit companion" },
  { id: "starter-ufo", name: "Starter Saucer", category: "ufos", price: 0, accent: "#b8ff58", description: "Original fishing craft" },
  { id: "scout-ufo", name: "Scout UFO", category: "ufos", price: 75, accent: "#5de8ff", description: "Compact twin engines" },
  { id: "cruiser-ufo", name: "Retro Cruiser", category: "ufos", price: 180, accent: "#ffd25d", description: "Wide deep-space hull" },
  { id: "bio-ufo", name: "Bio Saucer", category: "ufos", price: 350, accent: "#b8ff58", description: "A living cosmic vessel" },
  { id: "genesis-pool", name: "Genesis Whirlpool", category: "pools", price: 0, accent: "#36d7b3", description: "The original galaxy" },
  { id: "crimson-pool", name: "Crimson Rift", category: "pools", price: 250, accent: "#ff496f", description: "A volatile red spiral" },
  { id: "crystal-pool", name: "Crystal Void", category: "pools", price: 450, accent: "#bd7cff", description: "Amethyst star field" },
  { id: "ancient-pool", name: "Ancient Black Hole", category: "pools", price: 700, accent: "#ffd25d", description: "The oldest known signal" },
];
const defaultEconomy: DemoEconomy = {
  balance: 1_000,
  stardust: 0,
  fragments: 0,
  signal: 0,
  dailyClaimed: false,
  dailyContractClaimed: false,
  dailyRerolled: false,
  dailyContractOffset: 0,
  variantScanners: 0,
  cosmeticUpgrades: {},
  dailyProgress: { catches: 0, baits: [], rarePlus: 0, stardust: 0, pools: [] },
  weeklyProgress: Array.from({ length: 9 }, () => false),
  weeklyClaims: [false, false, false],
  poolXp: { "genesis-pool": 0, "crimson-pool": 0, "crystal-pool": 0, "ancient-pool": 0 },
  owned: ["starter-ufo", "genesis-pool"],
  baitStock: { "basic-bait": 5, "shimmer-bait": 0, "discovery-bait": 0 },
  poolQuests: {
    "genesis-pool": { epic: false, variant: false, casts: 0, bossCaught: false },
    "crimson-pool": { epic: false, variant: false, casts: 0, bossCaught: false },
    "crystal-pool": { epic: false, variant: false, casts: 0, bossCaught: false },
    "ancient-pool": { epic: false, variant: false, casts: 0, bossCaught: false },
  },
  equipped: { bait: "basic-bait", cosmetic: "", ufo: "starter-ufo", pool: "genesis-pool" },
};

const discoveryBonuses = [.5, 1, 2, 5, 15] as const;
const stardustRewards = [5, 12, 30, 75, 200] as const;
const masteryRewards = [10, 16, 28, 48, 90] as const;
const dailyContractCatalog = [
  { id: "catches", label: "Catch 10 aliens", target: 10, progress: (economy: DemoEconomy) => economy.dailyProgress.catches },
  { id: "baits", label: "Use 2 bait types", target: 2, progress: (economy: DemoEconomy) => economy.dailyProgress.baits.length },
  { id: "rare", label: "Catch Rare or better", target: 1, progress: (economy: DemoEconomy) => economy.dailyProgress.rarePlus },
  { id: "dust", label: "Collect 100 Stardust", target: 100, progress: (economy: DemoEconomy) => economy.dailyProgress.stardust },
  { id: "pools", label: "Fish in 2 pools", target: 2, progress: (economy: DemoEconomy) => economy.dailyProgress.pools.length },
] as const;
const dailySeed = Math.floor(Date.now() / 86_400_000);
const getDailyContracts = (offset = 0) => [0, 2, 4].map(step => dailyContractCatalog[(dailySeed + step + offset) % dailyContractCatalog.length]);
const weeklySeed = Math.floor(Date.now() / (86_400_000 * 7));
const weeklyPattern = [0, 1, 0, 2, 0, 1, 3, 0, 4] as const;
const weeklyBoard = weeklyPattern.map((value, index) => index === 4 ? (weeklySeed % 2 ? 1 : 0) : value);
const weeklyRewards = ["+3 SHIMMER BAIT", "+150 STARDUST · +1 FRAGMENT", "+2 RF · CONSTELLATION HALO"] as const;
const masteryLevel = (xp: number) => Math.min(30, Math.floor(xp / 100) + 1);
const nextSignalTarget = (signal: number) => signal < 10 ? 10 : signal < 25 ? 25 : 60;
const poolColors: Record<string, { bright: string; mid: string; dark: string; boss: string }> = {
  "genesis-pool": { bright: "#8fffdc", mid: "#36d7b3", dark: "#0c594f", boss: "#5de8ff" },
  "crimson-pool": { bright: "#fff1e8", mid: "#ff496f", dark: "#56112d", boss: "#ff9a7a" },
  "crystal-pool": { bright: "#fff4ff", mid: "#bd7cff", dark: "#321d67", boss: "#5de8ff" },
  "ancient-pool": { bright: "#fff9df", mid: "#ffd25d", dark: "#51330d", boss: "#ff6fae" },
};
const questReady = (quest: DemoEconomy["poolQuests"][string]) => quest.epic && quest.variant && quest.casts >= 10 && !quest.bossCaught;
const rollVariant = (poolLevel = 1, scanner = false) => {
  const roll = Math.floor(Math.random() * 10_000);
  const weights = alienVariants.map(variant => variant.chanceBps);
  if (poolLevel < 10) { weights[0] += weights[4]; weights[4] = 0; }
  if (scanner) {
    const nonDefault = weights.slice(1).reduce((sum, weight) => sum + weight, 0);
    weights[0] = 10_000 - nonDefault * 2;
    for (let index = 1; index < weights.length; index++) weights[index] *= 2;
  }
  let boundary = 0;
  return weights.findIndex(weight => (boundary += weight) > roll);
};

const rollAlien = (bait = "basic-bait", collection: number[] = [], signal = 0) => {
  const drawFrom = (indices = aliens.map((_, index) => index)) => {
    const total = indices.reduce((sum, index) => sum + aliens[index].chanceBps, 0);
    const roll = Math.floor(Math.random() * total);
    let boundary = 0;
    return indices.find(index => (boundary += aliens[index].chanceBps) > roll) ?? indices[0];
  };
  const minimumRarity = signal >= 60 ? 3 : signal >= 25 ? 2 : signal >= 10 ? 0 : -1;
  if (minimumRarity >= 0) {
    const undiscovered = aliens.map((_, index) => index).filter(index => index >= minimumRarity && !collection[index]);
    if (undiscovered.length) return drawFrom(undiscovered);
  }
  const draw = () => drawFrom();
  const first = draw();
  return bait === "discovery-bait" && collection[first] > 0 ? draw() : first;
};
const stars = Array.from({ length: 84 }, (_, index) => ({
  x: (index * 137 + 43) % 940 + 10, y: (index * 79 + 31) % 500 + 10,
  size: index % 11 === 0 ? 3 : index % 4 === 0 ? 2 : 1,
}));

function drawFriend(ctx: CanvasRenderingContext2D, sprites: GenerationSprites, x: number, y: number, frame: number, cosmetic: string, cosmeticLevel = 0) {
  const rows = spriteFrame(sprites, "down", false, frame).frame.rows;
  const scale = 6, left = Math.round(x - 48), top = Math.round(y - 92);
  const pulse = frame % 2 === 0 ? 0 : 3;
  const orbit = frame / 8 * Math.PI * 2;
  const outfitPool = cosmetic.startsWith("pool-outfit-") ? cosmetic.replace("pool-outfit-", "") : "";
  const outfitColors = poolColors[outfitPool] || poolColors["genesis-pool"];

  ctx.save();
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";

  // Large back-layer shapes make every equipped outfit readable at phone size.
  if (cosmetic === "constellation-halo") {
    const haloPrimary = cosmeticLevel >= 1 ? "#5de8ff" : "#ffd25d";
    ctx.strokeStyle = haloPrimary; ctx.lineWidth = cosmeticLevel >= 2 ? 5 : 3; ctx.globalAlpha = .88;
    ctx.beginPath(); ctx.ellipse(x, y - 53, 92 + cosmeticLevel * 8, 38 + cosmeticLevel * 3, cosmeticLevel >= 3 ? orbit * .16 : 0, 0, Math.PI * 2); ctx.stroke();
    if (cosmeticLevel >= 2) { ctx.strokeStyle = "#ffd25d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 53, 68, 79, -orbit * .11, 0, Math.PI * 2); ctx.stroke(); }
    if (cosmeticLevel >= 3) {
      // Halo III gains a broken outer constellation path and a counter-rotating ribbon.
      ctx.globalAlpha = .58; ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 2; ctx.setLineDash([15, 9]);
      ctx.beginPath(); ctx.ellipse(x, y - 53, 126, 54, -orbit * .1, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#ffd25d"; ctx.setLineDash([8, 13]);
      ctx.beginPath(); ctx.ellipse(x, y - 53, 91, 91, orbit * .07, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = .92;
    }
    const haloNodes = cosmeticLevel >= 3 ? 6 : cosmeticLevel >= 1 ? 3 : 1;
    for (let index = 0; index < haloNodes; index++) {
      const angle = orbit + index * Math.PI * 2 / haloNodes;
      const nodeRadiusX = cosmeticLevel >= 3 ? 126 : 92 + cosmeticLevel * 8;
      const nodeRadiusY = cosmeticLevel >= 3 ? 54 : 38 + cosmeticLevel * 3;
      const px = x + Math.cos(angle) * nodeRadiusX, py = y - 53 + Math.sin(angle) * nodeRadiusY;
      ctx.fillStyle = index % 2 ? "#5de8ff" : "#ffd25d";
      const starArm = cosmeticLevel >= 3 ? 8 : 5, starBar = cosmeticLevel >= 3 ? 5 : 4;
      ctx.fillRect(Math.round(px - starArm), Math.round(py - starBar / 2), starArm * 2, starBar); ctx.fillRect(Math.round(px - starBar / 2), Math.round(py - starArm), starBar, starArm * 2);
      if (cosmeticLevel >= 3) {
        ctx.fillStyle = "#f7f2df"; ctx.fillRect(Math.round(px - 2), Math.round(py - 2), 4, 4);
        ctx.globalAlpha = .45; ctx.fillStyle = index % 2 ? "#5de8ff" : "#ffd25d";
        ctx.fillRect(Math.round(px - Math.cos(angle) * 23 - 5), Math.round(py - Math.sin(angle) * 11 - 3), 10, 6);
        ctx.fillRect(Math.round(px - Math.cos(angle) * 37 - 3), Math.round(py - Math.sin(angle) * 17 - 2), 6, 4);
        ctx.globalAlpha = .92;
      }
    }
    ctx.globalAlpha = 1;
  } else if (cosmetic === "nebula-wings") {
    // Compact wings keep the Friend readable while giving a strong back silhouette.
    const flap = pulse ? 6 : 0;
    ctx.fillStyle = "#090a0d";
    ctx.fillRect(x - 85, y - 75 - flap, 42, 20); ctx.fillRect(x - 100, y - 58 - flap, 51, 18); ctx.fillRect(x - 78, y - 40, 31, 20);
    ctx.fillRect(x + 43, y - 75 - flap, 42, 20); ctx.fillRect(x + 49, y - 58 - flap, 51, 18); ctx.fillRect(x + 47, y - 40, 31, 20);
    ctx.fillStyle = "#bd7cff";
    ctx.fillRect(x - 80, y - 70 - flap, 33, 10); ctx.fillRect(x - 93, y - 53 - flap, 39, 9); ctx.fillRect(x - 72, y - 35, 21, 10);
    ctx.fillRect(x + 47, y - 70 - flap, 33, 10); ctx.fillRect(x + 54, y - 53 - flap, 39, 9); ctx.fillRect(x + 51, y - 35, 21, 10);
    ctx.fillStyle = "#5de8ff";
    ctx.fillRect(x - 73, y - 65 - flap, 18, 5); ctx.fillRect(x - 85, y - 48 - flap, 22, 5);
    ctx.fillRect(x + 55, y - 65 - flap, 18, 5); ctx.fillRect(x + 63, y - 48 - flap, 22, 5);
  } else if (cosmetic === "comet-buddy") {
    const buddyX = x + 86 + Math.round(Math.cos(orbit) * 8), buddyY = y - 75 + Math.round(Math.sin(orbit) * 11);
    ctx.globalAlpha = .35; ctx.fillStyle = "#5de8ff";
    ctx.fillRect(buddyX - 44, buddyY - 7, 28, 14); ctx.fillRect(buddyX - 58, buddyY - 4, 18, 8);
    ctx.globalAlpha = 1; ctx.fillStyle = "#090a0d"; ctx.fillRect(buddyX - 15, buddyY - 15, 30, 30); ctx.fillRect(buddyX - 21, buddyY - 7, 42, 14);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(buddyX - 11, buddyY - 11, 22, 22); ctx.fillRect(buddyX - 17, buddyY - 5, 34, 10);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(buddyX - 6, buddyY - 4, 4, 4); ctx.fillRect(buddyX + 4, buddyY - 4, 4, 4); ctx.fillRect(buddyX - 3, buddyY + 4, 8, 3);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(buddyX - 3, buddyY - 19 - pulse, 6, 8);
  } else if (outfitPool) {
    ctx.fillStyle = "#090a0d";
    ctx.beginPath(); ctx.moveTo(x - 50, y - 77); ctx.lineTo(x + 28, y - 77); ctx.lineTo(x + 62, y + 17); ctx.lineTo(x - 17, y + 5); ctx.lineTo(x - 67, y + 21); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = outfitColors.mid; ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = outfitColors.bright; ctx.fillRect(x + 38, y - 64, 8, 57); ctx.fillRect(x + 48, y - 48, 18, 8);
  } else if (cosmetic === "space-fisher") {
    ctx.fillStyle = "#5de8ff";
    ctx.fillRect(x + 35, y - 58, 13, 50);
    ctx.fillRect(x + 48, y - 49, 16, 9);
    ctx.fillStyle = "#090a0d";
    ctx.fillRect(x + 39, y - 54, 5, 42);
  } else if (cosmetic === "astro-suit") {
    ctx.fillStyle = "#090a0d";
    ctx.fillRect(x - 66, y - 76, 28, 74);
    ctx.fillRect(x + 38, y - 76, 28, 74);
    ctx.strokeStyle = "#5de8ff";
    ctx.lineWidth = 5;
    ctx.strokeRect(x - 62, y - 71, 20, 62);
    ctx.strokeRect(x + 42, y - 71, 20, 62);
    ctx.fillStyle = "#b8ff58";
    ctx.fillRect(x - 58, y - 63 + pulse, 12, 8);
    ctx.fillRect(x + 46, y - 63 + pulse, 12, 8);
  } else if (cosmetic === "cosmic-aura") {
    ctx.globalAlpha = .28;
    ctx.fillStyle = "#bd7cff";
    ctx.beginPath();
    ctx.arc(x, y - 50, 72 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#bd7cff";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(x, y - 48, 92, 36, orbit, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#5de8ff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y - 48, 66, 88, -orbit * .55, 0, Math.PI * 2); ctx.stroke();
    for (let index = 0; index < 4; index += 1) {
      const angle = orbit + index * Math.PI / 2;
      const px = x + Math.cos(angle) * 92;
      const py = y - 48 + Math.sin(angle) * 36;
      ctx.save(); ctx.translate(Math.round(px), Math.round(py)); ctx.rotate(angle);
      ctx.fillStyle = index % 2 ? "#5de8ff" : "#bd7cff";
      ctx.fillRect(-9, -5, 18, 10); ctx.fillRect(-3, -11, 6, 22);
      ctx.restore();
    }
  } else if (cosmetic === "royal-set") {
    ctx.fillStyle = "#090a0d";
    ctx.beginPath();
    ctx.moveTo(x - 50, y - 78); ctx.lineTo(x + 50, y - 78);
    ctx.lineTo(x + 68, y + 20); ctx.lineTo(x, y + 4); ctx.lineTo(x - 68, y + 20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#bd7cff"; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = "#ffd25d"; ctx.lineWidth = 3; ctx.stroke();
  }

  ctx.fillStyle = "#f7f2df";
  rows.forEach((row, py) => [...row].forEach((pixel, px) => {
    if (pixel === "#") ctx.fillRect(left + px * scale - 3, top + py * scale - 3, 12, 12);
  }));
  ctx.fillStyle = "#090a0d";
  rows.forEach((row, py) => [...row].forEach((pixel, px) => {
    if (pixel === "#") ctx.fillRect(left + px * scale, top + py * scale, scale, scale);
  }));
  if (cosmetic === "constellation-halo") {
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 42, y - 119, 84, 14);
    ctx.fillStyle = cosmeticLevel >= 1 ? "#5de8ff" : "#ffd25d"; ctx.fillRect(x - 34, y - 115, 68, 6);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 6, y - 142 - pulse, 12, 27); ctx.fillRect(x - 18, y - 132 - pulse, 36, 6);
    if (cosmeticLevel >= 3) {
      ctx.fillStyle = "rgba(93,232,255,.18)"; ctx.fillRect(x - 21, y - 171 - pulse, 42, 42);
      ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 5, y - 174 - pulse, 10, 35); ctx.fillRect(x - 22, y - 162 - pulse, 44, 10);
      ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 4, y - 161 - pulse, 8, 8);
    }
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 4, y - 138 - pulse, 8, 8);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 37, y - 27, 74, 8); ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 8, y - 31, 16, 18);
    if (cosmeticLevel >= 3) { ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 4, y - 27, 8, 10); ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 2, y - 40 - pulse, 4, 8); }
  } else if (cosmetic === "star-sprout") {
    // A small spring-mounted star reads as an accessory rather than a full outfit.
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 27, y - 119, 54, 12); ctx.fillRect(x - 4, y - 151 - pulse, 8, 35);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(x - 21, y - 116, 42, 6); ctx.fillRect(x - 2, y - 148 - pulse, 4, 29);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 15, y - 166 - pulse, 30, 30); ctx.fillRect(x - 22, y - 158 - pulse, 44, 14);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 11, y - 162 - pulse, 22, 22); ctx.fillRect(x - 18, y - 154 - pulse, 36, 8);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 3, y - 157 - pulse, 6, 6);
  } else if (cosmetic === "orbit-headphones") {
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y - 83, 48, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 61, y - 91, 23, 48); ctx.fillRect(x + 38, y - 91, 23, 48);
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 56, y - 85, 15, 35); ctx.fillRect(x + 41, y - 85, 15, 35);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 52, y - 77 + pulse, 7, 18 - pulse); ctx.fillRect(x + 45, y - 82, 7, 23 - pulse);
    ctx.fillStyle = "#bd7cff"; ctx.fillRect(x - 7, y - 122 - pulse, 5, 9 + pulse); ctx.fillRect(x + 2, y - 128 + pulse, 5, 15 - pulse);
  } else if (outfitPool) {
    // Mastery outfit: oversized signal hood, glowing visor, asymmetrical cape and pool core.
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 52, y - 118, 104, 28); ctx.fillRect(x - 43, y - 139, 86, 25);
    ctx.fillStyle = outfitColors.bright; ctx.fillRect(x - 45, y - 112, 90, 15); ctx.fillRect(x - 34, y - 132, 68, 13);
    ctx.fillStyle = outfitColors.dark; ctx.fillRect(x - 35, y - 108, 70, 17);
    ctx.fillStyle = outfitColors.mid; ctx.fillRect(x - 29, y - 104, 58, 9); ctx.fillStyle = "#f7f2df"; ctx.fillRect(x + 17, y - 102, 8, 5);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 55, y - 30, 110, 41);
    ctx.fillStyle = outfitColors.mid; ctx.fillRect(x - 48, y - 24, 33, 28); ctx.fillRect(x + 15, y - 24, 33, 28);
    ctx.fillStyle = outfitColors.bright; ctx.fillRect(x - 13, y - 31, 26, 34); ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 5, y - 22, 10, 17);
    ctx.fillStyle = outfitColors.boss; ctx.fillRect(x - 7, y - 154 - pulse, 14, 14); ctx.fillRect(x - 13, y - 148 - pulse, 26, 4);
  } else if (cosmetic === "space-fisher") {
    // Oversized bucket hat, glowing signal goggles and a fish-shaped chest badge.
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 50, y - 111, 100, 17); ctx.fillRect(x - 35, y - 135, 70, 29);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 44, y - 107, 88, 9); ctx.fillRect(x - 29, y - 129, 58, 20);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(x - 29, y - 115, 58, 8);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 35, y - 82, 31, 17); ctx.fillRect(x + 4, y - 82, 31, 17); ctx.fillRect(x - 4, y - 76, 8, 5);
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 29, y - 78, 20, 8); ctx.fillRect(x + 9, y - 78, 20, 8);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(x + 25, y - 148, 6, 19); ctx.fillRect(x + 21, y - 153, 14, 8);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 35, y - 24, 70, 9); ctx.fillRect(x - 28, y - 15, 7, 26); ctx.fillRect(x + 21, y - 15, 7, 26);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(x - 10, y - 20, 20, 12); ctx.fillRect(x + 10, y - 17, 7, 6);
  } else if (cosmetic === "astro-suit") {
    // Chunky pressure shell keeps the Friend face visible through a luminous visor.
    ctx.strokeStyle = "#090a0d"; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(x, y - 59, 59, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#f7f2df"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y - 59, 57, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y - 59, 48, Math.PI * 1.08, Math.PI * 1.88); ctx.stroke();
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 61, y - 20, 122, 44); ctx.fillRect(x - 76, y - 12, 22, 28); ctx.fillRect(x + 54, y - 12, 22, 28);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 54, y - 14, 108, 31); ctx.fillRect(x - 70, y - 7, 17, 18); ctx.fillRect(x + 53, y - 7, 17, 18);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 29, y - 10, 58, 24);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(x - 23, y - 4, 13, 10); ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 4, y - 4, 13, 10); ctx.fillStyle = "#bd7cff"; ctx.fillRect(x + 15, y - 4, 8, 10);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 64, y + 17, 22, 9); ctx.fillRect(x + 42, y + 17, 22, 9);
  } else if (cosmetic === "cosmic-aura") {
    // A short energy jacket and bright core anchor the moving aura to the Friend.
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 52, y - 32, 104, 35);
    ctx.fillStyle = "#bd7cff"; ctx.fillRect(x - 48, y - 27, 28, 25); ctx.fillRect(x + 20, y - 27, 28, 25);
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 18, y - 24, 36, 7); ctx.fillRect(x - 7, y - 35, 14, 29);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 3, y - 31, 6, 21);
    ctx.fillStyle = "#bd7cff"; ctx.fillRect(x - 5, y - 126 - pulse, 10, 10); ctx.fillRect(x - 11, y - 120 - pulse, 22, 4);
  } else if (cosmetic === "royal-set") {
    // Deliberately crooked crown, huge epaulettes and a jeweled sash feel grand but playful.
    ctx.save(); ctx.translate(x - 2, y - 112); ctx.rotate(-.09);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(-42, -9, 84, 18); ctx.fillRect(-34, -38, 18, 34); ctx.fillRect(-9, -51, 18, 47); ctx.fillRect(17, -32, 18, 28);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(-36, -5, 72, 10); ctx.fillRect(-28, -31, 10, 27); ctx.fillRect(-5, -43, 10, 39); ctx.fillRect(21, -25, 10, 21);
    ctx.fillStyle = "#bd7cff"; ctx.fillRect(-5, -2, 10, 8); ctx.restore();
    ctx.fillStyle = "#090a0d"; ctx.fillRect(x - 73, y - 71, 36, 25); ctx.fillRect(x + 37, y - 71, 36, 25);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 67, y - 65, 30, 13); ctx.fillRect(x + 37, y - 65, 30, 13);
    ctx.fillStyle = "#bd7cff"; ctx.fillRect(x - 44, y - 31, 88, 12); ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 7, y - 35, 14, 20);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 82, y - 92 - pulse, 8, 8); ctx.fillRect(x + 76, y - 35 + pulse, 8, 8);
  }
  if (cosmetic && cosmetic !== "constellation-halo" && cosmeticLevel >= 1) {
    // Recolor keeps the silhouette intact and swaps only high-value accent plates.
    ctx.fillStyle = "#bd7cff"; ctx.fillRect(x - 33, y - 115, 66, 7); ctx.fillRect(x - 42, y - 24, 26, 17); ctx.fillRect(x + 16, y - 24, 26, 17);
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(x - 27, y - 80, 20, 8); ctx.fillRect(x + 7, y - 80, 20, 8);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 8, y - 31, 16, 18);
  }
  if (cosmetic && cosmetic !== "constellation-halo" && cosmeticLevel >= 2) {
    // Glow is readable at phone scale: one rim, a bright core and five fixed sparks.
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 3; ctx.globalAlpha = .82;
    ctx.beginPath(); ctx.ellipse(x, y - 48, 66 + pulse, 82, 0, 0, Math.PI * 2); ctx.stroke();
    [[-58,-98],[54,-82],[-67,-24],[62,4],[0,-151]].forEach(([dx, dy], index) => {
      const flicker = index % 2 ? pulse : -pulse; ctx.fillStyle = index % 2 ? "#ffd25d" : "#5de8ff";
      ctx.fillRect(x + dx - 5, y + dy + flicker - 2, 10, 4); ctx.fillRect(x + dx - 2, y + dy + flicker - 5, 4, 10);
    });
    ctx.globalAlpha = 1; ctx.fillStyle = "#ffd25d"; ctx.fillRect(x - 7, y - 38, 14, 8); ctx.fillStyle = "#f7f2df"; ctx.fillRect(x - 3, y - 36, 6, 4);
  }
  if (cosmetic && cosmetic !== "constellation-halo" && cosmeticLevel >= 3) {
    // Animated tier adds two segmented orbits and comet trails around the glow tier.
    ctx.globalAlpha = .9; ctx.strokeStyle = "#ffd25d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 49, 101, 42, orbit * .12, 0, Math.PI * 2); ctx.stroke();
    for (let index = 0; index < 3; index++) {
      const angle = orbit + index * Math.PI * 2 / 3;
      const px = x + Math.cos(angle) * 101, py = y - 49 + Math.sin(angle) * 42;
      ctx.fillStyle = index % 2 ? "#5de8ff" : "#ffd25d"; ctx.fillRect(Math.round(px - 7), Math.round(py - 7), 14, 14);
      ctx.globalAlpha = .38; ctx.fillRect(Math.round(px - Math.cos(angle) * 24 - 5), Math.round(py - Math.sin(angle) * 12 - 3), 10, 6); ctx.globalAlpha = .9;
    }
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 49, 76, 91, -orbit * .09, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawUfo(ctx: CanvasRenderingContext2D, x: number, y: number, variant: string, now = 0) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.lineJoin = "miter"; ctx.lineCap = "square";
  const pulse = Math.round((Math.sin(now / 180) + 1) * 2);

  if (variant === "scout-ufo") {
    // Narrow reconnaissance deck with two oversized cyan engine pods.
    ctx.fillStyle = "rgba(93,232,255,.14)"; ctx.fillRect(-126, 37, 48, 12 + pulse); ctx.fillRect(78, 37, 48, 12 + pulse);
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(-103, 17, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(103, 17, 27, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#090a0d"; ctx.fillRect(-112, 3, 18, 28); ctx.fillRect(94, 3, 18, 28);
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(-108, 9, 10, 16); ctx.fillRect(98, 9, 10, 16);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(-88, 6, 176, 28); ctx.fillRect(-70, -8, 140, 14); ctx.fillRect(-54, 34, 108, 10);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(-76, 12, 152, 16); ctx.fillRect(-45, -3, 90, 10);
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 3; ctx.strokeRect(-35, -22, 70, 14);
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(-8, -18, 16, 6);
    ctx.fillRect(-58, -39, 5, 31); ctx.fillRect(53, -39, 5, 31); ctx.fillRect(-64, -43, 17, 7); ctx.fillRect(47, -43, 17, 7);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(-118, 42, 30, 5 + pulse); ctx.fillRect(88, 42, 30, 5 + pulse);
  } else if (variant === "cruiser-ufo") {
    // Long retro flagship with gold stepped wings and asymmetric antennae.
    ctx.fillStyle = "rgba(255,210,93,.12)";
    ctx.beginPath(); ctx.moveTo(-145, 31); ctx.lineTo(-76, -5); ctx.lineTo(76, -5); ctx.lineTo(145, 31); ctx.lineTo(94, 49); ctx.lineTo(-94, 49); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ffd25d"; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(-118, 10, 236, 28); ctx.fillRect(-83, -9, 166, 22); ctx.fillRect(-54, 38, 108, 12);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(-103, 17, 206, 14); ctx.fillRect(-62, -3, 124, 12);
    ctx.fillStyle = "#ffd25d"; for (let px = -90; px <= 90; px += 30) ctx.fillRect(px, 20, 12, 7);
    ctx.strokeStyle = "#ffd25d"; ctx.lineWidth = 4; ctx.strokeRect(-39, -25, 78, 17);
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(-8, -21, 16, 8);
    ctx.fillRect(-91, -46, 6, 37); ctx.fillRect(86, -36, 6, 27); ctx.fillRect(-97, -51, 18, 8); ctx.fillRect(80, -41, 18, 8);
    ctx.fillStyle = "#ff9f43"; ctx.fillRect(-78, 50, 25, 8 + pulse); ctx.fillRect(53, 50, 25, 8 + pulse); ctx.fillStyle = "#ffd25d"; ctx.fillRect(-72, 50, 13, 14 + pulse); ctx.fillRect(59, 50, 13, 14 + pulse);
  } else if (variant === "bio-ufo") {
    // Organic vessel with a blinking eye, luminous nodes and living tendrils.
    ctx.fillStyle = "rgba(184,255,88,.12)"; ctx.beginPath(); ctx.ellipse(0, 17, 122 + pulse, 39, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#b8ff58"; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 13, 117, 36, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(-86, -1, 172, 33); ctx.fillRect(-54, -17, 108, 19);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(-74, 7, 148, 20); ctx.fillRect(-39, -11, 78, 13);
    ctx.strokeStyle = "#b8ff58"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 10, 24 + pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(-13, -3, 26, 26); ctx.fillStyle = "#090a0d"; ctx.fillRect(-6 + pulse, 3, 12, 14); ctx.fillStyle = "#f7f2df"; ctx.fillRect(-2 + pulse, 5, 4, 5);
    ctx.fillStyle = "#b8ff58"; [-92,-61,61,92].forEach((px, index) => ctx.fillRect(px, 10 + index % 2 * 7, 10, 10));
    const tentacle = (px: number, direction: number) => {
      ctx.fillStyle = "#f7f2df"; ctx.fillRect(px, 38, 9, 17); ctx.fillRect(px + direction * 7, 51, 9, 17 + pulse); ctx.fillRect(px, 64 + pulse, 9, 13);
      ctx.fillStyle = "#b8ff58"; ctx.fillRect(px + 2, 40, 5, 13); ctx.fillRect(px + direction * 7 + 2, 53, 5, 13 + pulse);
    };
    tentacle(-83, -1); tentacle(-31, 1); tentacle(22, -1); tentacle(74, 1);
  } else {
    // Friendly starter saucer: simple, readable and deliberately cheerful.
    ctx.fillStyle = "#090a0d"; ctx.strokeStyle = "#f7f2df"; ctx.lineWidth = 4;
    ctx.fillRect(-86, -10, 172, 42); ctx.strokeRect(-86, -10, 172, 42);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(-110, 2, 24, 17); ctx.fillRect(86, 2, 24, 17); ctx.fillRect(-72, 32, 144, 12); ctx.fillRect(-45, 44, 90, 8);
    ctx.fillStyle = "#090a0d"; ctx.fillRect(-61, 35, 122, 6);
    ctx.strokeStyle = "#b8ff58"; ctx.lineWidth = 3; ctx.strokeRect(-32, -22, 64, 12);
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(-8, -19, 16, 6);
    [-48,-16,16,48].forEach((px, index) => ctx.fillRect(px, 16, 10, 6 + ((index + pulse) % 2) * 2));
    ctx.fillStyle = "#b8ff58"; ctx.fillRect(-33, 52, 18, 4 + pulse); ctx.fillRect(15, 52, 18, 4 + pulse);
  }
  ctx.restore();
}

function drawUfoArtwork(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, variant: string) {
  if (!image?.complete || !image.naturalWidth) { drawUfo(ctx, x, y, variant); return; }
  const variants = ["starter-ufo", "scout-ufo", "cruiser-ufo", "bio-ufo"];
  const index = Math.max(0, variants.indexOf(variant));
  const sourceWidth = image.naturalWidth / 4;
  const widths = [220, 250, 285, 260];
  const width = widths[index], sourceY = 150, sourceHeight = 460;
  const height = width * sourceHeight / sourceWidth;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = variant === "scout-ufo" ? "#5de8ff" : variant === "cruiser-ufo" ? "#ffd25d" : "#b8ff58";
  ctx.shadowBlur = 9;
  ctx.drawImage(image, index * sourceWidth, sourceY, sourceWidth, sourceHeight, Math.round(x - width / 2), Math.round(y - 80), width, height);
  ctx.restore();
}

function drawCosmeticArtwork(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement | null, x: number, y: number, variant: string) {
  if (!source || !variant) return;
  const variants = ["space-fisher", "astro-suit", "cosmic-aura", "royal-set"];
  const index = variants.indexOf(variant); if (index < 0) return;
  const sourceWidth = source.width / 4;
  const widths = [170, 165, 190, 180], heights = [150, 170, 170, 175];
  const width = widths[index], height = heights[index];
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, index * sourceWidth, 80, sourceWidth, 560, Math.round(x - width / 2), Math.round(y - 122), width, height);
  ctx.restore();
}

function drawPool(ctx: CanvasRenderingContext2D, now: number, reducedMotion: boolean, variant: string, level = 1, bossEncounter = false) {
  const cx = 480, cy = 492;
  const rotation = reducedMotion ? 0 : now / 24_000;
  const evolved = level >= 5;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, 340, 82, 0, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#03080b"; ctx.fillRect(130, 405, 700, 175);

  // Two dense, granular arms form a slow-turning turquoise whirlpool.
  const dust = variant === "crimson-pool" ? ["#fff1e8", "#ff9a7a", "#ff496f", "#a7194b", "#56112d"]
    : variant === "crystal-pool" ? ["#fff4ff", "#d8a0ff", "#bd7cff", "#713bb5", "#321d67"]
    : variant === "ancient-pool" ? ["#fff9df", "#ffe18a", "#ffd25d", "#a87520", "#51330d"]
    : variant === "mint-pool" ? ["#f2ffff", "#b8ffff", "#5de8ff", "#2d9fb9", "#185668"]
    : ["#eafff5", "#8fffdc", "#36d7b3", "#159b86", "#0c594f"];
  for (let arm = 0; arm < 2; arm++) {
    for (let step = 0; step < 170; step++) {
      const baseRadius = 28 + step * 1.88;
      const baseAngle = rotation + arm * Math.PI + step * .055;
      for (let layer = -4; layer <= 4; layer++) {
        const grain = Math.sin(step * 12.9898 + layer * 31.73 + arm * 71.2);
        const distance = baseRadius + layer * (2.6 + step / 120) + grain * 4;
        const angle = baseAngle + grain * .025;
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance * .235;
        const sparkle = (step * 3 + layer * 5 + arm * 11 + Math.floor(now / 900)) % 29 === 0;
        const size = sparkle ? 5 : (step + layer) % 5 === 0 ? 3 : 2;
        ctx.fillStyle = dust[Math.abs(step + layer * 2 + arm) % dust.length];
        ctx.globalAlpha = .34 + (1 - step / 210) * .58;
        ctx.fillRect(Math.round(x), Math.round(y), size, size);
      }
    }
  }

  if (evolved) {
    // Mastery evolution adds a brighter third signal lane without changing the pool silhouette.
    for (let step = 0; step < 120; step++) {
      const angle = -rotation * .65 + step * .092;
      const radius = 34 + step * 2.35;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * .235;
      ctx.fillStyle = step % 7 === 0 ? dust[0] : dust[1];
      ctx.globalAlpha = .35 + Math.sin(step * 1.7) * .12;
      ctx.fillRect(Math.round(x), Math.round(y), step % 9 === 0 ? 5 : 3, step % 9 === 0 ? 5 : 3);
    }
  }

  // Faint outer dust lanes keep the silhouette close to a spiral galaxy.
  for (let index = 0; index < 150; index++) {
    const angle = rotation * .7 + index * .31;
    const radius = 175 + (index * 47 % 160);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * .235;
    ctx.fillStyle = index % 9 === 0 ? "#f7f2df" : dust[3];
    ctx.globalAlpha = index % 9 === 0 ? .8 : .28;
    ctx.fillRect(Math.round(x), Math.round(y), index % 13 === 0 ? 4 : 2, index % 13 === 0 ? 4 : 2);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#010203"; ctx.beginPath(); ctx.ellipse(cx, cy, 69, 17, 0, 0, Math.PI * 2); ctx.fill();
  for (let index = 0; index < 72; index++) {
    const angle = index / 72 * Math.PI * 2 + rotation * .35;
    const brightSide = Math.cos(angle - Math.PI * .85) * .5 + .5;
    ctx.fillStyle = brightSide > .62 ? dust[0] : brightSide > .25 ? dust[2] : dust[4];
    ctx.fillRect(Math.round(cx + Math.cos(angle) * 75), Math.round(cy + Math.sin(angle) * 19), brightSide > .7 ? 4 : 2, 2);
  }

  const flares = [[204,452],[735,470],[296,520],[662,432],[786,507]];
  ctx.fillStyle = "#f7f2df";
  flares.forEach(([x, y], index) => {
    const glow = reducedMotion ? 0 : (Math.floor(now / 520) + index) % 3;
    ctx.fillRect(x - 1, y - 5 - glow, 2, 11 + glow * 2); ctx.fillRect(x - 5 - glow, y - 1, 11 + glow * 2, 2);
  });
  if (variant === "crimson-pool") {
    const burst = reducedMotion ? 0 : Math.round(Math.sin(now / 420) * 7);
    ctx.fillStyle = "#ff496f"; ctx.fillRect(cx - 7, cy - 67 - burst, 14, 57 + burst); ctx.fillRect(cx - 20, cy - 47, 8, 33); ctx.fillRect(cx + 12, cy - 39, 8, 25);
    ctx.fillStyle = "#fff1e8"; ctx.fillRect(cx - 3, cy - 78 - burst, 6, 69 + burst);
  } else if (variant === "crystal-pool") {
    [[cx,cy-57,18,52],[cx-116,cy-24,13,37],[cx+108,cy-19,13,34],[cx-56,cy+4,10,27]].forEach(([x,y,w,h]) => {
      ctx.fillStyle = "#bd7cff"; ctx.fillRect(x - w / 2, y, w, h); ctx.fillStyle = "#fff4ff"; ctx.fillRect(x - 2, y - 9, 4, h + 9);
    });
  } else if (variant === "ancient-pool") {
    ctx.fillStyle = "#010203"; ctx.beginPath(); ctx.ellipse(cx, cy, 94, 29, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffd25d"; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, cy, 112, 32, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(cx - 178, cy - 28, 18, 14); ctx.fillRect(cx + 150, cy + 16, 22, 16); ctx.fillRect(cx + 96, cy - 47, 12, 10);
  } else {
    ctx.fillStyle = "#8fffdc"; ctx.fillRect(cx - 145, cy - 54, 8, 8); ctx.fillRect(cx + 132, cy - 39, 8, 8); ctx.fillRect(cx + 188, cy + 22, 6, 6);
  }
  if (level >= 30) {
    const pulse = reducedMotion ? 0 : Math.sin(now / 310) * (bossEncounter ? 10 : 6);
    const portalRotation = reducedMotion ? 0 : now / (bossEncounter ? 1_350 : 2_400);

    // Deep layered event horizon: all drama stays inside the pool ellipse.
    ctx.globalAlpha = .72; ctx.fillStyle = "#bd7cff"; ctx.beginPath(); ctx.ellipse(cx, cy, 129 + pulse, 35 + pulse * .2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = "#010104"; ctx.beginPath(); ctx.ellipse(cx, cy, 111, 28, 0, 0, Math.PI * 2); ctx.fill();
    [[149,41,10,"#ff6fae"],[177,49,5,"#5de8ff"],[210,59,3,"#ffd25d"]].forEach(([radius,height,width,color], ring) => {
      ctx.globalAlpha = ring === 0 ? .95 : .8; ctx.strokeStyle = color as string; ctx.lineWidth = width as number;
      ctx.beginPath(); ctx.ellipse(cx, cy, (radius as number) + (ring % 2 ? -pulse : pulse), (height as number) + pulse * .15, 0, 0, Math.PI * 2); ctx.stroke();
    });

    // Dense particle trails spiral inward and accelerate near the black-hole centre.
    for (let index = 0; index < 64; index++) {
      const travel = reducedMotion ? .55 : ((now / (bossEncounter ? 680 : 1_100) + index * .071) % 1);
      const radius = 290 - travel * 185;
      const angle = index * 2.399 + portalRotation + travel * 3.2;
      const rx = cx + Math.cos(angle) * radius;
      const ry = cy + Math.sin(angle) * radius * .235;
      const size = travel > .72 ? 6 : index % 4 === 0 ? 4 : 2;
      ctx.globalAlpha = .34 + travel * .66;
      ctx.fillStyle = index % 5 === 0 ? "#ffd25d" : index % 2 ? "#ff6fae" : "#5de8ff";
      ctx.fillRect(Math.round(rx - size / 2), Math.round(ry - size / 2), size + (bossEncounter ? 2 : 0), size);
    }

    // Pixel teeth around the horizon make the pull direction readable in motion.
    for (let index = 0; index < 28; index++) {
      const angle = index / 28 * Math.PI * 2 - portalRotation * 1.4;
      const rx = cx + Math.cos(angle) * 124, ry = cy + Math.sin(angle) * 31;
      ctx.globalAlpha = 1; ctx.fillStyle = index % 3 === 0 ? "#ffd25d" : index % 2 ? "#ff6fae" : "#5de8ff";
      ctx.fillRect(Math.round(rx - 3), Math.round(ry - 3), index % 3 === 0 ? 8 : 5, index % 3 === 0 ? 6 : 4);
    }

    // Ancient runes and shockwave nodes orbit only along the outer rim of the pool.
    for (let index = 0; index < 16; index++) {
      const angle = index / 16 * Math.PI * 2 + portalRotation * .55;
      const rx = cx + Math.cos(angle) * 246, ry = cy + Math.sin(angle) * 67;
      ctx.globalAlpha = .95; ctx.fillStyle = "#ffd25d"; ctx.fillRect(Math.round(rx - 6), Math.round(ry - 7), 12, 14);
      ctx.fillStyle = "#090a0d"; ctx.fillRect(Math.round(rx - 2), Math.round(ry - 4), 4, 9);
      if (index % 2 === 0) ctx.fillRect(Math.round(rx - 5), Math.round(ry - 1), 10, 3);
    }

    if (bossEncounter) {
      for (let index = 0; index < 8; index++) {
        const x = cx - 252 + index * 72;
        const height = 16 + (index % 3) * 10 + Math.abs(pulse);
        ctx.globalAlpha = .82; ctx.fillStyle = index % 2 ? "#ff6fae" : "#5de8ff";
        ctx.fillRect(Math.round(x), Math.round(cy - height / 2), 6, Math.round(height));
        ctx.fillStyle = "#f7f2df"; ctx.fillRect(Math.round(x - 4), Math.round(cy - 2), 14, 4);
      }
    }
  }
  ctx.restore();
  ctx.strokeStyle = dust[2]; ctx.globalAlpha = .48; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 340, 82, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
}

function drawMasteryUfoAura(ctx: CanvasRenderingContext2D, x: number, y: number, now: number, reducedMotion: boolean, pool: string) {
  const colors = poolColors[pool] || poolColors["genesis-pool"];
  const rotation = reducedMotion ? 0 : now / 1_700;
  const pulse = reducedMotion ? 0 : Math.sin(now / 230) * 5;
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = colors.bright; ctx.lineWidth = 4; ctx.globalAlpha = .85;
  ctx.beginPath(); ctx.ellipse(0, 5, 148 + pulse, 43, rotation, 0, Math.PI * 2); ctx.stroke();
  for (let index = 0; index < 4; index++) {
    const angle = rotation + index * Math.PI / 2;
    const px = Math.cos(angle) * 148, py = Math.sin(angle) * 43;
    ctx.fillStyle = index % 2 ? colors.boss : colors.mid; ctx.fillRect(Math.round(px - 6), Math.round(py - 6), 12, 12);
    ctx.fillStyle = "#f7f2df"; ctx.fillRect(Math.round(px - 2), Math.round(py - 2), 4, 4);
  }
  ctx.globalAlpha = .7; ctx.fillStyle = colors.boss;
  ctx.fillRect(-74, 45, 15, 30 + pulse); ctx.fillRect(59, 45, 15, 30 + pulse);
  ctx.fillStyle = colors.bright; ctx.fillRect(-69, 45, 5, 39 + pulse); ctx.fillRect(64, 45, 5, 39 + pulse);
  ctx.restore();
}

function drawMasterySignals(ctx: CanvasRenderingContext2D, now: number, reducedMotion: boolean, pool: string, level: number) {
  const colors = poolColors[pool] || poolColors["genesis-pool"];
  if (level >= 10) {
    const drift = reducedMotion ? 0 : now / 900;
    ctx.save();
    for (let index = 0; index < 14; index++) {
      const angle = drift + index * 1.73;
      const radius = 105 + index * 13;
      const x = 480 + Math.cos(angle) * radius;
      const y = 423 + Math.sin(angle * 1.3) * 54;
      ctx.fillStyle = index % 2 ? "#bd7cff" : colors.boss;
      ctx.fillRect(Math.round(x), Math.round(y), index % 3 === 0 ? 5 : 3, index % 3 === 0 ? 5 : 3);
    }
    ctx.restore();
  }
}

function drawPoolArtwork(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement | null, now: number, reducedMotion: boolean, variant: string) {
  if (!source) { drawPool(ctx, now, reducedMotion, variant); return; }
  const variants = ["genesis-pool", "crimson-pool", "crystal-pool", "ancient-pool"];
  const index = Math.max(0, variants.indexOf(variant));
  const sourceWidth = source.width / 4;
  const pulse = reducedMotion ? 0 : Math.sin(now / 1_400) * 5;
  const width = 690 + pulse, height = 190 + pulse * .3;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = .96;
  ctx.drawImage(source, index * sourceWidth, 105, sourceWidth, 500, Math.round(480 - width / 2), Math.round(398 - height / 2 + 94), width, height);
  ctx.restore();
}

function drawAlien(ctx: CanvasRenderingContext2D, x: number, y: number, kind: number, scale = 5, variantIndex = 0) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const variant = alienVariants[variantIndex] || alienVariants[0];
  if (variant.id === "baby") ctx.scale(.72, .72);
  const mainColor = variant.id === "shiny" ? "#fff1a8" : variant.id === "glitched" ? "#5de8ff" : variant.id === "cosmic" ? "#d8a0ff" : "#f7f2df";
  const accent = variant.id === "shiny" ? "#ffd25d" : variant.id === "glitched" ? "#ff6fae" : variant.id === "baby" ? "#b8ff58" : variant.id === "cosmic" ? "#5de8ff" : variant.id === "seasonal" ? "#ff6fae" : aliens[kind].accent;
  const pixel = (rects: number[][], color = mainColor) => {
    ctx.fillStyle = color;
    rects.forEach(([px, py, width, height]) => ctx.fillRect(px * scale, py * scale, width * scale, height * scale));
  };
  if (variant.id === "cosmic") {
    ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = Math.max(1, scale / 2); ctx.beginPath(); ctx.ellipse(0, -scale, 10 * scale, 4 * scale, -.2, 0, Math.PI * 2); ctx.stroke();
    pixel([[-11,-7,1,1],[9,-9,1,1],[-10,5,1,1],[10,4,1,1]], "#bd7cff");
  } else if (variant.id === "glitched") {
    pixel([[-10,-6,3,1],[8,-2,4,1],[-9,4,4,1],[7,6,3,1]], "#ff6fae");
    pixel([[-8,-8,2,1],[9,1,2,1],[-11,1,2,1]], "#5de8ff");
  } else if (variant.id === "shiny") {
    pixel([[-10,-8,1,3],[-11,-7,3,1],[9,-5,1,3],[8,-4,3,1]], "#ffd25d");
  } else if (variant.id === "seasonal") {
    pixel([[-11,-7,1,1],[10,-6,1,1],[-9,5,1,1],[9,4,1,1]], "#5de8ff");
  }
  if (kind === 0) {
    pixel([[-4,-7,8,1],[-5,-6,10,6],[-6,-4,12,5],[-4,1,3,3],[1,1,3,3],[-7,-3,2,4],[5,-3,2,4],[-3,-8,1,1],[2,-8,1,1]]);
    pixel([[-3,-4,6,3]], "#090a0d"); pixel([[-2,-4,4,2]], accent); pixel([[-1,-4,2,2]], "#090a0d");
  } else if (kind === 1) {
    pixel([[-5,-5,10,1],[-6,-4,12,5],[-5,1,10,2],[-5,3,2,4],[-1,3,2,5],[3,3,2,4]]);
    pixel([[-4,-2,2,2],[2,-2,2,2]], accent); pixel([[-3,1,6,1]], "#090a0d");
  } else if (kind === 2) {
    pixel([[-5,-4,10,7],[-8,-5,3,2],[5,-5,3,2],[-9,-7,3,2],[6,-7,3,2],[-7,3,3,2],[4,3,3,2]]);
    pixel([[-3,-2,2,2],[1,-2,2,2]], accent); pixel([[-1,1,2,1]], "#090a0d");
  } else if (kind === 3) {
    pixel([[-7,-3,11,6],[4,-2,4,4],[-10,-1,3,2],[-5,3,2,2],[1,3,2,2]]);
    pixel([[-4,-1,2,2]], accent); pixel([[3,-2,1,4]], "#090a0d");
    pixel([[-12,-1,1,1],[-14,1,1,1],[-16,-2,1,1]], accent);
  } else {
    pixel([[-6,-6,12,12],[-8,-3,2,6],[6,-3,2,6],[-4,6,2,3],[2,6,2,3],[-2,-9,4,3]]);
    pixel([[-4,-3,8,6]], "#090a0d"); pixel([[-3,-2,6,4]], accent); pixel([[-1,-1,2,2]], "#f7f2df");
  }
  if (variant.id === "baby") {
    pixel([[-2,2,4,2]], "#ff6fae"); pixel([[-1,3,2,1]], "#f7f2df");
  } else if (variant.id === "glitched") {
    ctx.globalAlpha = .75; pixel([[-7,-3,5,1],[2,0,7,1],[-5,4,4,1]], "#ff6fae"); ctx.globalAlpha = 1;
  } else if (variant.id === "seasonal") {
    pixel([[-5,-10,8,2],[-4,-12,6,2],[1,-14,2,2]], "#ff6fae"); pixel([[1,-14,2,2]], "#f7f2df");
  }
  ctx.restore();
}

function drawAlienArtwork(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement | null, x: number, y: number, kind: number, scale = 5) {
  if (!source) { drawAlien(ctx, x, y, kind, scale); return; }
  const crops = [
    { x: 20, y: 230, width: 330, height: 340 },
    { x: 350, y: 145, width: 340, height: 445 },
    { x: 675, y: 140, width: 500, height: 455 },
    { x: 1170, y: 175, width: 450, height: 390 },
    { x: 1620, y: 125, width: 475, height: 475 },
  ];
  const crop = crops[kind];
  const maxWidth = scale === 6 ? 165 : scale === 4 ? 112 : 46;
  const maxHeight = scale === 6 ? 132 : scale === 4 ? 92 : 42;
  const ratio = Math.min(maxWidth / crop.width, maxHeight / crop.height);
  const width = crop.width * ratio, height = crop.height * ratio;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = aliens[kind].accent; ctx.shadowBlur = scale >= 4 ? 10 : 3;
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, Math.round(x - width / 2), Math.round(y - height / 2), width, height);
  ctx.restore();
}

function AlienModel({ index, variant = 0 }: { index: number; variant?: number }) {
  const model = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = model.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48); ctx.imageSmoothingEnabled = false;
    drawAlien(ctx, 24, 31, index, 2, variant);
  }, [index, variant]);
  return <canvas ref={model} className="alien-model" width="48" height="48" aria-hidden="true" />;
}

function ShopModel({ item }: { item: StoreItem }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const row = item.category === "baits" ? 0 : item.category === "cosmetics" ? 1 : item.category === "ufos" ? 2 : 3;
  const column = storeItems.filter(entry => entry.category === item.category).findIndex(entry => entry.id === item.id);
  useEffect(() => {
    const target = canvas.current;
    const ctx = target?.getContext("2d");
    if (!target || !ctx) return;
    const accessoryIds = ["star-sprout", "orbit-headphones", "nebula-wings", "comet-buddy"];
    if (accessoryIds.includes(item.id)) {
      ctx.clearRect(0, 0, target.width, target.height); ctx.fillStyle = "#050608"; ctx.fillRect(0, 0, target.width, target.height);
      ctx.imageSmoothingEnabled = false; ctx.lineCap = "square"; ctx.lineJoin = "miter";
      if (item.id === "star-sprout") {
        ctx.fillStyle = "#090a0d"; ctx.fillRect(67, 34, 10, 44); ctx.fillRect(50, 13, 44, 34); ctx.fillRect(42, 24, 60, 13);
        ctx.fillStyle = "#b8ff58"; ctx.fillRect(70, 38, 4, 38); ctx.fillStyle = "#ffd25d"; ctx.fillRect(57, 19, 30, 22); ctx.fillRect(49, 27, 46, 8);
        ctx.fillStyle = "#f7f2df"; ctx.fillRect(69, 27, 6, 6);
      } else if (item.id === "orbit-headphones") {
        ctx.strokeStyle = "#5de8ff"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(72, 49, 31, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        ctx.fillStyle = "#090a0d"; ctx.fillRect(30, 42, 23, 40); ctx.fillRect(91, 42, 23, 40);
        ctx.fillStyle = "#5de8ff"; ctx.fillRect(35, 47, 13, 30); ctx.fillRect(96, 47, 13, 30);
        ctx.fillStyle = "#ffd25d"; ctx.fillRect(40, 55, 5, 16); ctx.fillRect(100, 51, 5, 23);
        ctx.fillStyle = "#bd7cff"; ctx.fillRect(65, 22, 5, 15); ctx.fillRect(75, 16, 5, 21);
      } else if (item.id === "nebula-wings") {
        ctx.fillStyle = "#090a0d"; ctx.fillRect(17, 25, 48, 22); ctx.fillRect(7, 46, 54, 18); ctx.fillRect(79, 25, 48, 22); ctx.fillRect(83, 46, 54, 18);
        ctx.fillStyle = "#bd7cff"; ctx.fillRect(22, 30, 39, 12); ctx.fillRect(13, 50, 40, 9); ctx.fillRect(83, 30, 39, 12); ctx.fillRect(91, 50, 40, 9);
        ctx.fillStyle = "#5de8ff"; ctx.fillRect(31, 34, 22, 5); ctx.fillRect(19, 53, 25, 4); ctx.fillRect(91, 34, 22, 5); ctx.fillRect(100, 53, 25, 4);
        ctx.fillStyle = "#f7f2df"; ctx.fillRect(69, 39, 6, 23);
      } else {
        ctx.globalAlpha = .35; ctx.fillStyle = "#5de8ff"; ctx.fillRect(18, 42, 48, 14); ctx.fillRect(7, 46, 24, 7); ctx.globalAlpha = 1;
        ctx.fillStyle = "#090a0d"; ctx.fillRect(61, 24, 44, 44); ctx.fillRect(51, 34, 64, 24);
        ctx.fillStyle = "#ffd25d"; ctx.fillRect(68, 30, 30, 32); ctx.fillRect(58, 40, 50, 13);
        ctx.fillStyle = "#090a0d"; ctx.fillRect(75, 42, 5, 5); ctx.fillRect(88, 42, 5, 5); ctx.fillRect(79, 52, 10, 4);
        ctx.fillStyle = "#f7f2df"; ctx.fillRect(81, 17, 5, 11);
      }
      return;
    }
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled) return;
      const cellWidth = image.naturalWidth / 4;
      const cellHeight = image.naturalHeight / 4;
      const crop = item.category === "pools"
        ? { insetX: 60, insetTop: 22, insetBottom: 48 }
        : item.category === "ufos"
          ? { insetX: 52, insetTop: 42, insetBottom: 14 }
        : item.category === "baits"
            ? { insetX: 54, insetTop: 68, insetBottom: 6 }
            : { insetX: 54, insetTop: 55, insetBottom: 8 };
      const sourceX = column * cellWidth + crop.insetX;
      const sourceY = row * cellHeight + crop.insetTop;
      const sourceWidth = cellWidth - crop.insetX * 2;
      const sourceHeight = cellHeight - crop.insetTop - crop.insetBottom;
      const scale = Math.min(target.width / sourceWidth, target.height / sourceHeight);
      const width = Math.round(sourceWidth * scale);
      const height = Math.round(sourceHeight * scale);
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, target.width, target.height);
      ctx.imageSmoothingEnabled = false;
      ctx.filter = item.id === "scout-ufo" ? "hue-rotate(82deg) saturate(1.25)"
        : item.id === "cruiser-ufo" ? "hue-rotate(-52deg) saturate(1.2)"
        : "none";
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, Math.round((target.width - width) / 2), Math.round((target.height - height) / 2), width, height);
      ctx.filter = "none";
    };
    image.src = economyConcepts;
    return () => { cancelled = true; };
  }, [column, item.accent, item.category, item.id, row]);
  return <canvas ref={canvas} className={`shop-model concept-sprite ${item.category}`} width="144" height="96" aria-hidden="true" />;
}

function ShopPanel({ economy, setEconomy, close }: { economy: DemoEconomy; setEconomy: React.Dispatch<React.SetStateAction<DemoEconomy>>; close: () => void }) {
  const [category, setCategory] = useState<StoreCategory>("baits");
  const [workshopStatus, setWorkshopStatus] = useState("");
  const pool = storeItems.find(item => item.id === economy.equipped.pool)!;
  const poolExperience = economy.poolXp[economy.equipped.pool] || 0;
  const poolLevel = masteryLevel(poolExperience);
  const levelProgress = poolLevel === 30 ? 100 : poolExperience % 100;
  const signalTarget = nextSignalTarget(economy.signal);
  const signalProgress = Math.min(100, economy.signal / signalTarget * 100);
  const poolQuest = economy.poolQuests[economy.equipped.pool];
  const poolOutfit = `pool-outfit-${economy.equipped.pool}`;
  const previewLevel = (level: number) => setEconomy(current => ({ ...current, poolXp: { ...current.poolXp, [current.equipped.pool]: (level - 1) * 100 } }));
  const claimDaily = () => setEconomy(current => current.dailyClaimed ? current : ({
    ...current,
    dailyClaimed: true,
    baitStock: { ...current.baitStock, "basic-bait": (current.baitStock["basic-bait"] || 0) + 3 },
  }));
  const buy = (item: StoreItem) => setEconomy(current => {
    if (current.balance < item.price || (item.category !== "baits" && current.owned.includes(item.id))) return current;
    if (item.category === "baits") {
      const target = item.id === "signal-pack" ? "basic-bait" : item.id;
      return { ...current, balance: current.balance - item.price, baitStock: { ...current.baitStock, [target]: (current.baitStock[target] || 0) + (item.amount || 1) } };
    }
    return { ...current, balance: current.balance - item.price, owned: [...current.owned, item.id] };
  });
  const equip = (item: StoreItem) => setEconomy(current => {
    const slot = item.category === "ufos" ? "ufo" : item.category === "pools" ? "pool" : item.category === "cosmetics" ? "cosmetic" : "bait";
    const target = item.id === "signal-pack" ? "basic-bait" : item.id;
    return { ...current, equipped: { ...current.equipped, [slot]: target } };
  });
  const craftBait = (id: "basic-bait" | "shimmer-bait", cost: number, amount: number) => {
    if (economy.stardust < cost) return;
    setWorkshopStatus(`CRAFTED ${amount} ${id.replaceAll("-", " ").toUpperCase()}`);
    setEconomy(current => ({ ...current, stardust: current.stardust - cost, baitStock: { ...current.baitStock, [id]: (current.baitStock[id] || 0) + amount } }));
  };
  const craftScanner = () => {
    if (economy.stardust < 120) return;
    setWorkshopStatus("VARIANT SCANNER ARMED");
    setEconomy(current => ({ ...current, stardust: current.stardust - 120, variantScanners: current.variantScanners + 1 }));
  };
  const rerollDaily = () => {
    if (economy.stardust < 25 || economy.dailyRerolled || economy.dailyContractClaimed) return;
    setWorkshopStatus("DAILY CONTRACTS REROLLED");
    setEconomy(current => ({ ...current, stardust: current.stardust - 25, dailyRerolled: true, dailyContractOffset: current.dailyContractOffset + 1 }));
  };
  const openCosmeticChest = () => {
    if (economy.stardust < 250 || economy.fragments < 3) return;
    const roll = Math.random();
    const unownedCosmetics = storeItems.filter(item => item.category === "cosmetics" && !economy.owned.includes(item.id));
    if (roll < .3) {
      if (unownedCosmetics.length) {
        const reward = unownedCosmetics[Math.floor(Math.random() * unownedCosmetics.length)].id;
        setWorkshopStatus(`SURPRISE COSMETIC · ${reward.replaceAll("-", " ").toUpperCase()} UNLOCKED`);
        setEconomy(current => ({ ...current, stardust: current.stardust - 250, fragments: current.fragments - 3, owned: [...current.owned, reward] }));
      } else {
        setWorkshopStatus("COSMETIC COLLECTION COMPLETE · +5 FRAGMENTS");
        setEconomy(current => ({ ...current, stardust: current.stardust - 250, fragments: current.fragments + 2 }));
      }
      return;
    }
    const bait = roll < .65 ? { id: "basic-bait", amount: 5, label: "+5 BASIC BAIT" }
      : roll < .9 ? { id: "shimmer-bait", amount: 2, label: "+2 SHIMMER BAIT" }
        : { id: "discovery-bait", amount: 1, label: "+1 DISCOVERY BAIT" };
    setWorkshopStatus(`SURPRISE BAIT · ${bait.label}`);
    setEconomy(current => ({ ...current, stardust: current.stardust - 250, fragments: current.fragments - 3, baitStock: { ...current.baitStock, [bait.id]: (current.baitStock[bait.id] || 0) + bait.amount } }));
  };
  const cosmeticStages = ["BASE", "RECOLOR", "GLOW", "ANIMATED"] as const;
  const upgradeDust = [300, 500, 750] as const;
  const upgradeFragments = [2, 4, 5] as const;
  const equippedCosmeticLevel = economy.cosmeticUpgrades[economy.equipped.cosmetic] || 0;
  const upgradeCosmetic = () => {
    const cosmetic = economy.equipped.cosmetic;
    if (!cosmetic || equippedCosmeticLevel >= 3) return;
    const dust = upgradeDust[equippedCosmeticLevel], fragments = upgradeFragments[equippedCosmeticLevel];
    if (economy.stardust < dust || economy.fragments < fragments) return;
    const nextLevel = equippedCosmeticLevel + 1;
    setWorkshopStatus(`${cosmeticStages[nextLevel]} UPGRADE APPLIED`);
    setEconomy(current => ({ ...current, stardust: current.stardust - dust, fragments: current.fragments - fragments, cosmeticUpgrades: { ...current.cosmeticUpgrades, [cosmetic]: nextLevel } }));
  };
  return <section className="shop-shell" aria-label="Rare Friends market">
    <div className="shop-head"><div><small>LOCAL ECONOMY DEMO</small><h2>STAR MARKET</h2></div><button type="button" onClick={close}>CLOSE ×</button></div>
    <div className="shop-balance"><span>SIMULATED WALLET</span><strong>◆ {economy.balance.toFixed(1)} RF</strong><b>✦ {economy.stardust} STARDUST · ⬡ {economy.fragments} FRAGMENTS</b><small>No onchain transaction</small></div>
    <div className="economy-loop" aria-label="Economy progression">
      <section className="daily-supply"><small>DAILY SUPPLY</small><strong>FREE SIGNAL DROP</strong><p>Three Basic Baits · resets with this demo session.</p><button type="button" disabled={economy.dailyClaimed} onClick={claimDaily}>{economy.dailyClaimed ? "CLAIMED" : "CLAIM +3 BAIT"}</button></section>
      <section><small>SIGNAL METER</small><strong>{economy.signal} / {signalTarget}</strong><div className="progress-track"><i style={{ width: `${signalProgress}%` }} /></div><p>{economy.signal >= 25 ? "Epic+ discovery protection" : economy.signal >= 10 ? "New-species protection" : `${signalTarget - economy.signal} duplicate signals to protection`}</p></section>
      <section style={{ "--accent": pool.accent } as React.CSSProperties}><small>{pool.name.toUpperCase()} MASTERY</small><strong>LEVEL {poolLevel} / 30</strong><div className="progress-track"><i style={{ width: `${levelProgress}%` }} /></div><p>{Math.floor(poolLevel / 5) * 10}% Stardust boost · next level in {poolLevel === 30 ? 0 : 100 - levelProgress} XP</p></section>
    </div>
    <section className="mastery-roadmap" style={{ "--accent": pool.accent } as React.CSSProperties} aria-label={`${pool.name} mastery milestones`}>
      <div className="mastery-title"><div><small>POOL MASTERY ROADMAP</small><strong>{pool.name.toUpperCase()}</strong></div><span>SESSION DEMO · SELECT A LEVEL TO PREVIEW</span></div>
      <div className="mastery-nodes">
        {[
          { level: 1, label: "BASE" }, { level: 5, label: "EVOLVED" }, { level: 10, label: "COSMIC" },
          { level: 15, label: "UFO AURA" }, { level: 20, label: "OUTFIT" }, { level: 30, label: "QUEST" },
        ].map(node => <button type="button" key={node.level} className={poolLevel >= node.level ? "unlocked" : "locked"} onClick={() => previewLevel(node.level)}><b>LV {node.level}</b><span>{node.label}</span></button>)}
      </div>
      <div className="mastery-detail">
        <span className={poolLevel >= 5 ? "done" : ""}>05 POOL COLOR</span><span className={poolLevel >= 10 ? "done" : ""}>10 COSMIC SIGNAL</span><span className={poolLevel >= 15 ? "done" : ""}>15 UFO FX</span><span className={poolLevel >= 20 ? "done" : ""}>20 COSMETIC</span><span className={poolLevel >= 30 ? "done" : ""}>30 MYTHICAL QUEST</span>
      </div>
      {poolLevel >= 20 && <button type="button" className="mastery-equip" onClick={() => setEconomy(current => ({ ...current, equipped: { ...current.equipped, cosmetic: poolOutfit } }))}>{economy.equipped.cosmetic === poolOutfit ? "POOL OUTFIT EQUIPPED" : "EQUIP POOL OUTFIT"}</button>}
      {poolLevel >= 30 && <div className="mythical-quest"><small>MYTHICAL QUEST</small><strong>{poolQuest.bossCaught ? "BOSS SIGNAL CAPTURED" : questReady(poolQuest) ? "BOSS SIGNAL READY · NEXT CATCH" : "STABILIZE THE BOSS PORTAL"}</strong><p><i className={poolQuest.epic ? "done" : ""}>EPIC+ CATCH</i><i className={poolQuest.variant ? "done" : ""}>NON-DEFAULT VARIANT</i><i className={poolQuest.casts >= 10 ? "done" : ""}>CASTS {poolQuest.casts}/10</i></p></div>}
    </section>
    <nav className="shop-tabs" aria-label="Shop categories">
      {(["baits", "cosmetics", "ufos", "pools", "workshop"] as const).map(value => <button type="button" key={value} className={category === value ? "active" : ""} onClick={() => setCategory(value)}>{value}</button>)}
    </nav>
    {category === "workshop" ? <div className="workshop-grid">
      <div className="workshop-head"><div><small>STARDUST SOFT-CURRENCY SINK</small><strong>ORBITAL WORKSHOP</strong><p>Craft progression tools without spending RF.</p></div><div className="workshop-funds"><span>✦ {economy.stardust} · ⬡ {economy.fragments}</span><button type="button" onClick={() => setEconomy(current => ({ ...current, stardust: current.stardust + 2_500 }))}>DEMO +2500 DUST</button><button type="button" onClick={() => setEconomy(current => ({ ...current, fragments: current.fragments + 20 }))}>DEMO +20 FRAGMENTS</button></div></div>
      <div className="cosmetic-ladder"><span className={equippedCosmeticLevel >= 0 && economy.equipped.cosmetic ? "active" : ""}>BASE</span><span className={equippedCosmeticLevel >= 1 ? "active" : ""}>RECOLOR</span><span className={equippedCosmeticLevel >= 2 ? "active" : ""}>GLOW</span><span className={equippedCosmeticLevel >= 3 ? "active" : ""}>ANIMATED</span></div>
      {[
        { id: "basic", name: "Basic Bait Bundle", cost: 40, note: "+3 Basic Bait", disabled: economy.stardust < 40, action: () => craftBait("basic-bait", 40, 3), icon: "⌁" },
        { id: "shimmer", name: "Shimmer Bait", cost: 75, note: "+1 variant bait", disabled: economy.stardust < 75, action: () => craftBait("shimmer-bait", 75, 1), icon: "✦" },
        { id: "scanner", name: "Variant Scanner", cost: 120, note: `Next catch: 2× non-Default odds · ${economy.variantScanners} stored`, disabled: economy.stardust < 120, action: craftScanner, icon: "◎" },
        { id: "reroll", name: "Contract Reroll", cost: 25, note: economy.dailyRerolled ? "Daily reroll already used" : "Replace today's three contracts", disabled: economy.stardust < 25 || economy.dailyRerolled || economy.dailyContractClaimed, action: rerollDaily, icon: "↻" },
        { id: "chest", name: "Mystery Cosmetic Chest", cost: 250, note: `A surprise cosmetic or bait drop · requires 3 fragments · owned ${economy.fragments}`, disabled: economy.stardust < 250 || economy.fragments < 3, action: openCosmeticChest, icon: "▣" },
      ].map(recipe => <article key={recipe.id} className="workshop-card"><span>{recipe.icon}</span><div><small>RECIPE</small><strong>{recipe.name}</strong><p>{recipe.note}</p></div><button type="button" disabled={recipe.disabled} onClick={recipe.action}>✦ {recipe.cost}</button></article>)}
      <article className="workshop-card upgrade-card"><span>◇</span><div><small>COSMETIC PROGRESSION</small><strong>{!economy.equipped.cosmetic ? "Equip a cosmetic" : equippedCosmeticLevel >= 3 ? "Animated tier complete" : `${cosmeticStages[equippedCosmeticLevel]} → ${cosmeticStages[equippedCosmeticLevel + 1]}`}</strong><p>{!economy.equipped.cosmetic ? "Select an owned cosmetic first" : `Upgrade ${economy.equipped.cosmetic.replaceAll("-", " ")} · each cosmetic keeps its own tier`}</p></div><button type="button" disabled={!economy.equipped.cosmetic || equippedCosmeticLevel >= 3 || economy.stardust < (upgradeDust[equippedCosmeticLevel] || 0) || economy.fragments < (upgradeFragments[equippedCosmeticLevel] || 0)} onClick={upgradeCosmetic}>{equippedCosmeticLevel >= 3 ? "MAX TIER" : `✦ ${upgradeDust[equippedCosmeticLevel] || 0} · ⬡ ${upgradeFragments[equippedCosmeticLevel] || 0}`}</button></article>
      {workshopStatus && <div className="workshop-status" role="status">{workshopStatus}</div>}
    </div> : <div className="shop-grid">
      {storeItems.filter(item => item.category === category).map(item => {
        const owned = item.category === "baits" ? (economy.baitStock[item.id === "signal-pack" ? "basic-bait" : item.id] || 0) : economy.owned.includes(item.id);
        const slot = category === "ufos" ? "ufo" : category === "pools" ? "pool" : category === "cosmetics" ? "cosmetic" : "bait";
        const equipped = economy.equipped[slot] === (item.id === "signal-pack" ? "basic-bait" : item.id);
        return <article className={`shop-card ${equipped ? "equipped" : ""}`} key={item.id} style={{ "--accent": item.accent } as React.CSSProperties}>
          <ShopModel item={item} /><div className="shop-copy"><small>{category === "baits" ? `STOCK ${owned}` : equipped ? `EQUIPPED${item.category === "cosmetics" ? ` · ${cosmeticStages[economy.cosmeticUpgrades[item.id] || 0]}` : ""}` : owned ? `OWNED${item.category === "cosmetics" ? ` · ${cosmeticStages[economy.cosmeticUpgrades[item.id] || 0]}` : ""}` : "LOCKED"}</small><strong>{item.name}</strong><p>{item.description}{item.category === "pools" ? ` · Mastery LV ${masteryLevel(economy.poolXp[item.id] || 0)}` : ""}</p></div>
          {item.category === "baits" ? <div className="shop-actions"><button type="button" disabled={economy.balance < item.price} onClick={() => buy(item)}>◆ {item.price}</button>{item.id !== "signal-pack" && owned > 0 && <button type="button" className="equip" onClick={() => equip(item)}>{equipped ? "ACTIVE" : "USE"}</button>}</div>
            : owned ? <button type="button" className="equip" disabled={equipped} onClick={() => equip(item)}>{equipped ? "EQUIPPED" : "EQUIP"}</button>
              : <button type="button" disabled={economy.balance < item.price} onClick={() => buy(item)}>◆ {item.price} RF</button>}
        </article>;
      })}
    </div>}
    {category === "cosmetics" && <button type="button" className="remove-cosmetic" onClick={() => setEconomy(current => ({ ...current, equipped: { ...current.equipped, cosmetic: "" } }))}>REMOVE COSMETIC</button>}
  </section>;
}

function ContractsPanel({ economy, setEconomy, close }: { economy: DemoEconomy; setEconomy: React.Dispatch<React.SetStateAction<DemoEconomy>>; close: () => void }) {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [mysteryReward, setMysteryReward] = useState("");
  const activeDailyContracts = getDailyContracts(economy.dailyContractOffset);
  const dailyComplete = activeDailyContracts.every(contract => contract.progress(economy) >= contract.target);
  const claimMystery = () => {
    if (!dailyComplete || economy.dailyContractClaimed) return;
    const roll = Math.random();
    setMysteryReward(roll < .45 ? "+3 BASIC BAIT" : roll < .8 ? "+1 COSMETIC FRAGMENT" : "+1.5 RF");
    setEconomy(current => {
      if (current.dailyContractClaimed) return current;
      if (roll < .45) {
        return { ...current, dailyContractClaimed: true, baitStock: { ...current.baitStock, "basic-bait": (current.baitStock["basic-bait"] || 0) + 3 } };
      }
      if (roll < .8) {
        return { ...current, dailyContractClaimed: true, fragments: current.fragments + 1 };
      }
      return { ...current, dailyContractClaimed: true, balance: current.balance + 1.5 };
    });
  };
  const claimWeeklyRow = (row: number) => setEconomy(current => {
    const start = row * 3;
    if (current.weeklyClaims[row] || !current.weeklyProgress.slice(start, start + 3).every(Boolean)) return current;
    const claims = current.weeklyClaims.map((claimed, index) => index === row ? true : claimed);
    if (row === 0) return { ...current, weeklyClaims: claims, baitStock: { ...current.baitStock, "shimmer-bait": (current.baitStock["shimmer-bait"] || 0) + 3 } };
    if (row === 1) return { ...current, weeklyClaims: claims, stardust: current.stardust + 150, fragments: current.fragments + 1 };
    return { ...current, weeklyClaims: claims, balance: current.balance + 2, owned: current.owned.includes("constellation-halo") ? current.owned : [...current.owned, "constellation-halo"] };
  });
  const fillDailyDemo = () => setEconomy(current => ({ ...current, dailyProgress: { catches: 10, baits: ["basic-bait", "shimmer-bait"], rarePlus: 1, stardust: 100, pools: ["genesis-pool", "crimson-pool"] } }));
  const fillWeeklyDemo = () => setEconomy(current => ({ ...current, weeklyProgress: current.weeklyProgress.map(() => true) }));
  return <section className="contracts-shell" aria-label="Contracts board">
    <header><div><small>SESSION RETENTION DEMO</small><h2>CONTRACT BOARD</h2></div><button type="button" onClick={close}>CLOSE ×</button></header>
    <div className="contract-wallet"><span>◆ {economy.balance.toFixed(1)} RF</span><span>✦ {economy.stardust} STARDUST</span><span>⬡ {economy.fragments} FRAGMENTS</span></div>
    <nav><button type="button" className={tab === "daily" ? "active" : ""} onClick={() => setTab("daily")}>DAILY CONTRACTS</button><button type="button" className={tab === "weekly" ? "active" : ""} onClick={() => setTab("weekly")}>WEEKLY CONSTELLATION</button></nav>
    {tab === "daily" ? <div className="daily-contracts">
      <div className="contract-intro"><div><small>TODAY'S SIGNALS</small><strong>COMPLETE ALL THREE</strong><p>Every catch updates these objectives automatically.</p></div><button type="button" onClick={fillDailyDemo}>DEMO FILL</button></div>
      {activeDailyContracts.map((contract, index) => {
        const progress = Math.min(contract.target, contract.progress(economy));
        const complete = progress >= contract.target;
        return <article key={contract.id} className={complete ? "complete" : ""}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{contract.label.toUpperCase()}</strong><div className="contract-progress"><i style={{ width: `${progress / contract.target * 100}%` }} /></div><small>{progress} / {contract.target}</small></div><span>{complete ? "✓" : "○"}</span></article>;
      })}
      <section className={`mystery-signal ${dailyComplete ? "ready" : ""}`}><div><small>ALL-CONTRACT REWARD</small><strong>MYSTERY SIGNAL</strong><p>One random drop: bait, cosmetic fragment, or a small RF reward.</p></div><button type="button" disabled={!dailyComplete || economy.dailyContractClaimed} onClick={claimMystery}>{economy.dailyContractClaimed ? mysteryReward || "CLAIMED" : dailyComplete ? "OPEN SIGNAL" : "LOCKED"}</button></section>
    </div> : <div className="weekly-constellation">
      <div className="contract-intro"><div><small>THIS WEEK'S SKY</small><strong>COMPLETE ALIEN ROWS</strong><p>Each catch fills one matching empty star. Common aliens matter again.</p></div><button type="button" onClick={fillWeeklyDemo}>DEMO FILL</button></div>
      <div className="constellation-board">
        {weeklyBoard.map((alienIndex, index) => <article key={index} className={economy.weeklyProgress[index] ? "filled" : ""}><span>{index + 1}</span><AlienModel index={alienIndex} variant={0} /><strong>{aliens[alienIndex].name}</strong><small>{economy.weeklyProgress[index] ? "CAPTURED" : aliens[alienIndex].rarity.toUpperCase()}</small></article>)}
      </div>
      <div className="weekly-rows">{[0, 1, 2].map(row => {
        const complete = economy.weeklyProgress.slice(row * 3, row * 3 + 3).every(Boolean);
        return <article key={row}><span>ROW {row + 1}</span><strong>{weeklyRewards[row]}</strong><button type="button" disabled={!complete || economy.weeklyClaims[row]} onClick={() => claimWeeklyRow(row)}>{economy.weeklyClaims[row] ? "CLAIMED" : complete ? "CLAIM" : "INCOMPLETE"}</button></article>;
      })}</div>
      {economy.owned.includes("constellation-halo") && <button type="button" className="limited-equip" onClick={() => setEconomy(current => ({ ...current, equipped: { ...current.equipped, cosmetic: "constellation-halo" } }))}>{economy.equipped.cosmetic === "constellation-halo" ? `CONSTELLATION HALO · ${["HALO I", "HALO II", "GLOW", "HALO III"][economy.cosmeticUpgrades["constellation-halo"] || 0]} EQUIPPED` : "EQUIP LIMITED CONSTELLATION HALO I"}</button>}
    </div>}
    <footer>DEMO PROGRESS RESETS ON RELOAD · PRODUCTION RESET REQUIRES PERSISTENT SERVER TIME</footer>
  </section>;
}

function drawScene(ctx: CanvasRenderingContext2D, sprites: GenerationSprites, phase: Phase, startedAt: number, now: number, reducedMotion: boolean, alien: number, variant: number, equipped: DemoEconomy["equipped"], poolLevel: number, bossEncounter: boolean, cosmeticLevel: number) {
  const elapsed = now - startedAt;
  const progress = Math.min(1, elapsed / phaseDuration[phase]);
  ctx.clearRect(0, 0, 960, 640); ctx.fillStyle = "#050608"; ctx.fillRect(0, 0, 960, 640);
  ctx.fillStyle = "#f7f2df";
  stars.forEach((star, index) => {
    const blink = reducedMotion || (Math.floor(now / 420) + index) % 5 !== 0;
    if (blink) ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.fillStyle = "#0e1118"; ctx.fillRect(0, 380, 960, 260);
  for (let y = 390; y < 640; y += 18) { ctx.fillStyle = y % 36 ? "#10131a" : "#0a0c12"; ctx.fillRect(0, y, 960, 2); }
  drawPool(ctx, now, reducedMotion, equipped.pool, poolLevel, bossEncounter);
  drawMasterySignals(ctx, now, reducedMotion, equipped.pool, poolLevel);
  const bob = reducedMotion ? 0 : Math.sin(now / 390) * 7;
  const ufoY = 280 + bob;
  if (poolLevel >= 15) drawMasteryUfoAura(ctx, 480, ufoY, now, reducedMotion, equipped.pool);
  drawUfo(ctx, 480, ufoY, equipped.ufo, now);
  drawFriend(ctx, sprites, 480, ufoY - 12, reducedMotion ? 0 : Math.floor(now / 180) % 8, equipped.cosmetic, cosmeticLevel);
  let lineBottom = 460;
  if (phase === "casting") lineBottom = 324 + progress * 136;
  if (phase === "reeling") lineBottom = 460 - progress * 108;
  if (phase === "reveal") lineBottom = 352;
  ctx.strokeStyle = phase === "bite" ? "#b8ff58" : "#f7f2df"; ctx.lineWidth = phase === "bite" ? 4 : 2;
  ctx.setLineDash(phase === "waiting" ? [7, 7] : []); ctx.beginPath(); ctx.moveTo(480, ufoY + 48); ctx.lineTo(480, lineBottom); ctx.stroke(); ctx.setLineDash([]);
  if (equipped.bait === "shimmer-bait") {
    ctx.fillStyle = "#5de8ff"; ctx.fillRect(475, lineBottom - 5, 10, 16); ctx.fillStyle = "#f7f2df"; ctx.fillRect(478, lineBottom - 9, 4, 24);
  } else if (equipped.bait === "discovery-bait") {
    ctx.fillStyle = "#ffd25d"; ctx.fillRect(475, lineBottom - 7, 10, 20); ctx.fillRect(470, lineBottom - 2, 20, 10); ctx.fillStyle = "#f7f2df"; ctx.fillRect(478, lineBottom - 4, 4, 14);
  } else {
    ctx.fillStyle = phase === "bite" ? "#b8ff58" : "#f7f2df"; ctx.fillRect(474, lineBottom, 12, 6); ctx.fillStyle = "#b8ff58"; ctx.fillRect(477, lineBottom + 1, 6, 3);
  }
  if (phase === "bite") {
    const size = 28 + (reducedMotion ? 0 : Math.sin(now / 80) * 5);
    ctx.strokeStyle = "#b8ff58"; ctx.lineWidth = 3; ctx.strokeRect(480 - size, lineBottom - size, size * 2, size * 2);
  }
  if (phase === "reeling" || phase === "reveal") {
    if (equipped.bait === "shimmer-bait") {
      ctx.strokeStyle = aliens[alien].accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(480, lineBottom + 58, phase === "reveal" ? 64 : 45, phase === "reveal" ? 24 : 17, now / 700, 0, Math.PI * 2); ctx.stroke();
    }
    drawAlien(ctx, 480, lineBottom + 58, alien, bossEncounter && phase === "reveal" ? 8 : phase === "reveal" ? 6 : 4, variant);
  }
  ctx.fillStyle = "rgba(5,6,8,.72)"; ctx.fillRect(0, 0, 960, 78); ctx.fillRect(0, 570, 960, 70);
}

export default function AlienAngler({ friendId, client, paused }: GameComponentProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sound = useRef<FriendSoundKit | null>(null);
  const revealPaid = useRef(false);
  const live = useRef({ phase: "casting" as Phase, phaseStarted: performance.now(), reducedMotion: false, paused });
  const [sprites, setSprites] = useState<GenerationSprites | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("casting");
  const [collection, setCollection] = useState([0, 0, 0, 0, 0]);
  const collectionRef = useRef(collection); collectionRef.current = collection;
  const [variantCollection, setVariantCollection] = useState(emptyVariantCollection);
  const [latestVariants, setLatestVariants] = useState(() => aliens.map(() => 0));
  const [currentAlien, setCurrentAlien] = useState(0);
  const [currentVariant, setCurrentVariant] = useState(0);
  const [currentBoss, setCurrentBoss] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [archiveSpecies, setArchiveSpecies] = useState<number | null>(null);
  const [economy, setEconomy] = useState<DemoEconomy>(defaultEconomy);
  const [lastReward, setLastReward] = useState<CatchReward | null>(null);
  const economyRef = useRef(economy); economyRef.current = economy;
  live.current = { ...live.current, phase, reducedMotion, paused: paused || shopOpen || contractsOpen || archiveSpecies !== null };

  useEffect(() => {
    let cancelled = false;
    sound.current?.dispose(); sound.current = createFriendSoundKit({ muted: true });
    setSprites(null); setError(""); setPhase("casting"); setCollection([0, 0, 0, 0, 0]); setVariantCollection(emptyVariantCollection()); setLatestVariants(aliens.map(() => 0)); setCurrentAlien(0); setCurrentVariant(0); setCurrentBoss(false); setArchiveSpecies(null); setContractsOpen(false); setEconomy(defaultEconomy); setLastReward(null); revealPaid.current = false;
    void Promise.all([createFriendReader().read(friendId), client.read()]).then(([art, snapshot]) => {
      if (cancelled) return;
      if (snapshot.friendId !== friendId) throw new Error("Game session does not match the selected Friend.");
      setSprites(art);
    }).catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not tune the alien signal."); });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches); update(); preference.addEventListener("change", update);
    return () => { cancelled = true; sound.current?.dispose(); sound.current = null; preference.removeEventListener("change", update); };
  }, [client, friendId]);

  useEffect(() => {
    live.current.phaseStarted = performance.now();
    if (!sprites || paused || shopOpen || contractsOpen || archiveSpecies !== null) return;
    if (phase === "bite") sound.current?.play("anticipation");
    if (phase === "reeling") {
      revealPaid.current = false;
      setLastReward(null);
      const activePool = economyRef.current.equipped.pool;
      const activeLevel = masteryLevel(economyRef.current.poolXp[activePool] || 0);
      const bossSignal = activeLevel >= 30 && questReady(economyRef.current.poolQuests[activePool]);
      const scannerActive = !bossSignal && economyRef.current.variantScanners > 0;
      setCurrentBoss(bossSignal);
      setCurrentAlien(bossSignal ? 4 : rollAlien(economyRef.current.equipped.bait, collectionRef.current, economyRef.current.signal));
      setCurrentVariant(bossSignal ? 4 : rollVariant(activeLevel, scannerActive));
      if (scannerActive) setEconomy(current => ({ ...current, variantScanners: Math.max(0, current.variantScanners - 1) }));
      sound.current?.play("action-start");
    }
    if (phase === "reveal" && !revealPaid.current) {
      revealPaid.current = true;
      const before = economyRef.current;
      const discovery = collectionRef.current[currentAlien] === 0;
      const pool = before.equipped.pool;
      const level = masteryLevel(before.poolXp[pool] || 0);
      const dustBoost = Math.floor(level / 5) * .1;
      const stardust = Math.ceil(stardustRewards[currentAlien] * (1 + dustBoost) * (before.equipped.bait === "shimmer-bait" ? 1.25 : 1));
      const rf = aliens[currentAlien].reward + (discovery ? discoveryBonuses[currentAlien] : 0);
      const masteryXp = masteryRewards[currentAlien];
      setCollection(values => values.map((value, index) => index === currentAlien ? value + 1 : value));
      setVariantCollection(species => species.map((variants, speciesIndex) => speciesIndex === currentAlien
        ? variants.map((count, variantIndex) => variantIndex === currentVariant ? count + 1 : count)
        : variants));
      setLatestVariants(values => values.map((value, index) => index === currentAlien ? currentVariant : value));
      setEconomy(current => {
        const quest = current.poolQuests[pool];
        const weeklyProgress = [...current.weeklyProgress];
        const weeklySlot = weeklyBoard.findIndex((requiredAlien, index) => requiredAlien === currentAlien && !weeklyProgress[index]);
        if (weeklySlot >= 0) weeklyProgress[weeklySlot] = true;
        const usedBaits = current.dailyProgress.baits.includes(current.equipped.bait) ? current.dailyProgress.baits : [...current.dailyProgress.baits, current.equipped.bait];
        const usedPools = current.dailyProgress.pools.includes(pool) ? current.dailyProgress.pools : [...current.dailyProgress.pools, pool];
        const questUpdate = level >= 30 ? {
          epic: quest.epic || currentAlien >= 2,
          variant: quest.variant || currentVariant > 0,
          casts: Math.min(10, quest.casts + (currentBoss ? 0 : 1)),
          bossCaught: quest.bossCaught || currentBoss,
        } : quest;
        return {
          ...current,
          balance: current.balance + rf,
          stardust: current.stardust + stardust,
          signal: discovery ? 0 : Math.min(60, current.signal + 1),
          poolXp: { ...current.poolXp, [pool]: (current.poolXp[pool] || 0) + masteryXp },
          poolQuests: { ...current.poolQuests, [pool]: questUpdate },
          dailyProgress: {
            catches: current.dailyProgress.catches + 1,
            baits: usedBaits,
            rarePlus: current.dailyProgress.rarePlus + (currentAlien >= 1 ? 1 : 0),
            stardust: current.dailyProgress.stardust + stardust,
            pools: usedPools,
          },
          weeklyProgress,
        };
      });
      setLastReward({ rf, stardust, masteryXp, discovery });
      sound.current?.play(currentAlien >= 3 ? "reveal-legendary" : currentAlien >= 1 ? "reveal-rare" : "reveal-common");
    }
    if (phase === "bite" && (economyRef.current.baitStock[economyRef.current.equipped.bait] || 0) <= 0) return;
    const timer = window.setTimeout(() => {
      if (phase === "bite") setEconomy(current => ({ ...current, baitStock: { ...current.baitStock, [current.equipped.bait]: Math.max(0, (current.baitStock[current.equipped.bait] || 0) - 1) } }));
      setPhase(nextPhase[phase]);
    }, phaseDuration[phase]);
    return () => window.clearTimeout(timer);
  }, [phase, paused, shopOpen, contractsOpen, archiveSpecies, sprites]);

  useEffect(() => {
    const node = canvas.current, ctx = node?.getContext("2d");
    if (!node || !ctx || !sprites) return;
    ctx.imageSmoothingEnabled = false;
    let frame = 0;
    const render = (now: number) => {
      const level = masteryLevel(economy.poolXp[economy.equipped.pool] || 0);
      drawScene(ctx, sprites, live.current.phase, live.current.phaseStarted, now, live.current.reducedMotion, currentAlien, currentVariant, economy.equipped, level, currentBoss, economy.cosmeticUpgrades[economy.equipped.cosmetic] || 0);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [sprites, currentAlien, currentVariant, currentBoss, economy.equipped, economy.poolXp, economy.cosmeticUpgrades]);

  const reel = () => {
    if (paused || shopOpen || contractsOpen || archiveSpecies !== null || phase !== "bite") return;
    const bait = economy.equipped.bait;
    if ((economy.baitStock[bait] || 0) <= 0) return;
    void sound.current?.unlock();
    setEconomy(current => ({ ...current, baitStock: { ...current.baitStock, [bait]: Math.max(0, (current.baitStock[bait] || 0) - 1) } }));
    setPhase("reeling");
  };
  const phaseLabel: Record<Phase, string> = {
    casting: "CASTING SIGNAL", waiting: "SCANNING THE GALAXY", bite: "ALIEN DETECTED!", reeling: "BEAMING IT UP", reveal: "NEW SPECIMEN",
  };

  if (!sprites) return <main className="angler-loading" role={error ? "alert" : "status"}>
    <span>⌁</span><h1>Alien Angler</h1><p>{error || "Loading your Rare Friend…"}</p>
    {error && <button type="button" onClick={() => window.location.reload()}>Retry</button>}
  </main>;

  const activeBaitStock = economy.baitStock[economy.equipped.bait] || 0;
  const signalTarget = nextSignalTarget(economy.signal);
  const activeMasteryLevel = masteryLevel(economy.poolXp[economy.equipped.pool] || 0);
  const discoveredVariants = variantCollection.reduce((total, variants) => total + variants.filter(Boolean).length, 0);
  return <main className={`angler-game phase-${phase} ${shopOpen ? "shop-open" : ""} ${contractsOpen ? "contracts-open" : ""} ${archiveSpecies !== null ? "archive-open" : ""}`} aria-label="Alien Angler idle game">
    <canvas ref={canvas} width="960" height="640" aria-label="Your Rare Friend fishing for aliens from a UFO above a galaxy pool" />
    <header className="angler-hud">
      <div><span>RARE FRIEND #{friendId.toString()}</span><h1>ALIEN ANGLER</h1></div>
      <div className="signal-readout"><i /><span>{contractsOpen ? "CONTRACT BOARD" : archiveSpecies !== null ? "VARIANT ARCHIVE" : shopOpen ? "MARKET OPEN" : paused ? "PAUSED" : phaseLabel[phase]}</span><small>SIGNAL {economy.signal}/{signalTarget}</small></div>
      <div className="hud-actions"><strong>◆ {economy.balance.toFixed(1)} RF</strong><span className="dust-balance">✦ {economy.stardust}</span><span className="fragment-balance">⬡ {economy.fragments}</span><button type="button" className="contract-button" onClick={() => { setShopOpen(false); setContractsOpen(true); }}>CONTRACTS</button><button type="button" className="market-button" onClick={() => { setContractsOpen(false); setShopOpen(true); }}>MARKET</button><button type="button" onClick={() => { const next = !muted; setMuted(next); sound.current?.setMuted(next); if (!next) void sound.current?.unlock(); }}>{muted ? "SOUND OFF" : "SOUND ON"}</button></div>
    </header>
    {!shopOpen && !contractsOpen && <div className="mastery-badge" style={{ "--accent": (poolColors[economy.equipped.pool] || poolColors["genesis-pool"]).mid } as React.CSSProperties}><small>{storeItems.find(item => item.id === economy.equipped.pool)?.name.toUpperCase()}</small><strong>POOL LV {activeMasteryLevel}</strong><span>{activeMasteryLevel >= 30 ? "BOSS PORTAL" : activeMasteryLevel >= 20 ? "POOL OUTFIT" : activeMasteryLevel >= 15 ? "UFO AURA" : activeMasteryLevel >= 10 ? "COSMIC SIGNAL" : activeMasteryLevel >= 5 ? "EVOLVED" : "BASE"}</span></div>}

    {shopOpen && <ShopPanel economy={economy} setEconomy={setEconomy} close={() => setShopOpen(false)} />}
    {contractsOpen && <ContractsPanel economy={economy} setEconomy={setEconomy} close={() => setContractsOpen(false)} />}

    {archiveSpecies !== null && <section className="variant-archive" role="dialog" aria-modal="true" aria-labelledby="variant-archive-title">
      <header><div><small>COLLECTION DATABASE</small><h2 id="variant-archive-title">{aliens[archiveSpecies].name.toUpperCase()}</h2><p>{variantCollection[archiveSpecies].filter(Boolean).length} / 6 VARIANTS DISCOVERED · {collection[archiveSpecies]} TOTAL CATCHES</p></div><button type="button" onClick={() => setArchiveSpecies(null)}>CLOSE ×</button></header>
      <div className="variant-grid">
        {alienVariants.map((variant, variantIndex) => {
          const count = variantCollection[archiveSpecies][variantIndex];
          return <article key={variant.id} className={count > 0 ? "unlocked" : "locked"} style={{ "--variant": variant.accent } as React.CSSProperties}>
            <div className="variant-model">{count > 0 ? <AlienModel index={archiveSpecies} variant={variantIndex} /> : <span aria-hidden="true">?</span>}</div>
            <small>{count > 0 ? `${variant.chanceBps / 100}% DROP` : "SIGNAL LOCKED"}</small>
            <strong>{count > 0 ? variant.name.toUpperCase() : "UNKNOWN"}</strong>
            <p>{count > 0 ? `CAUGHT ×${count}` : "Catch this variant to reveal its model."}</p>
          </article>;
        })}
      </div>
      <footer>VARIANTS ARE COLLECTIBLE VISUALS · RF REWARD REMAINS UNCHANGED</footer>
    </section>}

    {!shopOpen && phase === "bite" && activeBaitStock <= 0 && <aside className="bait-alert" role="status" aria-live="polite">
      <span>NO SIGNAL</span><strong>OUT OF BAIT</strong><p>Open Market to restock or equip another bait.</p>
    </aside>}

    <aside className="alien-index" aria-label="Alien collection">
      {aliens.map((alien, index) => {
        const discovered = collection[index] > 0;
        return <div key={alien.name} className={discovered ? "discovered" : "unknown"} role={discovered ? "button" : undefined} tabIndex={discovered ? 0 : undefined} aria-label={discovered ? `View ${alien.name} variants` : undefined} onClick={() => discovered && setArchiveSpecies(index)} onKeyDown={event => { if (discovered && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setArchiveSpecies(index); } }}>
          {discovered ? <AlienModel index={index} variant={latestVariants[index]} /> : <span className="alien-unknown" aria-hidden="true">?</span>}
          <span>{discovered ? alien.name : "UNKNOWN"}<small style={discovered ? { color: alien.accent } : undefined}>{discovered ? `${alien.rarity} · ${alien.chanceBps / 100}%` : "UNDISCOVERED"}</small>{discovered && <em className="variant-summary" style={{ color: alienVariants[latestVariants[index]].accent }}>{alienVariants[latestVariants[index]].name.toUpperCase()} · {variantCollection[index].filter(Boolean).length}/6 VARIANTS</em>}</span>
          <b>{collection[index]}</b>
        </div>;
      })}
    </aside>

    {phase === "reveal" && <aside className="catch-card" aria-live="polite" style={{ borderColor: alienVariants[currentVariant].accent, boxShadow: `9px 9px 0 ${alienVariants[currentVariant].accent}` }}>
      <span className="card-code">{currentBoss ? "MYTHICAL BOSS SIGNAL" : `SPECIMEN ${String(currentAlien + 1).padStart(3, "0")}`}</span><strong>{currentBoss ? "STAR EATER PRIME" : aliens[currentAlien].name.toUpperCase()}</strong><small>{currentBoss ? "POOL MASTERY QUEST" : `${aliens[currentAlien].rarity.toUpperCase()} · ${aliens[currentAlien].chanceBps / 100}%`}</small>
      <div className="variant-reveal" style={{ color: alienVariants[currentVariant].accent }}>{alienVariants[currentVariant].name.toUpperCase()} VARIANT <small>{alienVariants[currentVariant].chanceBps / 100}% · COLLECTION ONLY</small></div>
      <p>{currentAlien === 0 ? "A curious one-eyed drifter. It hums whenever the UFO turns left." : currentAlien === 1 ? "A soft orbital swimmer that glows when it hears radio static." : currentAlien === 2 ? "A stubborn void crawler with claws made from collapsed starlight." : currentAlien === 3 ? "A radiant traveler that leaves a golden pixel trail across deep space." : "An almost impossible cosmic giant said to swallow dying stars."}</p>
      <div className="reward-line" style={{ color: aliens[currentAlien].accent }}>+{(lastReward?.rf ?? aliens[currentAlien].reward).toFixed(1)} RF <small>DEMO REWARD</small><span>✦ +{lastReward?.stardust ?? stardustRewards[currentAlien]} STARDUST · +{lastReward?.masteryXp ?? masteryRewards[currentAlien]} POOL XP</span>{lastReward?.discovery && <b>FIRST DISCOVERY BONUS</b>}</div>
    </aside>}

    <footer className="angler-dock">
      <div className="collection"><span>COLLECTION</span><strong>{collection.reduce((sum, value) => sum + value, 0).toString().padStart(2, "0")}</strong><small>{collection.filter(Boolean).length}/5 SPECIES · {discoveredVariants}/30 VARIANTS · POOL LV {activeMasteryLevel}</small></div>
      <button type="button" className={phase === "bite" && activeBaitStock > 0 ? "reel-ready" : ""} disabled={paused || shopOpen || contractsOpen || phase !== "bite" || activeBaitStock <= 0} onClick={reel}>
        {activeBaitStock <= 0 ? "NEED BAIT" : phase === "bite" ? "REEL NOW" : "AUTO FISHING"}<small>{economy.equipped.bait.replaceAll("-", " ").toUpperCase()} · {activeBaitStock} LEFT{economy.variantScanners > 0 ? ` · SCANNER ×${economy.variantScanners}` : ""}</small>
      </button>
      <label><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} /> REDUCED MOTION</label>
    </footer>
  </main>;
}
