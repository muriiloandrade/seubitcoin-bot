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

  const url = process.env.COIN_API;
  const getCryptoDate = async url => {
    try {
      const response = await axios.get(url);
      const data = response.data;

      let btcBrlPrice = data.BTC.quotes.BRL.price.toLocaleString("pt-BR", {
        maximumFractionDigits: 2
      });

      let btcUsdPrice = data.BTC.quotes.USD.price.toLocaleString("pt-BR", {
        maximumFractionDigits: 2
      });

      let mov = "";

      if (prevValue === undefined) mov = "";
      else if (btcBrlPrice > prevValue) mov = "Bitcoin subiu!\n";
      else if (btcBrlPrice === prevValue) mov = "Bitcoin se manteve estável!\n";
      else mov = "Bitcoin caiu!\n";

      prevValue = btcBrlPrice;

      const tweetText = {
        status: `${mov}🇧🇷💵 BTC/BRL R$ ${btcBrlPrice}\n🇺🇸💵 BTC/USD $ ${btcUsdPrice}`
      };

      await T.postStatusesUpdate(tweetText);
    } catch (error) {
      console.log("Something went wrong:\n" + error);
    }
  };

  getCryptoDate(url);
});

job.start();
