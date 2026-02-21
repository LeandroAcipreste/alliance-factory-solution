const { Router } =  require("express");
const { getAllPricesController } = require("../controller/priceTableController");


const priceTableRouter = Router();

priceTableRouter.get("/", getAllPricesController);
console.log('A ROTA FOI CHAMADA')

module.exports =  priceTableRouter;