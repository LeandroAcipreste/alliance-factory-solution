const { Router } = require("express");
const { getOrderByIdController, createOrderController, updateOrderStatusController, getAllOrdersController, updateOrderItemsController } = require("../controller/orderController");

const routerOrders= Router();

routerOrders.post("/:clienteId", createOrderController);

routerOrders.get("/", getAllOrdersController);

routerOrders.get("/:id", getOrderByIdController);

routerOrders.patch("/:id/status", updateOrderStatusController);

routerOrders.patch("/:id/items", updateOrderItemsController);



module.exports = routerOrders