"use strict";
const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const ServiceError = require("../models/ServiceError");
const appUtils = require("../models/appUtils");
const BaseCtrl = require("./base-ctrl");

function UsersCtrl() {
  if (typeof UsersCtrl.Instance === "object") return UsersCtrl.Instance;

  let self = this;

  self.getAllUsers = (request, response) => {
    const loggedUserId = request.userId;

    if (request.body != undefined) {
      let search = self.jsonTryParse(request.body);

      return _getAllUsers(loggedUserId, search)
        .then(function complete(results) {
          response.status(HttpCode.OK).send(results);
          return results;
        })
        .catch(function catchFn(err) {
          if (err instanceof ServiceError) {
            logger.error(err.message);
            response.status(HttpCode.BAD_REQUEST).send(err);
            return Promise.reject(err);
          } else {
            let serviceError = new ServiceError(
              ServiceError.UncaughtException,
              0,
              self.xmsg(err)
            );
            logger.error(serviceError.message);
            response.status(HttpCode.INTERNAL_SERVER_ERROR).send(serviceError);
            return Promise.reject(serviceError);
          }
        });
    } else {
      let serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required arguments missing"
      );
      logger.error(serviceError.message);
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }
  };

  self.getUser = (request, response) => {
    // Validate required payload data
    if (!(request.params.id > 0)) {
      let serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "User Id is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    let search = self.jsonTryParse(request.body);

    return _getUser(request.params.id, search)
      .then(function complete(result) {
        response.status(HttpCode.OK).send(result);
        return result;
      })
      .catch(function catchFn(err) {
        if (err instanceof ServiceError) {
          logger.error(err.message);
          response.status(HttpCode.BAD_REQUEST).send(err);
          return Promise.reject(err);
        } else {
          let serviceError = new ServiceError(
            ServiceError.UncaughtException,
            0,
            self.xmsg(err)
          );
          logger.error(serviceError.message);
          response.status(HttpCode.INTERNAL_SERVER_ERROR).send(serviceError);
          return Promise.reject(serviceError);
        }
      });
  };

  self.updateUser = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      let serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "User information is requiredr"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _updateUser(loggedUserId, request.body)
      .then(function complete(result) {
        response.status(HttpCode.OK).send(result);
        return result;
      })
      .catch(function catchFn(err) {
        if (err instanceof ServiceError) {
          logger.error(err.message);
          response.status(HttpCode.BAD_REQUEST).send(err);
          return Promise.reject(err);
        } else {
          let serviceError = new ServiceError(
            ServiceError.UncaughtException,
            0,
            self.xmsg(err)
          );
          logger.error(serviceError.message);
          response.status(HttpCode.INTERNAL_SERVER_ERROR).send(serviceError);
          return Promise.reject(serviceError);
        }
      });
  };

  self.deleteUser = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      let serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "User information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _deleteUser(request.body)
      .then(function complete(result) {
        response.status(HttpCode.OK).send(result);
        return result;
      })
      .catch(function catchFn(err) {
        if (err instanceof ServiceError) {
          logger.error(err.message);
          response.status(HttpCode.BAD_REQUEST).send(err);
          return Promise.reject(err);
        } else {
          let serviceError = new ServiceError(
            ServiceError.UncaughtException,
            0,
            self.xmsg(err)
          );
          logger.error(serviceError.message);
          response.status(HttpCode.INTERNAL_SERVER_ERROR).send(serviceError);
          return Promise.reject(serviceError);
        }
      });
  };

  function _getAllUsers(loggedUserId, search) {
    const tableName = "users";
    const likeColumns = null;

    // Init the result object
    const propName = search.resultProperty || tableName;
    const resultsObj = {};
    resultsObj[propName] = { results: [] };

    // Get the default sql command text
    let commandText = self.getUsersCommandText(search);

    // Parse the search and modified the command text
    commandText = self.parseSearch(
      commandText,
      search,
      likeColumns,
      "modified_at",
      function getSorting(sortType) {
        let sorting = null;
        if (sortType) {
            sorting = `${tableName}.firstName ASC, ${tableName}.lastName ${sortType}`;
        }
        return sorting;
      }
    );

    // Execute command text
    return self.db.sqlQuery(commandText).the(
      (results) => {
        if (results && results.length > 0) {
          const users = {};
          const promises = [];

          if (appUtils.parseBool(search.returnTotal)) {
            promises.push(
              self.qry.getCount(
                self.db,
                tableName,
                search.where,
                search.timestamp,
                search.searchMode,
                search.criteria,
                likeColumns
              )
            );
          }

          results.forEach((user) => {
            users[user.id] = {};
            if (self.qry.isValidString(search.columns)) {
              users[user.id] = user;
            }
            resultsObj[propName].results.push(users[user.id]);
          });

          return Promise.all(promises).then(
            function complete(promiseResults) {
              promiseResults.forEach(function (promise) {
                if (promise) {
                  // Set the users
                  if (promise.name) {
                    if (promise.id) {
                      users[promise.id][promise.name] = {};
                      // Set the creator or user value
                      if (promise.name == "creator") {
                        users[promise.id][promise.name] = promise.result;
                      } else {
                        users[promise.id][promise.name].results =
                          promise.result;
                      }
                      // Set the count of object related to user
                      if (promise.count >= 0) {
                        users[promise.id][promise.name].total = promise.count;
                      }
                    } else {
                      users[promise.name] = {};
                      users[promise.name].results = promise.result;
                    }
                  }
                  // Set the count of users
                  if (promise.count >= 0 && !promise.name) {
                    resultsObj[propName].total = promise.count;
                  }
                }
              });

              return resultsObj;
            },
            function error(err) {
              logger.error(err.message);
              return Promise.reject(new ServiceError(1, 1, err.message));
            }
          );
        }
        // Users not found
        return resultsObj;
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _getUser(id, search) {
    // Users query
    let commandText = self.getUsersCommandText(search);
    // validate if allow show
    commandText += " WHERE users.id = " + id;
    return self.db.sqlQuery(commandText).then(
      (users) => {
        if (users && users.length > 0) {
          return users[0];
        } else {
          return Promise.reject(new ServiceError(1, 1, "User was not found"));
        }
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _updateUser(loggedUserId, user) {
    function _transaction(connection) {
      const now = new Date();
      const newUser = Object.assign({}, user);

      newUser.modifier_id = loggedUserId;
      newUser.modified_at = now;

      delete newUser.id;
      delete newUser.is_fictitious;

      const model = self.om.getTableModel("users");
      const qry = model.getUpdate(newUser);
      const commandText = `UPDATE users ${qry.sqlStmt} WHERE id = ${user.id}`;

      return self.db.conQuery(connection, commandText, qry.params);
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = { id: user.id, results: results.affectedRows > 0 };
        if (resultObj.results == false) {
          logger.warn("User " + user.id + " was not updated.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Updating user profile: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _deleteUser(user) {
    function _transaction(connection) {
      const commandText = `DELETE users WHERE id = ${user.id}`;

      return self.db
        .conQuery(connection, commandText)
        .then((results) => {
          let resultObj = { id: user.id, results: results.affectedRows > 0 };
          if (resultObj.results == false) {
            logger.warn("User " + user.id + " was not deleted.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = Object.assign({}, results, { created: user.created });
        if (resultObj.results == false) {
          logger.warn("User " + user.id + " was not deleted.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Deleting user profile: ${self.xmsg(err)}`)
        );
      }
    );
  }

  UsersCtrl.Instance = this;
}

UsersCtrl.prototype = new BaseCtrl();

module.exports = UsersCtrl;
