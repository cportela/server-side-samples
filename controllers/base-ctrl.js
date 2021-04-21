const logger = require("../config/logger");
const HttpCode = require("http-status-codes");
const db = require("../config/db");
const qry = require("../config/qry");
const ServiceError = require("../models/ServiceError");
const sha256 = require("../config/sha256");

const SchemaFactory = require("../models/SchemaFactory");
const ObjectMgr = require("../models/ObjectMgr");

function BaseCtrl() {
  const self = this;

  // Instantiate SchemaFactory
  const sf = new SchemaFactory();
  sf.loadSchema().then((tables) => {
    self.om = self.om || new ObjectMgr();
    self.om.setSchema(tables);
  });
}

BaseCtrl.prototype.db = db;
BaseCtrl.prototype.qry = qry;

BaseCtrl.prototype.om = new ObjectMgr();

BaseCtrl.prototype.getTest = function (req, res) {
  res
    .status(HttpCode.OK)
    .send(`${req.protocol}://${req.host}${req.path}  ${req.method} Successful`);
};

BaseCtrl.prototype.isOperator = function (operatorId) {
  var commandText = `SELECT * FROM users WHERE id = ${operatorId} AND can_be_operator = 1 AND is_active = 1 AND verified IS NOT NULL`;
  return db.sqlQuery(commandText).then(
    (results) => {
      if (results.length == 1) {
        return results[0];
      } else {
        return Promise.reject(
          new ServiceError(
            ServiceError.NotFound,
            0,
            "This user is not an operator"
          )
        );
      }
    },
    (err) => {
      logger.error(err.message);
      Promise.reject(new ServiceError(1, 1, err.message));
    }
  );
};

BaseCtrl.prototype.jsonTryParse = function (data) {
  var dataParsed = null;
  if (data) {
    try {
      if (data instanceof Object) return data;
      dataParsed = JSON.parse(data);
    } catch (ex) {
      dataParsed = null;
    }
  }
  return dataParsed;
};

BaseCtrl.prototype.xmsg = function (err) {
  if (!err) return "unknown";
  if (err.message) return err.message;
  return err.toString();
};

BaseCtrl.prototype.parseSearch = function (
  commandText,
  search,
  likeColumns,
  timestampName,
  getSorting
) {
  let isWhere = false;
  if (qry.isValidString(search.where)) {
    commandText += " WHERE (" + qry.parseWhere(search.where) + ")";
    isWhere = true;
  }
  if (qry.isValidString(search.criteria)) {
    commandText += isWhere ? " AND " : " WHERE ";
    commandText +=
      "(" +
      qry.parseCriteria(search.searchMode, search.criteria, likeColumns) +
      ")";
    isWhere = true;
  }
  if (qry.isValidString(search.timestamp) && qry.isValidString(timestampName)) {
    commandText += isWhere ? " AND " : " WHERE ";
    commandText += `(${timestampName} >= '${search.timestamp}')`;
  }
  if (search.sort != undefined && getSorting) {
    var sorting = getSorting(search.sort);
    if (qry.isValidString(sorting)) commandText += " ORDER BY " + sorting;
  } else if (qry.isValidString(search.order)) {
    commandText += " ORDER BY " + search.order;
  }
  if (search.page && search.pageSize) {
    if (search.page > 0 && search.pageSize > 0) {
      let pageStart = search.page * search.pageSize - search.pageSize;
      commandText += " LIMIT " + pageStart + ", " + search.pageSize;
    }
  }
  return commandText;
};

BaseCtrl.prototype.getUsersCommandText = function (search = null) {
  const tableName = "users";

  const columns =
    search && search.columns
      ? search.columns.split(",")
      : `id,email,can_be_operator,is_admin,fname,mname,lname,show_alias,alias,mobile,land_line,dob,gender,customer_id,
        address1,address2,city,state,zip,facebook,twitter,instagram,has_avatar,avatar,has_photo,photo_url,
        date_became_operator,settings,deleted_at,is_active,verified,last_login,created_at,modified_at,modifier_id,is_fictitious`.split(
          ","
        );

  let model = this.om.getTableModel(tableName);
  const qrySelect = model.getSelect(columns);
  let columnsText = qrySelect.sqlStmt ? "," + qrySelect.sqlStmt : "";
  columnsText = columnsText.replace(",id", "");

  let commandText = `SELECT ${tableName}.id ${columnsText}`;
  if (qrySelect.sqlStmt.indexOf("*") == 0) {
    columnsText = qrySelect.sqlStmt;
    commandText = `SELECT ${tableName}.${columnsText}`;
  }
  commandText += ` FROM ${tableName} `;

  return commandText;
};

BaseCtrl.prototype.registerUser = function (connection, user) {
  const commandText = `SELECT id FROM users AS U WHERE U.email = '${user.email}'`;
  return this.db.sqlQuery(commandText).then((results) => {
    if (results && results.length) {
      return Promise.reject(
        new ServiceError(
          1,
          1,
          `Unable to create user '${user.fname}', as email '${user.email}' already exists.`
        )
      );
    }

    const now = new Date();
    const newUser = Object.assign({}, user);

    newUser.created_at = now;
    newUser.digest = sha256.hash(user.digest);

    // Activate the user
    newUser.is_active = true;
    newUser.verified = now;

    delete newUser.id;

    const model = this.om.getTableModel("users");
    const qry = model.getInsert(newUser);
    const commandText = `INSERT INTO users ${qry.sqlStmt}`;

    return this.db
      .conQuery(connection, commandText, qry.params)
      .then((results) => {
        newUser.id = user.id = results.insertId;

        return newUser;
      });
  });
};

module.exports = BaseCtrl;
