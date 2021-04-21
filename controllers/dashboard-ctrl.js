"use strict";
const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const ServiceError = require("../models/ServiceError");
const appUtils = require("../models/appUtils");
const BaseCtrl = require("./base-ctrl");

function DashboardCtrl() {
  if (typeof DashboardCtrl.Instance === "object") return DashboardCtrl.Instance;

  var self = this;

  self.getDashboardData = (request, response) => {
    const loggedUserId = request.userId;
    const full = appUtils.parseBool(request.query.full);

    const getDashboardData =
      request.query.mode == "operator"
        ? _getOperatorDashboardData(loggedUserId, full)
        : _getRiderDashboardData(loggedUserId);

    return getDashboardData
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

  function _getRiderDashboardData(riderId) {
    const resultObj = { events: [], entries: [] };

    // Entries query
    const eventCols = `E.event_id,EV.name as event_name,EV.event_status`;
    const entryCols = `E.id,${eventCols},E.user_id,REPLACE(TRIM(CONCAT(U.fname," ",IFNULL(U.mname,"")," ",U.lname)),"  "," ") rider_name,U.has_avatar,U.avatar,
        E.participated,E.is_qualified_ride,E.time_on_bull,E.ride_score_1,E.ride_score_2,E.ride_notes,E.created_at,E.is_fictitious`;
    let commandText = `SELECT ${entryCols} FROM entries AS E
        LEFT JOIN events EV ON EV.id = E.event_id
        LEFT JOIN users U ON U.id = E.user_id
        WHERE E.user_id = '${riderId}'`;
    return self.db
      .sqlQuery(commandText)
      .then(
        (entries) => {
          resultObj.entries = entries;

          const eventIds = entries.reduce((ids, entry) => {
            if (ids.indexOf(entry.event_id) < 0) {
              ids.push(entry.event_id);
            }
            return ids;
          }, []);

          if (eventIds.length) {
            // Events query
            const eventTypeCols = `E.event_type_id,ET.name event_type_name`;
            const simulatedCols = `E.simulated_ride_id,SR.name simulated_ride_name`;
            const sanctioningCols = `E.sanctioning_body_id,SB.name sanctioning_body_name`;
            const venueCols = `E.venue_id,V.name venue_name,V.contact_name venue_contact_name,V.email venue_email,
                    V.phone1 venue_phone1,V.phone2 venue_phone2,V.facebook venue_facebook,V.twitter venue_twitter,V.instagram venue_instagram,
                    V.address1 venue_address1,V.address2 venue_address2,V.city venue_city,V.state venue_state,V.county venue_county,
                    V.country venue_country,V.zip venue_zip,V.venue_url venue_venue_url,V.lat venue_lat,V.lon venue_lon,V.image_url venue_image_url`;
            const eventCols = `E.id,E.name,E.start_date,E.end_date,${eventTypeCols},E.event_status,E.location,E.is_standard_ride,
                    ${venueCols},${simulatedCols}, 1 mine,
                    E.operator_id,REPLACE(TRIM(CONCAT(U.fname," ",IFNULL(U.mname,"")," ",U.lname)),"  "," ") operator_name,U.has_avatar,U.avatar,
                    E.facebook,E.twitter,E.instagram,${sanctioningCols},
                    E.event_url,E.description,E.entry_fee,E.created_at,E.is_fictitious`;

            let commandText = `SELECT ${eventCols} FROM events AS E
                    LEFT JOIN event_types ET ON ET.id = E.event_type_id
                    LEFT JOIN venues V ON V.id = E.venue_id
                    LEFT JOIN users U ON U.id = E.operator_id
                    LEFT JOIN simulated_ride_types SR ON SR.id = E.simulated_ride_id
                    LEFT JOIN sanctioning_bodies SB ON SB.id = E.sanctioning_body_id`;

            const where = ` E.id IN (${eventIds.join(",")})`;

            return _getAllEvents(commandText, where);
          } else {
            return Promise.resolve([]); // events
          }
        },
        (err) => {
          return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
        }
      )
      .then(
        (events) => {
          resultObj.events = events;

          return resultObj;
        },
        (err) => {
          return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
        }
      );
  }

  function _getOperatorDashboardData(operatorId, full = null) {
    return self.isOperator(operatorId).then(() => {
      const resultObj = { events: [], entries: [] };

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

      let commandText = `SELECT ${eventCols} FROM events AS E
                LEFT JOIN event_types ET ON ET.id = E.event_type_id
                LEFT JOIN venues V ON V.id = E.venue_id
                LEFT JOIN users U ON U.id = E.operator_id
                LEFT JOIN simulated_ride_types SR ON SR.id = E.simulated_ride_id
                LEFT JOIN sanctioning_bodies SB ON SB.id = E.sanctioning_body_id`;

      if (full) {
        const where = ` E.operator_id = ${operatorId}`;

        return _getAllEvents(commandText, where).then((results) => {
          resultObj.events = results;

          return resultObj;
        });
      } else {
        const yesWhere = ` E.operator_id = ${operatorId} AND DATE(E.start_date) < CURDATE()`;
        const todWhere = ` E.operator_id = ${operatorId} AND DATE(E.start_date) = CURDATE()`;
        const tomWhere = ` E.operator_id = ${operatorId} AND DATE(E.start_date) > CURDATE()`;

        const getEvents = [
          _getAllEvents(commandText, `${yesWhere} LIMIT 0, 3`),
          _getAllEvents(commandText, `${todWhere} LIMIT 0, 3`),
          _getAllEvents(commandText, `${tomWhere} LIMIT 0, 3`),
        ];

        return Promise.all(getEvents).then((results) => {
          resultObj.events = [];
          results.forEach((x) => x.forEach((y) => resultObj.events.push(y)));

          return resultObj;
        });
      }
    });
  }

  function _getAllEvents(select, where) {
    // Events query
    let commandText = select;
    if (where) {
      commandText += ` WHERE ${where}`;
    }
    return self.db.sqlQuery(commandText).then(
      (events) => {
        return events;
      },
      (err) => {
        return Promise.reject(new ServiceError(1, 1, self.xmsg(err)));
      }
    );
  }

  DashboardCtrl.Instance = this;
}

DashboardCtrl.prototype = new BaseCtrl();

module.exports = DashboardCtrl;
