const {
    createOrderService,
    getAllOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    updateOrderItemsService
} = require("../service/OrderService");

/* ===============================
   CRIAR PEDIDO
================================ */
async function createOrderController(req, res) {
    try {
        const clientId = Number(req.params.clientId);

        if (!clientId || isNaN(clientId)) {
            return res.status(400).send("ID do cliente inválido.");
        }

        console.log("REQ. USER NO CONTROLLER", req.user);
        const order = await createOrderService(clientId, req.body, req.user.id);
        return res.status(201).json(order);

    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
}

/* ===============================
   LISTAR TODOS OS PEDIDOS
================================ */
async function getAllOrdersController(req, res) {
    try {
        const orders = await getAllOrdersService();
        return res.status(200).json(orders);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}

/* ===============================
   BUSCAR PEDIDO POR ID
================================ */
async function getOrderByIdController(req, res) {
    try {
        const orderId = Number(req.params.id);

        if (!orderId || isNaN(orderId)) {
            return res.status(400).send("ID do pedido inválido.");
        }

        const order = await getOrderByIdService(orderId);
        return res.status(200).json(order);

    } catch (error) {
        console.error(error);
        return res.status(404).json({ error: error.message });
    }
}

/* ===============================
   ATUALIZAR STATUS DO PEDIDO
================================ */
async function updateOrderStatusController(req, res) {
    try {
        const orderId = Number(req.params.id);
        const { status } = req.body;

        if (!orderId || isNaN(orderId)) {
            return res.status(400).send("ID do pedido inválido.");
        }

        if (!status) {
            return res.status(400).send("Status é obrigatório.");
        }

        const updatedOrder = await updateOrderStatusService(orderId, status);
        return res.status(200).json(updatedOrder);

    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
}

/* ===============================
   ATUALIZAR ITENS DO PEDIDO
================================ */
async function updateOrderItemsController(req, res) {
    try {
        const orderId = Number(req.params.id);

        if (!orderId || isNaN(orderId)) {
            return res.status(400).send("ID do pedido inválido.");
        }

        const result = await updateOrderItemsService(orderId, req.body.items);
        return res.status(200).json(result);

    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    createOrderController,
    getAllOrdersController,
    getOrderByIdController,
    updateOrderStatusController,
    updateOrderItemsController
};
