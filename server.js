const { readdirSync } = require("fs");
const path = require("path");
const express = require('express');
const app = express();
const helmet = require('helmet');
const mongoose = require("mongoose");
require("dotenv").config();
const morgan = require("morgan");
const cors = require('cors');

const cookieParser = require("cookie-parser");


// middlewares
app.use(helmet())
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cors());



// routes middleware
readdirSync("./routes").map(r => app.use("/api/v1", require(`./routes/${r}`)))

// server
const URI = process.env.DATABASE || 'mongodb+srv://<username>:<password>@cluster0.dfxgpct.mongodb.net/penvent?retryWrites=true&w=majority';
const port = process.env.PORT || 4000;

mongoose
  .connect(URI, {
    user: process.env.DB_USER,
    pass: process.env.PASS,
    autoIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log('Mongoose connected');
      console.log(`The app is listening on http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));