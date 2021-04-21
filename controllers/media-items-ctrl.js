"use strict";
const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const ServiceError = require("../models/ServiceError");

const BaseCtrl = require("./base-ctrl");

function MediaItemsCtrl() {
  if (typeof MediaItemsCtrl.Instance === "object")
    return MediaItemsCtrl.Instance;

  var self = this;

  self.getAllMediaItems = (request, response) => {
    return _getAllMediaItems()
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

  self.getMediaItem = (request, response) => {
    // Validate required payload data
    if (!(request.params.id > 0)) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required media item Id"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _getMediaItem(request.params.id)
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

  self.insertMediaItem = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required media item"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _insertMediaItem(request.body)
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

  self.updateMediaItem = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required media item"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _updateMediaItem(request.body)
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

  self.deleteMediaItem = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required media item"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _deleteMediaItem(request.body)
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

  function _getAllMediaItems(userId) {
    // MediaItems query
    const userCols = `M.*`;
    let commandText = `SELECT ${userCols} FROM media_items AS M WHERE M.user_id = '${userId}'`;
    return self.db.sqlQuery(commandText).then(
      (mediaItems) => {
        return mediaItems;
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _getMediaItem(id) {
    // MediaItems query
    const userCols = `M.*`;
    let commandText = `SELECT ${userCols} FROM media_items AS M WHERE M.id = ${id}`;
    return self.db.sqlQuery(commandText).then(
      (mediaItems) => {
        if (mediaItems && mediaItems.length > 0) {
          return mediaItems[0];
        } else {
          return Promise.reject(
            new ServiceError(1, 1, "Media Items not found")
          );
        }
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _insertMediaItem(mediaitem) {
    function _transaction(connection) {
      const now = new Date();
      const newMediaItem = Object.assign({}, mediaitem);

      newMediaItem.created_at = now;
      newMediaItem.modified_at = now;

      delete newMediaItem.id;

      const model = self.om.getTableModel("mediaitems");
      const qry = model.getInsert(newMediaItem);
      const commandText = `INSERT INTO mediaitems ${qry.sqlStmt}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          mediaitem.id = results.insertId;

          let resultObj = {
            newId: mediaitem.id,
            inserted: results.affectedRows > 0,
          };

          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = Object.assign({}, results, {
          created: mediaitem.created,
        });

        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Creating media item: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _updateMediaItem(mediaitem) {
    function _transaction(connection) {
      const now = new Date();
      const newMediaItem = Object.assign({}, mediaitem);

      newMediaItem.modified_at = now;

      delete newMediaItem.id;

      const model = self.om.getTableModel("mediaitems");
      const qry = model.getUpdate(newMediaItem);
      const commandText = `UPDATE mediaitems ${qry.sqlStmt} WHERE id = ${mediaitem.id}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          let resultObj = {
            id: mediaitem.id,
            results: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn("MediaItem " + mediaitem.id + " was not updated.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = { id: mediaitem.id, results: results.affectedRows > 0 };
        if (resultObj.results == false) {
          logger.warn("MediaItem " + mediaitem.id + " was not updated.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Updating media item: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _deleteMediaItem(mediaitem) {
    function _transaction(connection) {
      const commandText = `DELETE mediaitems WHERE id = ${mediaitem.id}`;

      return self.db
        .conQuery(connection, commandText)
        .then((results) => {
          let resultObj = {
            id: mediaitem.id,
            results: results.affectedRows > 0,
          };
          if (resultObj.results == false) {
            logger.warn(
              "MediaItem " + mediaitem.id + " was not deleted."
            );
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = Object.assign({}, results, {
          created: mediaitem.created,
        });
        if (resultObj.results == false) {
          logger.warn("MediaItem " + mediaitem.id + " was not deleted.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Deleting media item: ${self.xmsg(err)}`)
        );
      }
    );
  }

  MediaItemsCtrl.Instance = this;
}

MediaItemsCtrl.prototype = new BaseCtrl();

module.exports = MediaItemsCtrl;
