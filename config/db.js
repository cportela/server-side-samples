"use strict";

const SqlFactory = require("./SqlFactory");

const defaultOpts = {
  host: "us-cdbr-iron-east-01.cleardb.net",
  database: "heroku_123",
  user: "123",
  password: "456",
};

function db(options) {
  options = options || defaultOpts;

  let sql = null;
  return () => {
    if (!sql) {
      sql = new SqlFactory(
        options.host,
        options.database,
        options.user,
        options.password,
        options.port
      );
    }
    return sql;
  };
}

module.exports = db()();
