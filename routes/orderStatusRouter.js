const { Router } = require("express");
const { changeOrderStatusController } = require("../controller/orderStatusController");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const routerOrderStatus = Router();

routerOrderStatus.patch(
    "/:id/status",
    auth,
    authorize("producao", "admin"),
    changeOrderStatusController
);

module.exports = routerOrderStatus;