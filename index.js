const express = require("express");
const app = express();
const mongodb = require("mongodb");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Redis = require("ioredis");
require("dotenv/config");
const redis = new Redis({
  port: 6379,
  host: "redis",
  db: 0,
});

//Weather API
const baseUrl = "http://api.openweathermap.org/data/2.5/weather?";
const apiKey = "af54222a038bf33ff8ad9b74fe016a32";

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

// POST API call and insert on DB
app.post("/sync-cities", (req, res) => {
  const cities = ["Barcelona", "Londres", "Paris", "Milan", "Berlin"];
  let tasks = [];

  cities.forEach((city) => {
    let task = axios.get(`${baseUrl}q=${city}&appid=${apiKey}&units=metric`);
    tasks.push(task);
  });

  Promise.all(tasks)
    .then((responses) => {
      let dataToInsert = [];

      responses.forEach((response) => {
        dataToInsert.push({
          _id: uuidv4(),
          name: response.data.name,
          temp: response.data.main.temp,
          status: response.data.weather[0].main,
        });
      });
      dbo.collection("cities").insertMany(dataToInsert, (err, result) => {
        if (err) {
          res.status(500).json(err);
        } else {
          res.status(201).json(result);
        }
      });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

// GET data from DB
app.get("/cities", (req, res) => {
  dbo
    .collection("cities")
    .find({})
    .toArray((err, result) => {
      if (err) throw err;
      res.json(result);
    });
});

// Get from DB by ID
app.get("/cities/:id", (req, res) => {
  let cityId = req.params.id;

  dbo.collection("cities").findById(cityId, (err, city) => {
    if (err)
      return res
        .status(500)
        .send({ menssage: `Error al realizar la petición: ${err}` });
    if (!city)
      return res.status(404).send({ message: `El producto no existe` });

    res.status(200).send({ city: city });
  });
});

// Redis Cache DB
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
