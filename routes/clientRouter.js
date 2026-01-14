const { Router } = require("express");
const {
    createClientController,
    getClientsController,
    updateClientController,
    deleteClientController
} = require("../controller/clientController");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const routerClients = Router();

routerClients.use(auth)

routerClients.post("/", createClientController);
routerClients.get("/clients", authorize("admin", "vendedor_fabrica", "representante", "distribuidor")
, getClientsController);
routerClients.patch("/:id", updateClientController);
routerClients.delete("/:id", deleteClientController);

module.exports = routerClients;
