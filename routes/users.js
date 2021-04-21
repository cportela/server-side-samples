var authMiddleware = require("../config/auth-middleware");
var UsersCtrl = require("../controllers/users-ctrl");
var ctrl = new UsersCtrl();

module.exports = function UsersRoutes(app) {
  // Test
  app.get("/api/users", authMiddleware.Authorize, ctrl.getTest);
  app.get("/api/users/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/users", authMiddleware.Authorize, ctrl.getAllUsers);
  app.post("/api/users/:id", authMiddleware.Authorize, ctrl.getUser);
  app.put("/api/user", authMiddleware.Authorize, ctrl.updateUser);
  app.delete("/api/user", authMiddleware.Authorize, ctrl.deleteUser);
};
