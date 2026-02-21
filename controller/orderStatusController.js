const { changeOrderStatusService } = require("../service/orderStatusService");

async function changeOrderStatusController(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { role } = req.user;

        const result = await changeOrderStatusService(
            Number(id),
            status,
            role
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    changeOrderStatusController
};
