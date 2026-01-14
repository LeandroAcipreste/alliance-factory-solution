const {
    createClientService,
    getAllClientsService,
    getMyClientsService,
    updateClientService,
    deleteClientService
} = require("../service/clientService");

/* -----------------------------------------
   CREATE CLIENT (VENDOR)
----------------------------------------- */
async function createClientController(req, res) {
    try {
        const client = await createClientService(req.body, req.user.id);
        return res.status(201).json(client);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

/* -----------------------------------------
   GET CLIENTS (ADMIN / VENDOR)
----------------------------------------- */
async function getClientsController(req, res) {
    try {
        const { role } = req.user;

        if (role === "admin") {
            const clients = await getAllClientsService();
            return res.json(clients);
        }

        const clients = await getMyClientsService(req.user.id);
        return res.json(clients);

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

/* -----------------------------------------
   UPDATE CLIENT
----------------------------------------- */
async function updateClientController(req, res) {
    try {
        const client = await updateClientService(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.json(client);

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

/* -----------------------------------------
   DELETE CLIENT
----------------------------------------- */
async function deleteClientController(req, res) {
    try {
        const result = await deleteClientService(
            req.params.id,
            req.user.id
        );

        return res.json(result);

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    createClientController,
    getClientsController,
    updateClientController,
    deleteClientController
};
