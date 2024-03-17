const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require('socket.io')
const http = require('http')
const { crashPointFromHash, generateHash } = require("./hash")

const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path')
const { readFileSync, writeFileSync, existsSync } = require('fs')

const chalk = require('chalk');
var colors = require('colors');
const { create } = require("domain");
colors.enable();

app.use(express.static(__dirname + '/public'))

const error = chalk.red;
const warning = chalk.bgRed.yellow;
const good = chalk.bgCyan.black;

const log = console.log;

let hashOK = false;
const payoutArray = [];
var theLastHash = '';
var calcNow = false;
const payoutArraySize = 200000;
const showNumber = 100;
const multiples = [
    // [1, 1.01, false, false, false, false],
    // [1, 1.5, false, false, false, false],
    // [1.5, 2, false, false, false, false],
    // [1.3, 0, true, false, false, false],
    [1.01, 0, true, false, false, false],
    [1.2, 0, true, false, false, false],
    [1.3, 0, true, false, false, false],
    [1.4, 0, true, false, false, false],
    [1.5, 0, true, false, false, false],
    // [2, 10, false, false, false, false],
    [2, 0, true, false, false, false],
    // [3, 0, false, false, false, false],
    // [4, 0, false, false, false, false],
    [5, 0, true, false, false, false],
    // [6, 0, false, false, false, false],
    // [7, 0, false, false, false, false],
    [10, 0, true, true, false, false],
    // [20, 0, false, false, false, false],
    // [50, 0, false, false, false, false],
    // [10, 100, false, false, false, false],
    // [100, 0, false, false, false, false],
    // [1000, 0, false, false, false, false],
    // [Number.MAX_SAFE_INTEGER]
];
const percentNums = [10, 20, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 100000];
const percentNums2 = [1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500, 1000];

let stdColumns = process.stdout.columns;

async function createModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: percentNums.length, inputShape: [percentNums.length], activation: 'selu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
    return model;
}

async function trainModel(model, trainingData, trainingLabels) {
    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });
    await model.fit(trainingData, trainingLabels, { epochs: 10 });
}
async function loadModel(file) {
    const model = await tf.loadLayersModel(file);
    return model;
}
async function saveModel(model, file) {
    await model.save(file);
}

const file_model = path.join(__dirname, `data\\predict2.json`)

const mlSize = 50;
const predictModel = tf.sequential();
predictModel.add(tf.layers.dense({ units: mlSize, inputShape: [mlSize], activation: 'relu' }));
predictModel.add(tf.layers.dense({ units: 1, activation: 'linear' }));
predictModel.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

const initPayouts = (hash) => {
    if (calcNow) {
        return;
    }
    calcNow = true;
    let calcHash = hash;
    for (let i = 0; i < payoutArraySize; i++) {
        const odds = crashPointFromHash(calcHash);
        payoutArray.push(odds);
        calcHash = generateHash(calcHash);
    }
    theLastHash = hash;
    calcNow = false;
    hashOK = true;
}

const getPayouts = (hash) => {
    if (calcNow) {
        return;
    }
    calcNow = true;
    const hashs = [];
    let calcHash = hash;
    hashOK = false;
    for (let i = 0; i < payoutArraySize; i++) {
        if (theLastHash == calcHash) {
            hashOK = true;
            break;
        }
        hashs.unshift(calcHash);
        calcHash = generateHash(calcHash);
    }
    for (let i = 0; i < hashs.length; i++) {
        const odds = crashPointFromHash(hashs[i]);
        payoutArray.unshift(odds);
        calcHash = generateHash(calcHash);
    }
    if (hashOK) {
        theLastHash = hash;
    }
    payoutArray.pop();
    calcNow = false;
}

const calcStatistic1 = (mul, preIdx, startIdx, show) => {
    const states = [];
    let count = 0;
    let i = startIdx ?? 0;
    let idx = preIdx ?? 0;
    let slength = 12 + idx.toString().length;
    const stdpercent = 100 / mul;
    if (show) {
        process.stdout.write(`${mul.toFixed(2).padStart(6, ' ')}`);
        process.stdout.write(` (${preIdx}) : `.yellow);
    }
    for (let num in percentNums) {
        for (; (idx < percentNums[num]) && (i < payoutArraySize); i++, idx++) {
            if (payoutArray[i] >= mul) {
                count++;
            }
        }
        const res = count / percentNums[num] * 100;
        states.push(res);
        if (show) {
            let sout = `${res.toFixed(0)}`;
            sout = count.toString();
            let slen = sout.toString().length + 2 + percentNums[num].toString().length + 2;
            slength += slen;
            if (slength + 2 < stdColumns) {
                process.stdout.write(`${percentNums[num]}: `.magenta);
                if (res < stdpercent) {
                    process.stdout.write(sout.red);
                } else if (res > stdpercent) {
                    process.stdout.write(sout.yellow);
                } else {
                    process.stdout.write(sout.green);
                }
                process.stdout.write(', '.gray);
            }
        }
    }
    if (show) {
        log("");
    }
    return states;
}

const calcStatistic2 = (mul, mul1, show) => {
    for (let i = 0; i < percentNums2.length; i++) {
        const periodNum = mul * percentNums2[i];
        let count = 0;
        let showIdx = 0;
        const stdpercent = 100 / mul;
        let slength = 18;
        if (show) {
            process.stdout.write(`${mul.toFixed(2).padStart(6, ' ')}`.blue);
            process.stdout.write(' ~ '.red);
            process.stdout.write(`${mul1 ? mul1.toFixed(2).padStart(6, ' ') : "      "}`.yellow);
            process.stdout.write(` (${periodNum}) : `.blue);
        }
        slength += 2 + periodNum.toString().length;
        for (let j = 0; j < payoutArraySize; j++) {
            if (j % periodNum == 0) {
                if (j > 0) {
                    let slen = count.toString().length + 2;
                    slength += slen;
                    if (show && showIdx < showNumber && slength < stdColumns) {
                        const res = count / periodNum * 100;
                        let sout = `${res.toFixed(0)}`;
                        sout = count.toString();
                        if (res < stdpercent) {
                            process.stdout.write(sout.red);
                        } else if (res > stdpercent) {
                            process.stdout.write(sout.yellow);
                        } else {
                            process.stdout.write(sout.green);
                        }
                        process.stdout.write(', '.gray);
                        showIdx++;
                    }
                }
                count = 0;
            }
            if (payoutArray[j] >= mul && (payoutArray[j] < mul1 || mul1 == 0)) {
                count++;
            }
        }
        if (show) {
            log("");
        }
    }
}

const analysis = (mul, mul1, show) => {
    let cnt = 0;
    let idx = 0;
    let total = 0;
    let total1 = 0;
    let last = false;
    let first = payoutArray[0] < mul;
    let slength = 16;
    if (show) {
        process.stdout.write(`${mul.toFixed(2).padStart(6, ' ')}`);
        process.stdout.write(' ~ '.red);
        process.stdout.write(`${mul1 ? mul1.toFixed(2).padStart(6, ' ') : "      "} : `.yellow);
    }
    let showIdx = 0;
    for (let i = 0; idx < payoutArraySize; i++) {
        cnt = 0;
        for (let j = idx; j < payoutArraySize; j++, idx++, cnt++) {
            if (payoutArray[idx] >= mul && (payoutArray[idx] < mul1 || mul1 == 0)) {
                break;
            }
        }
        idx++;
        const more = cnt > mul;
        if (more) {
            total++;
        } else {
            total1++;
        }
        let slen = cnt.toString().length + 2;
        slength += slen;
        if (show && showIdx < showNumber && slength + 12 < stdColumns) {
            if (more || first) {
                process.stdout.write(last ? cnt.toString().bgRed.yellow : cnt.toString().red);
                last = true;
                first = false;
            } else {
                process.stdout.write(cnt.toString().green);
                last = false;
            }
            process.stdout.write(', ');
            showIdx++;
        }
    }
    if (show) {
        process.stdout.write(good(`${total1}`));
        process.stdout.write(':');
        process.stdout.write(warning(`${total}`));
        log("");
    }
}

const showAsGraph = (mul, showNum, showRuller, highDot, lowDot, std2) => {
    if (highDot == undefined) {
        highDot = "'";
    }
    if (lowDot == undefined) {
        lowDot = '.';
    }
    if (std2 == undefined) {
        std2 = true;
    }
    let length = Math.floor(stdColumns / mul) * mul;
    showNum = Math.round(showNum / length) * length;
    for (let i = 0; i < showNum && i < payoutArraySize; i++) {
        let dot = lowDot;
        if (payoutArray[i] < mul) {
            dot = lowDot;
        } else {
            dot = highDot;
        }
        if (i && i % length == 0) {
            log("");
        }
        if (std2) {
            if (payoutArray[i] < 2) {
                process.stdout.write(dot.red);
            } else if (payoutArray[i] < 10) {
                process.stdout.write(dot.green);
            } else {
                process.stdout.write(dot.yellow);
            }
        } else {
            if (payoutArray[i] < mul) {
                process.stdout.write(dot.red);
            } else {
                process.stdout.write(dot.green);
            }
        }
    }
    log("");
    if (showRuller) {
        for (let i = 0; i < stdColumns && i < payoutArraySize; i += 10) {
            let num = i + 1;
            let dot = num.toString().padEnd(10, ' ');
            process.stdout.write(dot.yellow);
        }
    }
    log("\n");
}

const server = http.createServer(app);
server.listen(7777, () => {
})

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

io.on("connection", (socket) => {
});

// app.use(cors());
// app.use(express.json());
app.use(
    cors({
        origin: '*'
    })
);

app.post("/bc/test", async (req, res, next) => {
    const hash = req.body;
    const result = crashPointFromHash(hash);

    res.send(result);
});

app.get('/get/hash', async (req, res) => {
    res.send(theLastHash);
});

var lastGameId = 0;
app.get('/add/hash', async (req, res) => {
    const hash = req.query.hash;
    let odds = req.query.odds;
    let gameid = Number(req.query.gameid);
    const payout = Number(req.query.payout);
    const count = Number(req.query.count);
    if (theLastHash == hash || gameid <= lastGameId) {
        log(gameid, hash.cyan.bgBlue, Number(odds) < 2 ? odds.red.bgWhite : odds.green.bgWhite, `${new Date().toLocaleString()}`.white);
        hashOK = true;
        if (payout == undefined) {
            res.end();
            return;
        }
    }
    io.emit('refresh', hash);
    // console.clear();
    log(gameid, hash.blue.bgGreen, Number(odds) < 2 ? odds.red.bgWhite : odds.green.bgWhite, `${new Date().toLocaleString()}`.white.bgBlue);
    if (calcNow) {
        res.end();
        return;
    }
    if (hash == undefined) {
        res.end();
        return;
    }
    if (theLastHash == '') {
        initPayouts(req.query.hash);
    }
    else {
        getPayouts(req.query.hash);
    }

    if (payout == undefined || count == undefined) {
        res.end();
        return;
    }

    const checkpoint = [
        [1, 1, 0, 5],
        [payout * 1.5, 1, 15, 15],
        [payout * 3, 2, 35, 30],
        [payout * 4, 2, 20, 15],
        [payout * 4.5, 3, 15, 10],
        [payout * 5, 4, 10, 5],
        [payout * 10, 9, 15, 10],
        [payout * 11, 10, 10, 5],
    ]
    let i = 1;
    let rcount = 0;
    let till = 0;
    let weight = 0;
    for (let ckn = 0; ckn < checkpoint.length; ckn++) {
        till = Math.round(checkpoint[ckn][0]);
        for (; i < till; i++) {
            if (payoutArray[i] >= payout) {
                rcount++;
            }
        }

        if (rcount < checkpoint[ckn][1]) {
            weight += checkpoint[ckn][2];
        } else if (rcount == checkpoint[ckn][1]) {
            weight += checkpoint[ckn][3];
        } else {
        }
    }
    let remain = Math.max(5 - rcount + (weight - 60) / 10, count);
    log(payout, count, rcount, remain, weight);
    if (isNaN(remain)) {
        remain = theLastHash;
    }
    if (weight > 60) {
        res.send(`${remain}`);
    } else {
        res.send('0');
    }

    // for (let i = 0; i < multiples.length; i++) {
    //     calcStatistic2(multiples[i][0], multiples[i][1], multiples[i][4]);
    //     for (let j = 3; j >= 0; j--) {
    //         calcStatistic1(multiples[i][0], j, multiples[i][3]);
    //     }
    //     analysis(multiples[i][0], multiples[i][1], multiples[i][2]);
    //     showAsGraph(multiples[i][0], stdColumns, true);
    // }
    // for (let j = 3; j >= 0; j--) {
    //     calcStatistic1(2, j, 0, true);
    // }
    // showAsGraph(2, 5000, true, '$', '_', false)
    // for (let j = 3; j >= 0; j--) {
    //     calcStatistic1(10, j, 0, true);
    // }
    // analysis(2, 0, true);
    // showAsGraph(2, 1000, true, '$', '_', false)
    // log(payoutArray);
    if (!hashOK) {
        log("\n");
        log("\n");
        log("BC.CRASH GAME IS FAKE!!!!!!!!!!!!!!!!!".red);
        log("\n");
        log("\n");
    }
    return;
    const inputData = [];
    const outputData = [];
    for (let i = 1; i <= 100; i++) {
        const ida = [];
        for (let j = 0; j < mlSize; j++) {
            ida.push(payoutArray[i + j]);
        }
        inputData.push(ida);
        outputData.push([payoutArray[i - 1]]);
    }
    const trainingData = tf.tensor2d(inputData);
    const trainingLabels = tf.tensor2d(outputData);
    // await trainModel(predictModel, trainingData, trainingLabels);
    await predictModel.fit(trainingData, trainingLabels, { epochs: mlSize });

    const ida = [];
    for (let j = 0; j < mlSize; j++) {
        ida.push(payoutArray[j]);
    }
    const prediction = predictModel.predict(tf.tensor2d([ida])); // The rest of your 32 variables go here
    const oarray = prediction.dataSync();
    console.log(oarray);
    // saveModel(predictModel, file_model);
})

process.stdout.on('resize', function () {
    console.clear();
    stdColumns = process.stdout.columns;
});

(async () => {
    if (existsSync(file_model)) {
        predictModel = await loadModel(file_model);
    }
})();