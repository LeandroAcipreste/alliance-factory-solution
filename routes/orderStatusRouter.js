const { Router } = require("express");
const { changeOrderStatusController } = require("../controller/orderStatusController");

const routerOrderStatus = Router();

routerOrderStatus.patch("/orders/:id/status", changeOrderStatusController);

module.exports = routerOrderStatus;