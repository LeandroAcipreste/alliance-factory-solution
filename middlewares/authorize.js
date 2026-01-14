function authorize(...allowedRoles){
    return(req, res, next) => {
        const{ role } = req.user;

        if(!allowedRoles.includes(role)){
            return res.status(403).json({error: "Acesso negado"})
        }

        next();
    }
}

module.exports = authorize;