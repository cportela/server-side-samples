var path = require("path"),
  rootPath = path.normalize(__dirname + "/.."),
  env = process.env.NODE_ENV || "development";

const constants = {
  development: {
    host: "http://localhost",
    root: rootPath,
    app: {
      name: "sample",
    },
    port: 39824,
    token_secret:
      process.env.TOKEN_SECRET || "123",
  },

  test: {
    root: rootPath,
    app: {
      name: "sample",
    },
    port: 39824,
    token_secret:
      process.env.TOKEN_SECRET || "123",
  },

  production: {
    root: rootPath,
    app: {
      name: "sample",
    },
    port: 39824,
    token_secret:
      process.env.TOKEN_SECRET || "123",
  },
};

module.exports = constants[env];
