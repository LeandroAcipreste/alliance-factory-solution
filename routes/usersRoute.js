const { Router } = require("express");
const { getUsersController,
        createUserController,
        updateUserController,
        deleteUserController } = require("../controller/usersController");

const routerUsers = Router();

routerUsers.get("/", getUsersController);
routerUsers.post("/", createUserController);
routerUsers.patch("/:id",updateUserController);
routerUsers.delete("/:id",deleteUserController);

module.exports = routerUsers

