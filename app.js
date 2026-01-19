require("dotenv").config();
const express = require("express");
const routerUsers = require("./routes/usersRoute")
const cors = require("cors");
const routerOrders = require("./routes/orderRoute");
const priceTableRouter = require("./routes/priceTableRoute");
const routerClients = require("./routes/clientRouter");
const routerOrderStatus = require("./routes/orderStatusRouter");
const routerLogin =  require("./routes/loginRouter");


const app = express();

app.use(express.json());
app.use(cors({origin: "*" }));

app.use("/users", routerUsers);
app.use("/orders", routerOrders);
app.use("/order", routerOrderStatus);
app.use("/price-table", priceTableRouter);
app.use("/clients", routerClients)
app.use("/login", routerLogin)



const port = 8000;
app.listen(port, () => console.log(`Escutando a porta ${port}`));