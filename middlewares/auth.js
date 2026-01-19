const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token não informado" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
        return res.status(401).json({ error: "Token mal formatado" });
    }

    const [scheme, token] = parts;

    if (scheme !== "Bearer") {
        return res.status(401).json({ error: "Token mal formatado" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "dev_secret"
        );

        console.log("AUTH OK", decoded)

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        return next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

module.exports = auth;
