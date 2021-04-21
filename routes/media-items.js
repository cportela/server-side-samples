var authMiddleware = require("../config/auth-middleware");
var MediaItemsCtrl = require("../controllers/media-items-ctrl");
var ctrl = new MediaItemsCtrl();

module.exports = function MediaItemsRoutes(app) {
  // Test
  app.get("/api/media-items", authMiddleware.Authorize, ctrl.getTest);
  app.get("/api/media-items/private", authMiddleware.Authorize, ctrl.getTest);

  app.post("/api/media-items", authMiddleware.Authorize, ctrl.getAllMediaItems);
  app.post("/api/media-items/:id", authMiddleware.Authorize, ctrl.getMediaItem);
  app.post("/api/media-item", authMiddleware.Authorize, ctrl.insertMediaItem);
  app.put("/api/media-item", authMiddleware.Authorize, ctrl.updateMediaItem);
  app.delete("/api/media-item", authMiddleware.Authorize, ctrl.deleteMediaItem);
};
