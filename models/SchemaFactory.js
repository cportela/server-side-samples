var db = require("../config/db");

function SchemaFactory() {
  var self = this;

  self.loadSchema = function () {
    const schema = db.__poolObject.database;
    return db
      .sqlQuery(
        `select table_name, table_comment from information_schema.tables where table_schema = '${schema}'`,
        []
      )
      .then(
        function (results) {
          function describeTable(tableName) {
            return db
              .sqlQuery("describe " + tableName, [])
              .then(function complete(result) {
                result.forEach(function (col) {
                  col.tableName = tableName;
                });
                return result;
              });
          }

          var promises = [];
          var tablesArray = [];

          results.forEach(function (t) {
            tablesArray.push(t);
            t.table_name = t.table_name || t.TABLE_NAME; // Fixed for MySQl 8
            promises.push(describeTable(t.table_name));
          });
          return Promise.all(promises).then(function complete(result) {
            var tablesObj = {};

            for (var i = 0; i < tablesArray.length; i++) {
              var tb = (tablesObj[tablesArray[i].table_name] = tablesArray[i]);
              tb.columns = {};
              for (var j = 0; j < result[i].length; j++) {
                tb.columns[result[i][j].Field] = result[i][j];
              }
            }
            tablesArray = null;
            return tablesObj;
          });
        },
        function error(err) {
          //logger.error(err, 'getConnection failed in loadSchema');
          return Promise.reject(err);
        }
      );
  };
}

module.exports = SchemaFactory;
