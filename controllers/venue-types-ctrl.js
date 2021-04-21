"use strict";
const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const ServiceError = require("../models/ServiceError");

const BaseCtrl = require("./base-ctrl");

function VenueTypesCtrl() {
  if (typeof VenueTypesCtrl.Instance === "object")
    return VenueTypesCtrl.Instance;

  var self = this;

  self.getAllVenueTypes = (request, response) => {
    return _getAllVenueTypes()
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

  self.getVenueType = (request, response) => {
    // Validate required payload data
    if (!(request.params.id > 0)) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required venue type Id"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _getVenueType(request.params.id)
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

  self.insertVenueType = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required venue type"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _insertVenueType(loggedUserId, request.body)
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

  self.updateVenueType = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      const serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required venue type"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _updateVenueType(loggedUserId, request.body)
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

  self.deleteVenueType = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required venue type"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _deleteVenueType(request.body)
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

  function _getAllVenueTypes() {
    // VenueTypes query
    const venueTypeCols = `VT.id,VT.name,VT.creator_id,VT.created_at,VT.modified_at,VT.modifier_id,VT.is_fictitious`;
    let commandText = `SELECT ${venueTypeCols} FROM venue_types AS VT`;
    return self.db.sqlQuery(commandText).then(
      (venueTypes) => {
        return venueTypes;
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _getVenueType(id) {
    // VenueTypes query
    const venueTypeCols = `VT.id,VT.name,VT.creator_id,VT.created_at,VT.modified_at,VT.modifier_id,VT.is_fictitious`;
    let commandText = `SELECT ${venueTypeCols} FROM venue_types AS VT WHERE VT.Id = ${id}`;
    return self.db.sqlQuery(commandText).then(
      (venueTypes) => {
        if (venueTypes && venueTypes.length > 0) {
          return venueTypes[0];
        } else {
          return Promise.reject(
            new ServiceError(1, 1, "Venue types were not found")
          );
        }
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _insertVenueType(loggedUserId, venueType) {
    function _transaction(connection) {
      const now = new Date();
      const newVenueType = Object.assign({}, venueType);

      newVenueType.creator_id = loggedUserId;
      newVenueType.created_at = now;

      delete newVenueType.id;

      const model = self.om.getTableModel("venue_types");
      const qry = model.getInsert(newVenueType);
      const commandText = `INSERT INTO venue_types ${qry.sqlStmt}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          venueType.id = results.insertId;

          let resultObj = {
            id: venueType.id,
            inserted: results.affectedRows > 0,
          };
          if (resultObj.inserted == false) {
            logger.warn("Venue Type " + venueType.id + " was not created.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        if (results && results.id) {
          return _getVenueType(results.id);
        }
        return null;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Creating new venue type: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _updateVenueType(loggedUserId, venueType) {
    function _transaction(connection) {
      const now = new Date();
      const newVenueType = Object.assign({}, venueType);

      newVenueType.modifier_id = loggedUserId;
      newVenueType.modified_at = now;

      delete newVenueType.id;
      delete newVenueType.is_fictitious;

      const model = self.om.getTableModel("venue_types");
      const qry = model.getUpdate(newVenueType);
      const commandText = `UPDATE venue_types ${qry.sqlStmt} WHERE id = ${venueType.id}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          let resultObj = {
            id: venueType.id,
            results: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn("Venue Type " + event.id + " was not updated.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        if (results && results.id) {
          return _getVenueType(results.id);
        }
        return null;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Updating venue type: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _deleteVenueType(venueType) {
    function _transaction(connection) {
      const commandText = `DELETE venue_types WHERE id = ${venueType.id}`;

      return self.db
        .conQuery(connection, commandText)
        .then((results) => {
          let resultObj = {
            id: venueType.id,
            results: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn(
              "Venue type " + venueType.id + " was not deleted."
            );
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = Object.assign({}, results, {
          created: venueType.created,
        });
        if (resultObj.results == false) {
          logger.warn("Venue type " + venueType.id + " was not deleted.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Deleting venue type: ${self.xmsg(err)}`)
        );
      }
    );
  }

  VenueTypesCtrl.Instance = this;
}

VenueTypesCtrl.prototype = new BaseCtrl();

module.exports = VenueTypesCtrl;
