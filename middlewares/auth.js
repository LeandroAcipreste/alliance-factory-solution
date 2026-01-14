const jwt = require("jsonwebtoken");

function auth(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.satus(401).json({error: "Token nao informado"});
    }

    const [, token] = authHeader.split("");
    
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        return next();
    } catch (error){
        return res.status(401).json({error: "Token inválido ou expirado"});
    }
};

module.exports = auth