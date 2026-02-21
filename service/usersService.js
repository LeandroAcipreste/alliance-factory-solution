const db = require("../dataBase/connection");
const bcrypt = require("bcryptjs");
const { validateDocument } = require("../utils/documentValidation");

/*GUARDS*/

function ensureUserTypeExists(result) {
    if (result.rows.length === 0) {
        throw new Error("Tipo de usuário inválido");
    }
}

function ensureUserExists(result) {
    if (result.rows.length === 0) {
        throw new Error("Usuário não encontrado");
    }
}

function ensureVendorDataProvided(isVendorType, commissionPercent) {
    if (!isVendorType) return;

    if (commissionPercent === undefined) {
        throw new Error("commission_percent é obrigatório para vendedores");
    }
}

/*CREATE USER*/

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

        /* valida documento */
        const { value: cleanDocument } = validateDocument(document);

        /* hash senha */
        const hashedPassword = await bcrypt.hash(password, 10);

        /* busca user_type (fonte da verdade) */
        const userTypeResult = await client.query(
            `SELECT name FROM user_types WHERE id = $1`,
            [user_type_id]
        );

        ensureUserTypeExists(userTypeResult);

        const userTypeName = userTypeResult.rows[0].name;

        const isVendorType =
            userTypeName === "representante" ||
            userTypeName === "distribuidor" ||
            userTypeName === "vendedor_fabrica";

        ensureVendorDataProvided(isVendorType, commission_percent);

        /* cria usuário */
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
                userTypeName,   // role ESPELHA user_type.name
                cleanDocument
            ]
        );

        const user = createUser.rows[0];

        /* cria vendor + wallet SOMENTE se o user_type mandar */
        if (isVendorType) {
            const createVendor = await client.query(
                `
                INSERT INTO vendors
                (user_id, vendor_type, commission_percent)
                VALUES ($1,$2,$3)
                RETURNING id
                `,
                [
                    user.id,
                    userTypeName.toUpperCase(), 
                    commission_percent
                ]
            );

            const vendorId = createVendor.rows[0].id;

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
}

/* GET / UPDATE / DELETE */
async function getUsersService() {
    const result = await db.query(
        `
        SELECT
            id,
            user_type_id,
            name,
            email,
            phone,
            document,
            role,
            created_at
        FROM users
        ORDER BY id DESC
        `
    );

    return result.rows;
}

async function updateUserService(userId, data) {
    const { name, email, phone } = data;
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const exists = await client.query(
            `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        ensureUserExists(exists);

        const updated = await client.query(
            `
            UPDATE users
            SET
                name  = COALESCE($1, name),
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

async function deleteUserService(userId) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const exists = await client.query(
            `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
            [userId]
        );

        ensureUserExists(exists);

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
