const db = require("../dataBase/connection");
const { validateDocument } = require("../utils/documentValidation");

async function createUserService(data) {
    const {
        user_type_id,
        name,
        email,
        phone,
        password,
        document,
        vendor_type,
        commission_percent
    } = data;

    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        /* valida CPF ou CNPJ */
        const { value: cleanDocument } = validateDocument(document);

        /* busca role pelo tipo */
        const userTypeResult = await client.query(
            `SELECT name FROM user_types WHERE id = $1`,
            [user_type_id]
        );

        if (userTypeResult.rows.length === 0) {
            throw new Error("Tipo de usuário inválido");
        }

        const role = userTypeResult.rows[0].name;

        /* cria usuário */
        const userResult = await client.query(
            `
            INSERT INTO users
            (user_type_id, name, email, phone, password, role, document)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
            `,
            [user_type_id, name, email, phone, password, role, cleanDocument]
        );

        const user = userResult.rows[0];
        const userId = user.id;

        /* cria vendor automaticamente se aplicável */
        if (vendor_type && commission_percent !== undefined) {
            await client.query(
                `
                INSERT INTO vendors (user_id, vendor_type, commission_percent)
                VALUES ($1,$2,$3)
                `,
                [userId, vendor_type, commission_percent]
            );
        }

        await client.query("COMMIT");

        return user;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { createUserService };

/* ===============================
   GET ALL USERS
================================ */
async function getUsersService() {
    const result = await db.query(`
        SELECT
            id,
            user_type_id,
            name,
            email,
            phone,
            cpf,
            role,
            created_at
        FROM users
        ORDER BY id DESC
    `);

    return result.rows;
}

/* ===============================
   UPDATE USER
================================ */
async function updateUserService(userId, data) {
    const { name, email, phone } = data;

    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const exists = await client.query(
            `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        if (exists.rows.length === 0) {
            throw new Error("Usuário não encontrado");
        }

        const updated = await client.query(
            `
            UPDATE users
            SET
                name = COALESCE($1, name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone)
            WHERE id = $4
            RETURNING *
            `,
            [name, email, phone, userId]
        );

        await client.query("COMMIT");
        return updated.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/* ===============================
   DELETE USER
================================ */
async function deleteUserService(userId) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const exists = await client.query(
            `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        if (exists.rows.length === 0) {
            throw new Error("Usuário não encontrado");
        }

        await client.query(
            `DELETE FROM users WHERE id = $1`,
            [userId]
        );

        await client.query("COMMIT");
        return { message: "Usuário removido com sucesso" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createUserService,
    getUsersService,
    updateUserService,
    deleteUserService
};
