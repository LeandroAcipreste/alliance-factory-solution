const express = require("express");
const routerUsers = require("./routes/usersRoute")
const cors = require("cors");
const routerOrders = require("./routes/orderRoute");
const priceTableRouter = require("./routes/priceTableRoute");
const routerClients = require("./routes/clientRouter");

const app = express();

app.use(express.json());
app.use(cors({origin: "*" }));

app.use("/users", routerUsers);
app.use("/order", routerOrders);
app.use("/price-table", priceTableRouter);
app.use("/clients", routerClients)


const port = 8000;
app.listen(port, () => console.log(`Escutando a porta ${port}`));