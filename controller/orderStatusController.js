const { changeOrderStatusService } = require("../service/orderStatusService");

async function changeOrderStatusController(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await changeOrderStatusService(Number(id), status);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    changeOrderStatusController
};
