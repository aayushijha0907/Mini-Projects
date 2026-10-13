/**
 * Minecraft Stick-Craft Monopoly - Game Configuration & Data
 * All 40 board spaces, cards, tokens, color sets, and rules constants.
 */

const CONFIG = {
    STARTING_EMERALDS: 1500,
    PASS_GO_REWARD: 200,
    JAIL_FEE: 50,
    MAX_DOUBLES: 3,
    MAX_HOUSES_PER_PROPERTY: 4, // 1-4 Huts, 5th is Beacon (Hotel)
    BOARD_SIZE: 11, // 11x11 grid spaces
};

// 40 Board Spaces
const BOARD_TILES = [
    {
        id: 0,
        name: "Spawn Point",
        type: "go",
        desc: "Collect 200 Emeralds as you pass.",
        icon: "compass",
        color: "#55aa55"
    },
    {
        id: 1,
        name: "Dirt Path",
        type: "property",
        group: "brown",
        cost: 60,
        rent: [2, 10, 30, 90, 160, 250],
        houseCost: 50,
        mortgage: 30,
        icon: "dirt"
    },
    {
        id: 2,
        name: "Treasure Chest",
        type: "chest",
        desc: "Draw a Treasure Chest card.",
        icon: "chest"
    },
    {
        id: 3,
        name: "Oak Plains",
        type: "property",
        group: "brown",
        cost: 60,
        rent: [4, 20, 60, 180, 320, 450],
        houseCost: 50,
        mortgage: 30,
        icon: "oak"
    },
    {
        id: 4,
        name: "Villager Toll",
        type: "tax",
        cost: 200,
        desc: "Pay 200 Emeralds toll to the Iron Golem.",
        icon: "emerald"
    },
    {
        id: 5,
        name: "Chest Minecart",
        type: "railroad",
        group: "railroad",
        cost: 200,
        rent: [25, 50, 100, 200],
        mortgage: 100,
        icon: "minecart"
    },
    {
        id: 6,
        name: "Birch Forest",
        type: "property",
        group: "light_blue",
        cost: 100,
        rent: [6, 30, 90, 270, 400, 550],
        houseCost: 50,
        mortgage: 50,
        icon: "birch"
    },
    {
        id: 7,
        name: "Lucky Block",
        type: "chance",
        desc: "Break a Lucky Block! Anything can happen.",
        icon: "lucky"
    },
    {
        id: 8,
        name: "Taiga",
        type: "property",
        group: "light_blue",
        cost: 100,
        rent: [6, 30, 90, 270, 400, 550],
        houseCost: 50,
        mortgage: 50,
        icon: "spruce"
    },
    {
        id: 9,
        name: "Snowy Tundra",
        type: "property",
        group: "light_blue",
        cost: 120,
        rent: [8, 40, 100, 300, 450, 600],
        houseCost: 50,
        mortgage: 60,
        icon: "snow"
    },
    {
        id: 10,
        name: "Bedrock Prison",
        type: "jail",
        desc: "Just Visiting / Locked in the Obsidian Cell",
        icon: "iron_bars"
    },
    {
        id: 11,
        name: "Desert",
        type: "property",
        group: "pink",
        cost: 140,
        rent: [10, 50, 150, 450, 625, 750],
        houseCost: 100,
        mortgage: 70,
        icon: "cactus"
    },
    {
        id: 12,
        name: "Redstone Lamp",
        type: "utility",
        group: "utility",
        cost: 150,
        desc: "Rent is 4x or 10x dice roll.",
        mortgage: 75,
        icon: "redstone"
    },
    {
        id: 13,
        name: "Badlands",
        type: "property",
        group: "pink",
        cost: 140,
        rent: [10, 50, 150, 450, 625, 750],
        houseCost: 100,
        mortgage: 70,
        icon: "terracotta"
    },
    {
        id: 14,
        name: "Savanna",
        type: "property",
        group: "pink",
        cost: 160,
        rent: [12, 60, 180, 500, 700, 900],
        houseCost: 100,
        mortgage: 80,
        icon: "acacia"
    },
    {
        id: 15,
        name: "Furnace Minecart",
        type: "railroad",
        group: "railroad",
        cost: 200,
        rent: [25, 50, 100, 200],
        mortgage: 100,
        icon: "minecart"
    },
    {
        id: 16,
        name: "Swamp",
        type: "property",
        group: "orange",
        cost: 180,
        rent: [14, 70, 200, 550, 750, 950],
        houseCost: 100,
        mortgage: 90,
        icon: "lilypad"
    },
    {
        id: 17,
        name: "Treasure Chest",
        type: "chest",
        desc: "Draw a Treasure Chest card.",
        icon: "chest"
    },
    {
        id: 18,
        name: "Mangrove Swamp",
        type: "property",
        group: "orange",
        cost: 180,
        rent: [14, 70, 200, 550, 750, 950],
        houseCost: 100,
        mortgage: 90,
        icon: "mangrove"
    },
    {
        id: 19,
        name: "Dark Forest",
        type: "property",
        group: "orange",
        cost: 200,
        rent: [16, 80, 220, 600, 800, 1000],
        houseCost: 100,
        mortgage: 100,
        icon: "dark_oak"
    },
    {
        id: 20,
        name: "Village Haven",
        type: "free_parking",
        desc: "Take shelter. Safe resting zone.",
        icon: "bell"
    },
    {
        id: 21,
        name: "Jungle",
        type: "property",
        group: "red",
        cost: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        houseCost: 150,
        mortgage: 110,
        icon: "vine"
    },
    {
        id: 22,
        name: "Lucky Block",
        type: "chance",
        desc: "Break a Lucky Block! Anything can happen.",
        icon: "lucky"
    },
    {
        id: 23,
        name: "Bamboo Jungle",
        type: "property",
        group: "red",
        cost: 220,
        rent: [18, 90, 250, 700, 875, 1050],
        houseCost: 150,
        mortgage: 110,
        icon: "bamboo"
    },
    {
        id: 24,
        name: "Mushroom Island",
        type: "property",
        group: "red",
        cost: 240,
        rent: [20, 100, 300, 750, 925, 1100],
        houseCost: 150,
        mortgage: 120,
        icon: "mushroom"
    },
    {
        id: 25,
        name: "Hopper Minecart",
        type: "railroad",
        group: "railroad",
        cost: 200,
        rent: [25, 50, 100, 200],
        mortgage: 100,
        icon: "minecart"
    },
    {
        id: 26,
        name: "Warm Ocean",
        type: "property",
        group: "yellow",
        cost: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        houseCost: 150,
        mortgage: 130,
        icon: "coral"
    },
    {
        id: 27,
        name: "Deep Dark",
        type: "property",
        group: "yellow",
        cost: 260,
        rent: [22, 110, 330, 800, 975, 1150],
        houseCost: 150,
        mortgage: 130,
        icon: "sculk"
    },
    {
        id: 28,
        name: "Enchanting Table",
        type: "utility",
        group: "utility",
        cost: 150,
        desc: "Rent is 4x or 10x dice roll.",
        mortgage: 75,
        icon: "enchant"
    },
    {
        id: 29,
        name: "Ocean Monument",
        type: "property",
        group: "yellow",
        cost: 280,
        rent: [24, 120, 360, 850, 1025, 1200],
        houseCost: 150,
        mortgage: 140,
        icon: "prismarine"
    },
    {
        id: 30,
        name: "Warden Ambush!",
        type: "go_to_jail",
        desc: "A Warden screeches! Go straight to Bedrock Prison.",
        icon: "warden"
    },
    {
        id: 31,
        name: "Nether Wastes",
        type: "property",
        group: "green",
        cost: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        houseCost: 200,
        mortgage: 150,
        icon: "netherrack"
    },
    {
        id: 32,
        name: "Crimson Forest",
        type: "property",
        group: "green",
        cost: 300,
        rent: [26, 130, 390, 900, 1100, 1275],
        houseCost: 200,
        mortgage: 150,
        icon: "crimson"
    },
    {
        id: 33,
        name: "Treasure Chest",
        type: "chest",
        desc: "Draw a Treasure Chest card.",
        icon: "chest"
    },
    {
        id: 34,
        name: "Basalt Deltas",
        type: "property",
        group: "green",
        cost: 320,
        rent: [28, 150, 450, 1000, 1200, 1400],
        houseCost: 200,
        mortgage: 160,
        icon: "basalt"
    },
    {
        id: 35,
        name: "TNT Minecart",
        type: "railroad",
        group: "railroad",
        cost: 200,
        rent: [25, 50, 100, 200],
        mortgage: 100,
        icon: "minecart"
    },
    {
        id: 36,
        name: "Lucky Block",
        type: "chance",
        desc: "Break a Lucky Block! Anything can happen.",
        icon: "lucky"
    },
    {
        id: 37,
        name: "Nether Fortress",
        type: "property",
        group: "dark_blue",
        cost: 350,
        rent: [35, 175, 500, 1100, 1300, 1500],
        houseCost: 200,
        mortgage: 175,
        icon: "blaze"
    },
    {
        id: 38,
        name: "Anvil Repair Tax",
        type: "tax",
        cost: 100,
        desc: "Your netherite armor shattered! Pay 100 Emeralds.",
        icon: "anvil"
    },
    {
        id: 39,
        name: "The End",
        type: "property",
        group: "dark_blue",
        cost: 400,
        rent: [50, 200, 600, 1400, 1700, 2000],
        houseCost: 200,
        mortgage: 200,
        icon: "dragon"
    }
];

// Color Groups Configuration
const COLOR_GROUPS = {
    brown: {
        name: "Plains Woods",
        color: "#6b4423",
        textColor: "#ffffff",
        tiles: [1, 3]
    },
    light_blue: {
        name: "Tundra & Taiga",
        color: "#5b9bd5",
        textColor: "#ffffff",
        tiles: [6, 8, 9]
    },
    pink: {
        name: "Arid Badlands",
        color: "#d46b85",
        textColor: "#ffffff",
        tiles: [11, 13, 14]
    },
    orange: {
        name: "Deep Swamps",
        color: "#df7823",
        textColor: "#ffffff",
        tiles: [16, 18, 19]
    },
    red: {
        name: "Lush Jungles",
        color: "#c82d2d",
        textColor: "#ffffff",
        tiles: [21, 23, 24]
    },
    yellow: {
        name: "Ocean & Depths",
        color: "#d9a826",
        textColor: "#111111",
        tiles: [26, 27, 29]
    },
    green: {
        name: "The Nether",
        color: "#2a7536",
        textColor: "#ffffff",
        tiles: [31, 32, 34]
    },
    dark_blue: {
        name: "Endgame Realms",
        color: "#1d3f7a",
        textColor: "#ffffff",
        tiles: [37, 39]
    },
    railroad: {
        name: "Minecart Network",
        color: "#4a4a4a",
        textColor: "#ffffff",
        tiles: [5, 15, 25, 35]
    },
    utility: {
        name: "Redstone & Magic",
        color: "#8a5832",
        textColor: "#ffffff",
        tiles: [12, 28]
    }
};

// Lucky Block Deck (Chance)
const LUCKY_BLOCK_CARDS = [
    {
        title: "Ender Pearl Teleport!",
        desc: "Advance straight to Spawn Point. Collect 200 Emeralds.",
        action: "advance_to",
        target: 0
    },
    {
        title: "End Ship Raid!",
        desc: "Take the portal to The End! If you pass Spawn Point, collect 200 Emeralds.",
        action: "advance_to",
        target: 39
    },
    {
        title: "Minecart Fast Travel",
        desc: "Ride the rails to Chest Minecart. If you pass Spawn Point, collect 200 Emeralds.",
        action: "advance_to",
        target: 5
    },
    {
        title: "Ancient Debris Found!",
        desc: "You excavated ancient debris in the nether! Bank pays you 150 Emeralds.",
        action: "collect",
        amount: 150
    },
    {
        title: "Creeper Blast!",
        desc: "Sssss... BOOM! Pay 50 Emeralds for shelter repairs.",
        action: "pay",
        amount: 50
    },
    {
        title: "Totem of Undying",
        desc: "This card keeps you out of Bedrock Prison. Keep until needed or trade.",
        action: "get_out_of_jail_card"
    },
    {
        title: "Fell in Lava!",
        desc: "Go directly to Bedrock Prison. Do not pass Spawn Point, do not collect 200 Emeralds.",
        action: "go_to_jail"
    },
    {
        title: "Redstone Automation",
        desc: "General repairs: Pay 25 Emeralds per Wooden Hut and 100 Emeralds per Beacon Tower.",
        action: "repairs",
        houseCost: 25,
        hotelCost: 100
    },
    {
        title: "Cleric Trade Potion",
        desc: "Sold health potions to every player. Collect 50 Emeralds from each player.",
        action: "collect_from_all",
        amount: 50
    },
    {
        title: "Speed Potion Dash!",
        desc: "Advance 3 spaces forward.",
        action: "move_relative",
        steps: 3
    }
];

// Treasure Chest Deck (Community Chest)
const TREASURE_CHEST_CARDS = [
    {
        title: "Emerald Ore Vein!",
        desc: "Struck a rich emerald vein in the mountains. Collect 200 Emeralds.",
        action: "collect",
        amount: 200
    },
    {
        title: "Hero of the Village!",
        desc: "Defeated a raid! Grateful villagers shower you with 100 Emeralds.",
        action: "collect",
        amount: 100
    },
    {
        title: "Iron Golem Gift",
        desc: "The Iron Golem offers you a poppy and shiny coins. Collect 50 Emeralds.",
        action: "collect",
        amount: 50
    },
    {
        title: "Struck by Lightning!",
        desc: "Charged creeper blew up your storage. Pay 50 Emeralds to rebuild.",
        action: "pay",
        amount: 50
    },
    {
        title: "Ender Pearl Escape",
        desc: "Get out of Bedrock Prison free. This card may be kept or traded.",
        action: "get_out_of_jail_card"
    },
    {
        title: "Caught Stealing Crops!",
        desc: "Caught by angry villagers! Go directly to Bedrock Prison.",
        action: "go_to_jail"
    },
    {
        title: "Feast with Friends",
        desc: "Cooked golden apples for everyone. Pay each player 20 Emeralds.",
        action: "pay_to_all",
        amount: 20
    },
    {
        title: "Fishing Jackpot",
        desc: "Reeled in an enchanted mending book! Sell it for 100 Emeralds.",
        action: "collect",
        amount: 100
    },
    {
        title: "Base Renovation",
        desc: "Fortify your bases. Pay 40 Emeralds per Hut and 115 Emeralds per Beacon.",
        action: "repairs",
        houseCost: 40,
        hotelCost: 115
    },
    {
        title: "Return to Bed",
        desc: "Right click your bed: Advance directly to Spawn Point. Collect 200 Emeralds.",
        action: "advance_to",
        target: 0
    }
];

// Handcrafted Player Tokens
const TOKENS = [
    {
        id: "steve",
        name: "Carved Steve",
        primaryColor: "#00a8a8",
        secondaryColor: "#00158f",
        accentColor: "#b87b58",
        headColor: "#b87b58",
        hairColor: "#3c220f",
        type: "wooden_figure"
    },
    {
        id: "alex",
        name: "Birch Alex",
        primaryColor: "#587b32",
        secondaryColor: "#6c4d32",
        accentColor: "#d96f27",
        headColor: "#e5b290",
        hairColor: "#d96f27",
        type: "wooden_figure"
    },
    {
        id: "creeper",
        name: "Twig Creeper",
        primaryColor: "#328325",
        secondaryColor: "#1d5314",
        accentColor: "#111111",
        headColor: "#429c33",
        hairColor: "#111111",
        type: "creeper_stick"
    },
    {
        id: "pig",
        name: "Clay Pig",
        primaryColor: "#f08585",
        secondaryColor: "#db6b6b",
        accentColor: "#8f3030",
        headColor: "#f08585",
        hairColor: "#db6b6b",
        type: "pig_block"
    },
    {
        id: "enderman",
        name: "Charred Enderman",
        primaryColor: "#161616",
        secondaryColor: "#0c0c0c",
        accentColor: "#b830d9",
        headColor: "#1a1a1a",
        hairColor: "#b830d9",
        type: "enderman_tall"
    },
    {
        id: "golem",
        name: "Stone Golem",
        primaryColor: "#cfcbbe",
        secondaryColor: "#a39e8f",
        accentColor: "#c72c2c",
        headColor: "#cfcbbe",
        hairColor: "#558833",
        type: "golem_heavy"
    }
];
