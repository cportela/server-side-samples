const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const jade = require("jade");

module.exports = function (app, config) {
  app.set("port", config.port);

  // view engine setup
  app.set("views", path.join(config.root, "views"));
  app.set("view engine", "jade");

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(config.root, "public")));
  app.use(cors());
};
