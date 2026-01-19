const db = require("../dataBase/connection");
const bcrypt = require("bcryptjs"); 
const { validateDocument } = require("../utils/documentValidation");

async function createUserService(data) {
    const {
        user_type_id,
        name,
        email,
        phone,
        password,
        document,
        commission_percent
    } = data;

    const client = await db.getClient();

    try {
        await client.query("BEGIN");
        console.log("BODY:", data)

        // CPF/CNPJ validation
        const { value: cleanDocument } = validateDocument(document);

        // password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // search role by user_type
        const userTypeResult = await client.query(
            `SELECT name FROM user_types WHERE id = $1`,
            [user_type_id]
        );

        if (userTypeResult.rows.length === 0) {
            throw new Error("Tipo de usuário inválido");
        }

        const role = userTypeResult.rows[0].name;

        // Create User
        const createUser = await client.query(
            `
            INSERT INTO users
            (user_type_id, name, email, phone, password, role, document)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
            `,
            [
                user_type_id,
                name,
                email,
                phone,
                hashedPassword,
                role,
                cleanDocument
            ]
        );

        const user = createUser.rows[0];

        //CREATE VENDOR + WALLET
           

        const vendorTypeMap = {
            representante: "REPRESENTANTE",
            distribuidor: "DISTRIBUIDOR",
            vendedor_fabrica: "VENDEDOR_FABRICA"
        };

        const vendorType = vendorTypeMap[role];

        if (vendorType) {
            if (commission_percent === undefined) {
                throw new Error("commission_percent é obrigatório para vendedores");
            }

            const createVendor = await client.query(
                `
                INSERT INTO vendors
                (user_id, vendor_type, commission_percent)
                VALUES ($1, $2, $3)
                RETURNING id
                `,
                [user.id, vendorType, commission_percent]
            );

            const vendorId = createVendor.rows[0].id;

            // Create wallet automatically
            await client.query(
                `
                INSERT INTO wallets (vendor_id, debit_amount, credit_amount)
                VALUES ($1, 0, 0)
                `,
                [vendorId]
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
};



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
