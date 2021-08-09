const express = require("express");
const app = express();
const mongodb = require("mongodb");
const axios = require("axios");
const Redis = require("ioredis");
const redis = new Redis({
  port: 6379,
  host: "redis",
  db: 0,
});

//Weather API
const baseUrl = "http://api.openweathermap.org/data/2.5/weather?";
const apiKey = "af54222a038bf33ff8ad9b74fe016a32";
const city = "Barcelona";
const weatherData = {
  name: "",
  temp: 0,
  status: "",
};

const config = {
  DB: "mongodb://mongo:27017",
};

const PORT = 3000;
const client = mongodb.MongoClient;
var dbo;

client.connect(config.DB, function (err, db) {
  if (err) {
    console.log(err);
    console.log("database is not connected");
  } else {
    console.log("connected!!");
    dbo = db.db("midb");
  }
});

app.get("/", function (req, res) {
  res.send("OpenWeather API call, insert and get data from Mongo DB");
});

app.get("/apicall", (req, res) => {
  axios
    .get(`${baseUrl}q=${city}&appid=${apiKey}&units=metric`)
    .then((response) => {
      // handle
      res.send(response.data);
      weatherData.name = response.data.name;
      weatherData.temp = response.data.main.temp.toFixed();
      weatherData.status = response.data.weather[0].main;
    })
    .catch((error) => {
      res.send(error);
    });
});

/*Test */
//app.get("/response", (req, res) => res.send({ weatherData }));

app.get("/get", function (req, res) {
  let data = dbo
    .collection("citiesForecast")
    .find({})
    .toArray((err, result) => {
      if (err) throw err;
      res.json(result);
    });
});

app.get("/insert", function (req, res) {
  var dataToInsert = {
    _id: Math.floor(Math.random() * 100),
    name: weatherData.name,
    temp: weatherData.temp,
    status: weatherData.status,
  };
  let data = dbo
    .collection("citiesForecast")
    .insertOne(dataToInsert, (err, result) => {
      if (err) throw err;
      res.json(result);
    });
});

app.get("/cache-set", function (req, res) {
  redis.set("example", apiKey, function (err, result) {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

app.get("/cache-get", function (req, res) {
  redis.get("example", function (err, result) {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

app.listen(PORT, function () {
  console.log("Your node js server is running on PORT:", PORT);
});
