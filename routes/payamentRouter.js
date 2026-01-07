const { Router } = require("express");
const { payCashController } = require("../controller/paymentController");


const routerPayCash = Router();

routerPayCash.post("/cash", payCashController);

modeule.exports = routerPayCash;