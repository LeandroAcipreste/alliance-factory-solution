const { Router } =  require("express");
const { getAllPricesController } = require("../controller/priceTableController");


const priceTableRouter = Router();

priceTableRouter.get("/", getAllPricesController);

module.exports =  priceTableRouter;