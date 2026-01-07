const db = require("../dataBase/connection");

async function createUserService(data) {
    const { user_type_id, name, email, phone, password } = data;

    const client = await db.getClient();
    try {
        await client.query("BEGIN");

        const userCreate = await client.query(
            `INSERT INTO users (user_type_id, name, email, phone, password)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING *`,
            [user_type_id, name, email, phone, password]
        );

        await client.query("COMMIT");
        return userCreate.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { createUserService };
