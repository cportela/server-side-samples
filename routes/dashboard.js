var authMiddleware = require("../config/auth-middleware");
var DashboardCtrl = require("../controllers/dashboard-ctrl");
var ctrl = new DashboardCtrl();

module.exports = function EntriesRoutes(app) {
  // Test
  app.get("/api/dashboard", ctrl.getTest);
  app.get("/api/dashboard/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/dashboard", authMiddleware.Authorize, ctrl.getDashboardData);
};
