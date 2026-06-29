const dotenv = require("dotenv");
const mongoose = require('mongoose');
dotenv.config();

const express = require("express");
const cors = require("cors");
const productRoute = require("./routes/productRoute.js");

const app = express();

app.use(cors());
app.use(express.json());

let isConnected = false;

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
}

app.use((req, res, next) => {
  if (!isConnected) {
    connectToMongoDB();
  }
  next();
})

app.use("/api/product", productRoute);

module.exports = app;