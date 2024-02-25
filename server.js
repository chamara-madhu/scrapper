const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

// app
const app = express();

// load routers
const scrapperRoutes = require("./routes/api/scrapperRoutes");

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// cors
app.use(cors());

// routes middleware
app.use("/v1/api/scrapper", scrapperRoutes);

// port
const PORT = process.env.PORT || 8000;

// run server
app.listen(PORT, () => console.log(`server is running in Port ${PORT}`));
