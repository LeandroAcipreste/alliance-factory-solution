const { getAllPricesService } = require("../service/priceTableService");

async function getAllPricesController(req, res) {
    try{
        const prices = await getAllPricesService();
        return res.status(200).json(prices);
    } catch (error){
        console.error(error);
        return res.status(500).send("Erro ao buscar tabela de preços")
    };
};

module.exports = {
    getAllPricesController
};