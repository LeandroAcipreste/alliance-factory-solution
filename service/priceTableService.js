const db = require("../dataBase/connection");

async function getAllPricesService(){
    // Mudando para os nomes das colunas em inglês da sua nova tabela
    const result = await db.query(
        `SELECT 
            reference, 
            description, 
            price, 
            steel_lining_price, 
            stone_price,
            created_at
        FROM price_table
        ORDER BY reference`
    );
    return result.rows;
};

module.exports = { getAllPricesService };