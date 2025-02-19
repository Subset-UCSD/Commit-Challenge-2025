const MAX_BROWN_HORSE = 200;
const MAX_BLACK_HORSE = 100;
const MAX_CHESTNUT_HORSE = 50;

// chestnut
function create2DArray(m, n, initialValue = 0) {
    return Array.from({ length: m }, () => Array(n).fill(initialValue));
}

const chestnutHorseChanceCache = create2DArray(MAX_BROWN_HORSE + 1, MAX_BLACK_HORSE + 1, 0);

const getChestnutHorseChance = (brownHorse, blackHorse) => {
    if (brownHorse < 2 && blackHorse < 2) return 0;
    else if (chestnutHorseChanceCache[brownHorse][blackHorse] != 0) return chestnutHorseChanceCache[brownHorse][blackHorse];

    if (blackHorse >= 2) {
        chestnutHorseChanceCache[brownHorse][blackHorse] = 0.3 * getChestnutHorseChance(brownHorse + 1, blackHorse - 2) + 0.5 * getChestnutHorseChance(brownHorse, blackHorse - 1) + 0.2;
    } else {
        chestnutHorseChanceCache[brownHorse][blackHorse] = 0.8 * getChestnutHorseChance(brownHorse - 1, blackHorse) + 0.2 * getChestnutHorseChance(brownHorse - 2, blackHorse + 1);
    }

    return chestnutHorseChanceCache[brownHorse][blackHorse];
}

// white
function create3DArray(x, y, z, initialValue = 0) {
    return Array.from({ length: x }, () => 
        Array.from({ length: y }, () => 
            Array(z).fill(initialValue)
        )
    );
}

const whiteHorseChanceCache = create3DArray(MAX_BROWN_HORSE + 1, MAX_BLACK_HORSE + 1, MAX_CHESTNUT_HORSE + 1, 0);

const getWhiteHorseChance = (brownHorse, blackHorse, chestnutHorse) => {
    if (brownHorse < 2 && blackHorse < 2 && chestnutHorse < 2) return 0;
    else if (whiteHorseChanceCache[brownHorse][blackHorse][chestnutHorse] != 0) return whiteHorseChanceCache[brownHorse][blackHorse][chestnutHorse];

    if (chestnutHorse >= 2) {
        whiteHorseChanceCache[brownHorse][blackHorse][chestnutHorse] = 0.3 * getWhiteHorseChance(brownHorse, blackHorse + 1, chestnutHorse - 2) + 0.5 * getWhiteHorseChance(brownHorse, blackHorse, chestnutHorse - 1) + 0.2;
    } else if (blackHorse >= 2) {
        whiteHorseChanceCache[brownHorse][blackHorse][chestnutHorse] = 0.3 * getWhiteHorseChance(brownHorse + 1, blackHorse - 2, chestnutHorse) + 0.5 * getWhiteHorseChance(brownHorse, blackHorse - 1, chestnutHorse) + 0.2 * getWhiteHorseChance(brownHorse, blackHorse - 2, chestnutHorse + 1);
    } else {
        whiteHorseChanceCache[brownHorse][blackHorse][chestnutHorse] = 0.8 * getWhiteHorseChance(brownHorse - 1, blackHorse, chestnutHorse) + 0.2 * getWhiteHorseChance(brownHorse - 2, blackHorse + 1, chestnutHorse);
    }
    
    return whiteHorseChanceCache[brownHorse][blackHorse][chestnutHorse];
}

console.log(getChestnutHorseChance(150, 0)); // chance of me getting a chestnut horse
