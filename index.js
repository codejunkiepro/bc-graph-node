const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const { crashPointFromHash, generateHash } = require("./hash");
const { Sequelize, DataTypes } = require("sequelize");
var bodyParser = require("body-parser");
const moment = require("moment-timezone");

const path = require("path");

var colors = require("colors");

colors.enable();

// Define the Tokyo timezone
const TOKYO_TIMEZONE = "Asia/Tokyo";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

const History = sequelize.define("History", {
  ip: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
  imsi: {
    type: DataTypes.STRING,
  },
  strength: {
    type: DataTypes.STRING,
  },
  dataUsage: {
    type: DataTypes.STRING,
  },
  time: {
    type: DataTypes.DATE,
  },
});

const IpList = sequelize.define("IpList", {
  ip: {
    type: DataTypes.STRING,
  },
});

sequelize.sync();

app.use(express.static(__dirname + "/public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("No shop provide");
});

app.get("/bc-graph", async (req, res) => {
  res.sendFile(path.join(__dirname, "/public/bc-graph.html"));
});

app.get("/ip-list", async (req, res) => {
  res.sendFile(path.join(__dirname, "/public/iplist.html"));
});

app.get("/rb-report", async (req, res) => {
  res.sendFile(path.join(__dirname, "/public/rbreport.html"));
});

const log = console.log;

var theLastHash = "";

const server = http.createServer(app);
server.listen(7777, () => { });

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => { });

app.use(
  cors({
    origin: "*",
  })
);

app.post("/bc/test", async (req, res, next) => {
  const hash = req.body;
  const result = crashPointFromHash(hash);

  res.send(result);
});

app.get("/get/hash", async (req, res) => {
  res.send(theLastHash);
});

app.post("/get/rb-report", async (req, res) => {
  // console.log(req.query);
  // res.sendStatus(200)
  let result = req.body;
  console.log(result);
  if (result.ip) {
    let dataUsage = !result.dataUsage ? "0" : result.dataUsage;
    const isMb = dataUsage !== "0" && dataUsage.includes("MB") ? true : false;
    dataUsage = Number(dataUsage.replace("GB", "").replace("MB", ""));
    if (isMb) dataUsage = dataUsage / 1024;
    result = {
      ...result,
      type: result.type == "5G" ? 5 : result.type == "4G" ? 4 : "",
      strength:
        result.strength && result.strength.includes("dBm")
          ? result.strength.replace("dBm", "")
          : "",
      dataUsage: dataUsage.toFixed(2),
    };
    await History.create({
      ...result,
    });
  }
  res.sendStatus(200);
});

app.get("/api/ips", async (req, res) => {
  const ips = await IpList.findAll({});

  return res.send(ips);
});

app.post("/api/ip", async (req, res) => {
  // console.log(req.body);
  // // res.send()
  const { ip } = req.body;

  await IpList.create({
    ip: ip,
  });

  res.send({});
});

app.delete("/api/ip", async (req, res) => {
  // console.log(req.body);
  // // res.send()
  const { id } = req.body;

  await IpList.destroy({
    where: {
      id: id,
    },
  });

  res.send({});
});

app.post("/get/all-ips", async (req, res) => {
  // console.log(req.body);
  const { ips } = req.body;
  for (let ip of ips) {
    await IpList.create({ ip: ip });
  }
  res.sendStatus(200);
});

app.get("/api/last-data", async (req, res) => {
  const ips = await IpList.findAll({});
  const { date } = req.query;
  // const selectedDate = new Date(date);
  // Convert the input date to Tokyo timezone and get the start of the day
  const selectedDate = moment.tz(date, TOKYO_TIMEZONE).startOf("day").toDate();
  const nextDate = moment
    .tz(selectedDate, TOKYO_TIMEZONE)
    .add(1, "day")
    .toDate();
  // Retrieve the history data for the selected date in Tokyo timezone
  const histories = await sequelize.query(
    `
        SELECT *
        FROM Histories
        WHERE time >= ? AND time < ?
        ORDER BY time DESC;
    `,
    {
      replacements: [selectedDate, nextDate],
    }
  );

  const result = ips.map((item) => {
    const ip = item.ip;
    const type = item.type;
    const ipHistory = histories[0].filter((row) => row.ip == ip);

    let maxUsage = 0;

    ipHistory.forEach((ele) => {
      let dataUsage = ele.dataUsage;
      const isMb = dataUsage && dataUsage.includes("MB");
      dataUsage = !dataUsage
        ? 0
        : dataUsage.replace("GB", "").replace("MB", "");
      if (isMb) {
        dataUsage /= 1024;
      }
      if (maxUsage < Number(dataUsage)) {
        maxUsage = Number(dataUsage);
      }
    });

    return {
      ip: ip,
      dataUsage: maxUsage,
    };
  });

  res.send(result);
});

app.get("/api/today-report", async (req, res) => {
  const { date } = req.query;
  // const selectedDate = new Date(date);
  // Convert the input date to Tokyo timezone and get the start of the day
  const selectedDate = moment.tz(date, TOKYO_TIMEZONE).startOf("day").toDate();
  const nextDate = moment
    .tz(selectedDate, TOKYO_TIMEZONE)
    .add(1, "day")
    .toDate();
  // Retrieve the history data for the selected date in Tokyo timezone
  const histories = await sequelize.query(
    `
        SELECT *
        FROM Histories
        WHERE time >= ? AND time < ?
        ORDER BY time DESC;
    `,
    {
      replacements: [selectedDate, nextDate],
    }
  );

  // Retrieve the list of IPs
  const ips = await IpList.findAll({});

  const result = ips.map((item) => {
    const ip = item.ip;

    // Filter history records for the current IP
    const ipHistory = histories[0].filter((row) => row.ip == ip);

    // Get the dataUsage values, converting to float and filtering out zeroes
    const dataUsages = ipHistory
      .map((row) => parseFloat(row.dataUsage || 0))
      .filter((usage) => usage > 0);

    // Compute the max and min dataUsage, ignoring zeroes
    const maxDataUsage = Math.max(...dataUsages);
    const minDataUsage = Math.min(...dataUsages);

    // Calculate the usage difference
    const usage = (maxDataUsage - minDataUsage).toFixed(2);

    return {
      ip: ip,
      usage: usage,
    };
  });

  res.send(result);
});

app.get("/histories", async (req, res) => {
  try {
    const { date } = req.query;

    // Convert the input date to Tokyo timezone and get the start of the day
    const selectedDate = moment
      .tz(date, TOKYO_TIMEZONE)
      .startOf("day")
      .toDate();
    const nextDate = moment
      .tz(selectedDate, TOKYO_TIMEZONE)
      .add(1, "day")
      .toDate();

    // Get the current date and time in Tokyo timezone
    const currentTokyoDate = moment.tz(TOKYO_TIMEZONE);

    // Check if the selected date is today in Tokyo timezone
    const isToday = moment
      .tz(date, TOKYO_TIMEZONE)
      .isSame(currentTokyoDate, "day");

    let startDate, endDate;

    if (isToday) {
      // If the selected date is today, get the previous 24 hours of data
      startDate = moment.tz(TOKYO_TIMEZONE).subtract(24, "hours").toDate();
      endDate = currentTokyoDate.toDate();
    } else {
      // If the selected date is not today, use the start and end of the selected day
      startDate = selectedDate;
      endDate = nextDate;
    }

    // Retrieve the history data for the selected date or previous 24 hours
    const histories = await sequelize.query(
      `
      SELECT *
      FROM Histories
      WHERE time >= ? AND time < ?
      ORDER BY time DESC;
    `,
      {
        replacements: [startDate, endDate],
      }
    );

    // console.log(histories)

    const ips = await IpList.findAll({});
    let result = sortByIp(ips)
      // .sort((a, b) => a.ip - b.ip)
      .map((item) => {
        const ip = item.ip;
        const ipHistory = histories[0].filter((row) => row.ip == ip);
        // console.log(ipHistory)
        let imsi;
        let data = ipHistory.map((history) => {
          if (!imsi && history.imsi) {
            imsi = history.imsi;
          }

          return {
            ip: history.ip,
            type: history.type ? history.type : "",
            strength: history.strength ? history.strength : "",
            dataUsage: history.dataUsage
              ? Number(history.dataUsage).toFixed(2)
              : "",
            time: history.time,
          };
        });
        // const times = data[0].map(ele => ele.time);

        data = data.map((ele) => {
          // if()
          return {
            ...ele,
            imsi: imsi,
          };
        });

        return data;
      });

    const times = result[0].map((ele) => ele.time);
    // const updatedTime = moment(times)
    const dateType = "YYYY-MM-DD HH:mm";
    console.log(times.length, ">>>>>>>>>");
    result = result.map((item) => {
      return times.map((time) => {
        const updatedTime = moment(time).format(dateType)
        let ele = item.find((e) => {
          // e.time == time
          const eTime = moment(e.time).format(dateType)
          return updatedTime == eTime
        });
        ele = ele ? ele : { ip: item.ip };
        return ele;
      });
    });

    return res.send(result);
  } catch (error) {
    console.log(error);
    res.send([]);
  }
});

function sortByIp(arr) {
  return arr.sort((a, b) => {
    // Split the IPs into their components and convert them to numbers
    let aParts = a.ip.split(".").map(Number);
    let bParts = b.ip.split(".").map(Number);

    // Compare each part of the IP address
    for (let i = 0; i < aParts.length; i++) {
      if (aParts[i] < bParts[i]) return -1;
      if (aParts[i] > bParts[i]) return 1;
    }

    return 0; // IPs are equal
  });
}

var oldHash;
app.get("/add/hash", async (req, res) => {
  const hash = req.query.hash;
  if (hash === oldHash) {
    res.send("adsf");
    return;
  }
  oldHash = hash;
  let odds = req.query.odds;
  let gameid = Number(req.query.gameid);
  io.emit("refresh", hash);
  // console.clear();
  log(
    gameid,
    hash.blue.bgGreen,
    Number(odds) < 2 ? odds.red.bgWhite : odds.green.bgWhite,
    `${new Date().toLocaleString()}`.white.bgBlue
  );
  res.send("ok");
  return;
});

// (async () => {
//   const ips = await IpList.findAll({});
//   // console.log(ips)
//   const selectedDate = moment
//     .tz("2024-06-14", TOKYO_TIMEZONE)
//     .startOf("day")
//     .toDate();
//   const nextDate = moment
//     .tz(selectedDate, TOKYO_TIMEZONE)
//     .add(1, "day")
//     .toDate();
//   // Retrieve the history data for the selected date in Tokyo timezone
//   const histories = await sequelize.query(
//     `
//         SELECT *
//         FROM Histories
//         WHERE time >= ? AND time < ?
//         ORDER BY time DESC;
//     `,
//     {
//       replacements: [selectedDate, nextDate],
//     }
//   );

//   console.log(histories);
// })();
