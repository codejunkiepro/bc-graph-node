const crypto = require("crypto");

// const crashHash = "da5729215cf9bff53a6ab75af1f19d2178a2d220fba44718737f25a91314dc60";
// const salt = "0000000000000000000fa3b65e43e4240d71762a5bf397d5304b2596d116859c";
const crashHash = "add690bb262e41818dbeee7c7c290de92a307d33ab00897a28ad579cee4fe980";
const salt = "0000000000000000000301e2801a9a9598bfb114e574a91a887f2132f33047e6";

function saltHash(hash) {
    return crypto
        .createHmac("sha256", hash)
        .update(salt)
        .digest("hex");
}

const generateHash = (seed) => {
    return crypto
        .createHash("sha256")
        .update(seed)
        .digest("hex");
}

function divisible(hash, mod) {
    var val = 0;
    var o = hash.length % 4;
    for (let i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
        val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
    }
    return val === 0;
}

const crashPointFromHash_old = (serverSeed, num_of_games) => {
    if (!serverSeed) {
        return 1;
    }
    if (!num_of_games) {
        num_of_games = 20;
    }
    const hash = crypto
        .createHmac("sha256", serverSeed)
        .update(salt)
        .digest("hex");
    
    // In 1 of num_of_games games the game crashes instantly.
    const hs = parseInt(num_of_games);
    if (divisible(hash, hs)) {
        return 1;
    }

    // Use the most significant 52-bit from the hash to calculate the crash point
    const h = parseInt(hash.slice(0, 52 / 4), 16);
    const e = Math.pow(2, 52);

    return Math.floor((100 * e - h) / (e - h)) / 100.0;
}
const crashPointFromHash = (seed, num_of_games) => {
    const nBits = 52; // number of most significant bits to use

    // 1. HMAC_SHA256(message=seed, key=salt) 
    // const hmac = CryptoJS.HmacSHA256(CryptoJS.enc.Hex.parse(seed), salt);
    // seed = hmac.toString(CryptoJS.enc.Hex);
    const seedBytes = Buffer.from(seed, 'hex');

    // Create an HMAC-SHA256 hash
    const hmac = crypto.createHmac('sha256', salt);
    hmac.update(seedBytes);
    const hash = hmac.digest('hex');
    // 2. r = 52 most significant bits
    // seed = seed.slice(0, nBits / 4);
    // const r = parseInt(seed, 16);
    const r = parseInt(hash.slice(0, nBits / 4), 16);
    // 3. X = r / 2^52
    let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)
    X = parseFloat(X.toPrecision(9));
    // 4. X = 99 / (1-X)
    X = 99 / (1 - X);
    // 5. return max(trunc(X), 100)
    const result = Math.floor(X);
    return Math.max(1, result / 100);
};

function getPreviousGames(cHash, count) {
    const previousGames = [];
    let gameHash = generateHash(cHash);

    const first = Date.now();
    for (let i = 0; i < count; i++) {
        const gameResult = crashPointFromHash(gameHash);
        previousGames.push({ gameHash, gameResult });
        gameHash = generateHash(gameHash);
    }
    return previousGames;
}

function verifyCrash() {
    const gameResult = crashPointFromHash(crashHash);
    const previousHundredGames = getPreviousGames();

    return { gameResult, previousHundredGames };
}


module.exports = {
    crashHash,
    generateHash,
    crashPointFromHash,
    getPreviousGames,
    verifyCrash,
} 