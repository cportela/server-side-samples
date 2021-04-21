"use strict";
const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const ServiceError = require("../models/ServiceError");

const BaseCtrl = require("./base-ctrl");

function EventTypesCtrl() {
  if (typeof EventTypesCtrl.Instance === "object")
    return EventTypesCtrl.Instance;

  var self = this;

  self.getAllEventTypes = (request, response) => {
    return _getAllEventTypes()
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
          var serviceError = new ServiceError(
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

  self.getEventType = (request, response) => {
    // Validate required payload data
    if (!(request.params.id > 0)) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event type Id is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _getEventType(request.params.id)
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
          var serviceError = new ServiceError(
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

  self.insertEventType = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event type information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _insertEventType(loggedUserId, request.body)
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
          var serviceError = new ServiceError(
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

  self.updateEventType = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event type information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _updateEventType(loggedUserId, request.body)
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
          var serviceError = new ServiceError(
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

  self.deleteEventType = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event type information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _deleteEventType(request.body)
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
          var serviceError = new ServiceError(
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

  function _getAllEventTypes(userId) {
    // EventTypes query
    const userCols = `E.*`;
    let commandText = `SELECT ${userCols} FROM event_types AS E WHERE E.user_id = '${userId}'`;
    return self.db.sqlQuery(commandText).then(
      (eventTypes) => {
        return eventTypes;
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _getEventType(id) {
    // EventTypes query
    const userCols = `E.*`;
    let commandText = `SELECT ${userCols} FROM event_types AS E WHERE E.id = ${id}`;
    return self.db.sqlQuery(commandText).then(
      (eventTypes) => {
        if (eventTypes && eventTypes.length > 0) {
          return eventTypes[0];
        } else {
          return Promise.reject(
            new ServiceError(1, 1, "No event types were found")
          );
        }
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _insertEventType(loggedUserId, eventType) {
    function _transaction(connection) {
      const now = new Date();
      const newEventType = Object.assign({}, eventType);

      newEventType.creator_id = loggedUserId;
      newEventType.created_at = now;

      delete newEventType.id;

      const model = self.om.getTableModel("event_types");
      const qry = model.getInsert(newEventType);
      const commandText = `INSERT INTO event_types ${qry.sqlStmt}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          eventType.id = results.insertId;

          let resultObj = {
            newId: eventType.id,
            inserted: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn(
              "Event type with id " + eventType.id + " was not created."
            );
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        if (results && results.id) {
          return _getEventType(results.id);
        }
        return null;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Creating new event type: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _updateEventType(loggedUserId, eventType) {
    function _transaction(connection) {
      const now = new Date();
      const newEventType = Object.assign({}, eventType);

      newEventType.modifier_id = loggedUserId;
      newEventType.modified_at = now;

      delete newEventType.id;
      delete newEventType.is_fictitious;

      const model = self.om.getTableModel("event_types");
      const qry = model.getUpdate(newEventType);
      const commandText = `UPDATE event_types ${qry.sqlStmt} WHERE id = ${eventType.id}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          let resultObj = {
            id: eventType.id,
            results: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn("Event type " + eventType.id + " was not updated.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        if (results && results.id) {
          return _getEventType(results.id);
        }
        return null;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Updating event type: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _deleteEventType(eventType) {
    function _transaction(connection) {
      const commandText = `DELETE event_types WHERE id = ${eventType.id}`;

      return self.db
        .conQuery(connection, commandText)
        .then((results) => {
          let resultObj = {
            id: eventType.id,
            results: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn(
              "Event type " + eventType.id + " was not deleted."
            );
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = Object.assign({}, results, {
          created: eventType.created,
        });
        if (resultObj.results == false) {
          logger.warn("Event type " + eventType.id + " was not deleted.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Deleting event type: ${self.xmsg(err)}`)
        );
      }
    );
  }

  EventTypesCtrl.Instance = this;
}

EventTypesCtrl.prototype = new BaseCtrl();

module.exports = EventTypesCtrl;
