require("dotenv").config();
const Twit = require("promised-twit");
const axios = require("axios");
const CronJob = require("cron").CronJob;

let prevValue;

const job = new CronJob("*/10 * * * *", () => {
  console.log("Posting a new tweet!");
  const T = new Twit({
    consumer_key: process.env.CKEY,
    consumer_secret: process.env.CSCRT,
    access_token: process.env.ATKN,
    access_token_secret: process.env.ATKSCRT,
    timeout_ms: 60 * 1000
  });

  const getCryptoDate = async url => {
    try {
      // Making two request 'cause CMC's API doesn't allow 2 convert options in free plan
      const responseBRL = await axios({
        method: "get",
        url,
        responseType: "json",
        headers: { "X-CMC_PRO_API_KEY": process.env.CMC_KEY },
        params: {
          id: "1", // BTC CMC's ID
          convert_id: "2783" // Brazilian Real CMC's ID
        }
      });

      const responseUSD = await axios({
        method: "get",
        url,
        responseType: "json",
        headers: { "X-CMC_PRO_API_KEY": process.env.CMC_KEY },
        params: {
          id: "1", // BTC CMC's ID
          convert_id: "2781" // US Dollar CMC's ID
        }
      });

      const srcBRL = responseBRL.data.data;
      const srcUSD = responseUSD.data.data;

      let btcBrlPrice = srcBRL[1].quote[2783].price.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      let btcUsdPrice = srcUSD[1].quote[2781].price.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      let movPercent = srcBRL[1].quote[2783].percent_change_24h.toFixed(2);

      let mov = "";

      if (prevValue === undefined) mov = "";
      else if (btcBrlPrice > prevValue) mov = "Bitcoin subiu!\n";
      else if (btcBrlPrice === prevValue) mov = "Bitcoin se manteve estável!\n";
      else mov = "Bitcoin caiu!\n";

      prevValue = btcBrlPrice;

      const tweetText = {
        status: `${mov}🇧🇷💵 BTC/BRL R$ ${btcBrlPrice}\n🇺🇸💵 BTC/USD $ ${btcUsdPrice}\nVariação 24h(%): ${
          Math.sign(movPercent) == 1 ? "+" : ""
        }${movPercent}`
      };

      await T.postStatusesUpdate(tweetText);
    } catch (error) {
      console.log("Something went wrong:\n" + error);
    }
  };

  const url = process.env.COIN_URL;
  getCryptoDate(url);
});

job.start();
