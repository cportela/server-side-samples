"use strict";
const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const ServiceError = require("../models/ServiceError");
const appUtils = require("../models/appUtils");
const BaseCtrl = require("./base-ctrl");

function EventsCtrl() {
  if (typeof EventsCtrl.Instance === "object") return EventsCtrl.Instance;

  var self = this;

  self.getAllEvents = (request, response) => {
    const loggedUserId = request.userId;

    const text = request.query.text;
    const limit = request.query.limit || 300;
    const sort_order = request.query.sort_order || "DESC";
    const include_mine = appUtils.parseBool(request.query.include_mine);
    const only_eligible = appUtils.parseBool(request.query.only_eligible);

    const getAll =
      request.query.mode == "operator"
        ? _getOperatorAllEvents(
          loggedUserId,
          text,
          limit,
          sort_order,
          include_mine
        )
        : _getRiderAllEvents(
          loggedUserId,
          text,
          limit,
          sort_order,
          only_eligible
        );

    return getAll
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

  self.getEvent = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!(request.params.id > 0)) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Required event Id"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _getEvent(loggedUserId, request.query.mode, request.params.id)
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

  self.insertEvent = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _insertEvent(loggedUserId, request.body)
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

  self.updateEvent = (request, response) => {
    const loggedUserId = request.userId;

    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _updateEvent(loggedUserId, request.body)
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

  self.deleteEvent = (request, response) => {
    // Validate required payload data
    if (!request.body) {
      var serviceError = new ServiceError(
        ServiceError.InvalidArguments,
        0,
        "Event information is required"
      );
      response.status(HttpCode.BAD_REQUEST).send(serviceError);
      return Promise.reject(serviceError);
    }

    return _deleteEvent(request.body)
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

  function _getOperatorAllEvents(
    operatorId,
    text = "",
    limit = 300,
    sort_order = "DESC",
    include_mine = false
  ) {
    return self.isOperator(operatorId).then(() => {
      // Events query
      const eventTypeCols = `E.event_type_id,ET.name event_type_name`;
      const simulatedCols = `E.simulated_ride_id,SR.name simulated_ride_name`;
      const sanctioningCols = `E.sanctioning_body_id,SB.name sanctioning_body_name`;
      const venueCols = `E.venue_id,V.name venue_name,V.contact_name venue_contact_name,V.email venue_email,
                V.phone1 venue_phone1,V.phone2 venue_phone2,V.facebook venue_facebook,V.twitter venue_twitter,V.instagram venue_instagram,
                V.address1 venue_address1,V.address2 venue_address2,V.city venue_city,V.state venue_state,V.county venue_county,
                V.country venue_country,V.zip venue_zip,V.venue_url venue_venue_url,V.lat venue_lat,V.lon venue_lon,V.image_url venue_image_url`;
      const eventCols = `E.id,E.name,E.start_date,E.end_date,${eventTypeCols},E.event_status,E.location,E.is_standard_ride,
                ${venueCols},${simulatedCols},
                E.operator_id,REPLACE(TRIM(CONCAT(U.fname," ",IFNULL(U.mname,"")," ",U.lname)),"  "," ") operator_name,U.has_avatar,U.avatar,
                IF(E.operator_id = ${operatorId}, 1, 0) mine,
                E.facebook,E.twitter,E.instagram,${sanctioningCols},
                E.event_url,E.description,E.entry_fee,E.created_at,E.is_fictitious`;

      let commandText = `SELECT * FROM (SELECT ${eventCols} FROM events AS E
                LEFT JOIN event_types ET ON ET.id = E.event_type_id
                LEFT JOIN venues V ON V.id = E.venue_id
                LEFT JOIN users U ON U.id = E.operator_id
                LEFT JOIN simulated_ride_types SR ON SR.id = E.simulated_ride_id
                LEFT JOIN sanctioning_bodies SB ON SB.id = E.sanctioning_body_id) TEMP`;

      if (include_mine == false) {
        commandText += ` WHERE mine = 0`;
      }

      if (text && text.length) {
        commandText += include_mine ? ` WHERE ` : ` AND `;
        commandText += ` name LIKE '%${text}%' OR description LIKE '%${text}%' OR
                    venue_name LIKE '%${text}%' OR
                    venue_city LIKE '%${text}%' OR
                    venue_county LIKE '%${text}%' OR
                    venue_state LIKE '%${text}%' OR
                    event_type_name LIKE '%${text}%' OR
                    sanctioning_body_name LIKE '%${text}%' OR
                    simulated_ride_name LIKE '%${text}%' OR
                    operator_name LIKE '%${text}%'`;
      }

      commandText += ` ORDER BY start_date ${sort_order} LIMIT 0, ${limit}`;
      return self.db.sqlQuery(commandText).then(
        (events) => {
          return events;
        },
        (err) => {
          return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
        }
      );
    });
  }

  function _getRiderAllEvents(
    riderId,
    text = "",
    limit = 300,
    sort_order = "DESC",
    only_eligible = true
  ) {
    // Events query
    const eventTypeCols = `E.event_type_id,ET.name event_type_name`;
    const simulatedCols = `E.simulated_ride_id,SR.name simulated_ride_name`;
    const sanctioningCols = `E.sanctioning_body_id,SB.name sanctioning_body_name`;
    const venueCols = `E.venue_id,V.name venue_name,V.contact_name venue_contact_name,V.email venue_email,
        V.phone1 venue_phone1,V.phone2 venue_phone2,V.facebook venue_facebook,V.twitter venue_twitter,V.instagram venue_instagram,
        V.address1 venue_address1,V.address2 venue_address2,V.city venue_city,V.state venue_state,V.county venue_county,
        V.country venue_country,V.zip venue_zip,V.venue_url venue_venue_url,V.lat venue_lat,V.lon venue_lon,V.image_url venue_image_url`;
    const eventCols = `E.id,E.name,E.start_date,E.end_date,${eventTypeCols},E.event_status,E.location,E.is_standard_ride,
        ${venueCols},${simulatedCols},
        E.operator_id,REPLACE(TRIM(CONCAT(U.fname," ",IFNULL(U.mname,"")," ",U.lname)),"  "," ") operator_name,U.has_avatar,U.avatar,
        IF((SELECT COUNT(*) FROM entries WHERE user_id = ${riderId} AND event_id = E.ID) > 0, 1, 0) mine,
        E.facebook,E.twitter,E.instagram,${sanctioningCols},
        E.event_url,E.description,E.entry_fee,E.created_at,E.is_fictitious`;

    let commandText = `SELECT * FROM (SELECT ${eventCols} FROM events AS E
        LEFT JOIN event_types ET ON ET.id = E.event_type_id
        LEFT JOIN venues V ON V.id = E.venue_id
        LEFT JOIN users U ON U.id = E.operator_id
        LEFT JOIN simulated_ride_types SR ON SR.id = E.simulated_ride_id
        LEFT JOIN sanctioning_bodies SB ON SB.id = E.sanctioning_body_id) TEMP`;

    // the include mine is not required for events search
    // if (include_mine == false) {
    //   commandText += ` WHERE mine = 0`;
    // }

    if (only_eligible == true) {
      // 0 = Pending Event, 1 = Public Event, 2 = Results Final, 3 = Cancelled, 4 Postponed
      commandText += ` WHERE (event_status = 0 OR event_status = 1)`;
    }

    if (text && text.length) {
      commandText += !only_eligible ? ` WHERE ` : ` AND `;
      commandText += ` name LIKE '%${text}%' OR 
            description LIKE '%${text}%' OR
            venue_name LIKE '%${text}%' OR
            venue_city LIKE '%${text}%' OR
            venue_county LIKE '%${text}%' OR
            venue_state LIKE '%${text}%' OR
            event_type_name LIKE '%${text}%' OR
            sanctioning_body_name LIKE '%${text}%' OR
            simulated_ride_name LIKE '%${text}%' OR
            operator_name LIKE '%${text}%'`;
    }

    commandText += ` ORDER BY start_date ${sort_order} LIMIT 0, ${limit}`;
    return self.db.sqlQuery(commandText).then(
      (events) => {
        return events;
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  function _getEvent(loggedUserId, mode, id) {
    let event = null;

    // Events query
    const eventCols = `E.id,E.name,E.start_date,E.end_date,E.event_type_id,E.event_status,
        E.location,E.is_standard_ride,E.simulated_ride_id,E.event_url,E.description,
        E.venue_id,E.operator_id,REPLACE(TRIM(CONCAT(U.fname," ",IFNULL(U.mname,"")," ",U.lname)),"  "," ") operator_name,U.has_avatar,U.avatar,
        E.facebook,E.twitter,E.instagram,E.sanctioning_body_id,
        E.entry_fee,E.allow_entry,E.created_at,E.is_fictitious`;

    const commandText = `SELECT ${eventCols} FROM events AS E
        LEFT JOIN users U ON U.id = E.operator_id
        WHERE E.Id = ${id}`;
    return self.db.sqlQuery(commandText).then((events) => {
      if (events && events.length > 0) {
        event = events[0];
        event.mine = 0;

        // Event type query
        const typeCommandText = `SELECT E.id,E.name,E.created_at FROM event_types AS E WHERE E.id = ${event.event_type_id}`;

        // Venues query
        const venueTypeCols = `V.venue_type,VT.name as venue_type_name`;
        const venueCols = `V.id,V.name,${venueTypeCols},V.contact_name,V.email,V.phone1,V.phone2,
                    V.facebook,V.twitter,V.instagram,V.address1,V.address2,V.city,V.state,V.county,V.country,V.zip,
                    V.venue_url,V.lat,V.lon,V.image_url,V.created_at`;
        const venueCommandText = `SELECT ${venueCols} FROM Venues AS V
                    LEFT JOIN venue_types VT ON VT.id = V.venue_type
                    WHERE V.Id = ${event.venue_id}`;

        // SanctioningBodies query
        const sanctioningCommandText = `SELECT S.id,S.name,S.created_at FROM sanctioning_bodies AS S WHERE S.id = ${event.sanctioning_body_id}`;

        // Entries query
        const eventCols = `E.event_id,EV.name as event_name,EV.event_status`;
        const entryCols = `E.id,${eventCols},E.user_id,REPLACE(TRIM(CONCAT(U.fname," ",IFNULL(U.mname,"")," ",U.lname)),"  "," ") rider_name,U.has_avatar,U.avatar,
                    E.participated,E.is_qualified_ride,E.time_on_bull,E.ride_score_1,E.ride_score_2,E.ride_notes,E.created_at,E.is_fictitious`;
        const entryCommandText = `SELECT ${entryCols} FROM entries AS E
                    LEFT JOIN events EV ON EV.id = E.event_id
                    LEFT JOIN users U ON U.id = E.user_id
                    WHERE E.event_id = '${event.id}'`;

        const getEvents = [
          self.db.sqlQuery(typeCommandText),
          self.db.sqlQuery(venueCommandText),
          self.db.sqlQuery(sanctioningCommandText),
          self.db.sqlQuery(entryCommandText),
        ];

        return Promise.all(getEvents).then((results) => {
          event.event_type = results[0].length ? results[0][0] : null;
          event.venue = results[1].length ? results[1][0] : null;
          event.sanctioning_body = results[2].length ? results[2][0] : null;
          event.entries = results[3];

          if (mode == "operator") {
            event.mine = event.operator_id == loggedUserId ? 1 : 0;
          } else {
            event.mine = event.entries.some((x) => x.user_id == loggedUserId)
              ? 1
              : 0;
          }

          return event;
        });
      } else {
        return Promise.reject(new ServiceError(1, 1, "No events were found"));
      }
    });
  }

  function _insertEvent(loggedUserId, event) {
    function _transaction(connection) {
      const now = new Date();
      const newEvent = Object.assign({}, event);

      newEvent.creator_id = loggedUserId;
      newEvent.created_at = now;

      delete newEvent.id;

      const model = self.om.getTableModel("events");
      const qry = model.getInsert(newEvent);
      const commandText = `INSERT INTO events ${qry.sqlStmt}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          event.id = results.insertId;

          let resultObj = { id: event.id, inserted: results.affectedRows > 0 };
          if (resultObj.inserted == false) {
            logger.warn("Event " + event.id + " was not created.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        if (results && results.id) {
          return _getEvent(loggedUserId, "", results.id);
        }
        return null;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Creating new event: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _updateEvent(loggedUserId, event) {
    function _transaction(connection) {
      const now = new Date();
      const newEvent = Object.assign({}, event);

      newEvent.modifier_id = loggedUserId;
      newEvent.modified_at = now;

      delete newEvent.id;
      delete newEvent.is_fictitious;
      delete newEvent.operator_id;
      delete newEvent.venue_id;

      const model = self.om.getTableModel("events");
      const qry = model.getUpdate(newEvent);
      const commandText = `UPDATE events ${qry.sqlStmt} WHERE id = ${event.id}`;

      return self.db
        .conQuery(connection, commandText, qry.params)
        .then((results) => {
          let resultObj = { id: event.id, results: results.affectedRows > 0 };
          if (resultObj.results == false) {
            logger.warn("Event " + event.id + " was not updated.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        if (results && results.id) {
          return _getEvent(loggedUserId, "", results.id);
        }
        return null;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Updating event: ${self.xmsg(err)}`)
        );
      }
    );
  }

  function _deleteEvent(event) {
    function _transaction(connection) {
      const commandText = `DELETE events WHERE id = ${event.id}`;

      return self.db
        .conQuery(connection, commandText)
        .then((results) => {
          let resultObj = { id: event.id, results: results.affectedRows > 0 };
          if (resultObj.results == false) {
            logger.warn("Event " + event.id + " was not deleted.");
          }
          return resultObj;
        });
    }

    return self.db.execTransaction(_transaction).then(
      (results) => {
        let resultObj = Object.assign({}, results, { created: event.created });
        if (resultObj.results == false) {
          logger.warn("Event " + event.id + " was not deleted.");
        }
        return resultObj;
      },
      (err) => {
        return Promise.reject(
          new ServiceError(1, 1, `ERROR - Deleting event: ${self.xmsg(err)}`)
        );
      }
    );
  }

  EventsCtrl.Instance = this;
}

EventsCtrl.prototype = new BaseCtrl();

module.exports = EventsCtrl;
