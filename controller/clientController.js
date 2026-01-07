const {
    createClient,
    getAllClientsService,
    updateClient,
    deleteClient
} = require("../service/clientService");

async function createClientController(req, res) {
    try {
        const newClient = await createClient(req.body);
        return res.status(201).json(newClient);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

async function getAllClientsController(req, res) {
    try {
        const clients = await getAllClientsService();
        return res.status(200).json(clients);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function updateClientController(req, res) {
    try {
        const { id } = req.params;

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        const updatedClient = await updateClient(id, req.body);
        return res.status(200).json(updatedClient);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

async function deleteClientController(req, res) {
    try {
        const { id } = req.params;

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID inválido." });
        }

        const result = await deleteClient(id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    createClientController,
    getAllClientsController,
    updateClientController,
    deleteClientController
};
