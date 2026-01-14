const { loginService } = require("../service/LoginService");

async function loginController(req, res) {
    try {
        const result = await loginService(req.body);
        return res.json(result);
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
}

module.exports = { loginController };
