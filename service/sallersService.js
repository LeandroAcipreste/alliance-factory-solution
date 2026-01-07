const db = require("../dataBase/connection");

async function createSaller(user_id) {
    const createSaller = await db.query(
        `INSERT INTO sallers(user_id)
        VALUES ($1)
        RETURNING *`
        [user_id]
    );

    return createSaller.rows[0];
};

module.exports = ( createSaller )