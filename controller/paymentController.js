const { payCashService } = require("../service/paymentService");

async function payCashController(req, res){
    try{
        const payCash = await payCashService(req.body);
        return res.status(200).json(payCash)
    } catch (error) {
        return res.status(400).json({ error : message});
    };
};

module.exports ={
    payCashController
}