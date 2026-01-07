const { Router } = require("express");
const {
    createClientController,
    getAllClientsController,
    updateClientController,
    deleteClientController
} = require("../controller/clientController");

const routerClients = Router();

routerClients.post("/", createClientController);
routerClients.get("/", getAllClientsController);
routerClients.patch("/:id", updateClientController);
routerClients.delete("/:id", deleteClientController);

module.exports = routerClients;
