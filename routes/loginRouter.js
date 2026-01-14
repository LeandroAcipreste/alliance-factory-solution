
const { Router } = require("express");
const { loginController } = require("../controller/loginControler");

const routerLogin = Router()

routerLogin.post("/", loginController);

module.exports = routerLogin;
