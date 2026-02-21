const db = require("../dataBase/connection");
const { validateDocument } = require("../utils/documentValidation");

/*GUARDS*/

function ensureVendorExists(result) {
    if (result.rows.length === 0) {
        throw new Error("Usuário não é um vendedor válido");
    }
}

function ensureClientOwnership(result) {
    if (result.rows.length === 0) {
        throw new Error("Cliente não encontrado ou acesso negado");
    }
}

/*CREATE CLIENT (VENDOR)*/

async function createClientService(data, loggedUserId) {
    const { name, email, phone, document } = data;

    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        /* valida documento */
        const { value: cleanDocument, type: documentType } =
            validateDocument(document);

        /* busca vendor */
        const vendorResult = await client.query(
            `SELECT id FROM vendors WHERE user_id = $1`,
            [loggedUserId]
        );

        ensureVendorExists(vendorResult);

        const vendorId = vendorResult.rows[0].id;

        /* cria cliente */
        const result = await client.query(
            `
            INSERT INTO clients
            (name, email, phone, document, document_type, vendor_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [name, email, phone, cleanDocument, documentType, vendorId]
        );

        await client.query("COMMIT");
        return result.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/*GET ALL CLIENTS (ADMIN)*/

async function getAllClientsService() {
    const result = await db.query(
        `
        SELECT
            c.id,
            c.name,
            c.email,
            c.phone,
            c.document,
            c.document_type,
            c.created_at,
            v.id AS vendor_id,
            v.vendor_type
        FROM clients c
        JOIN vendors v ON v.id = c.vendor_id
        ORDER BY c.id DESC
        `
    );

    return result.rows;
}

/*GET MY CLIENTS (VENDOR)*/

async function getMyClientsService(loggedUserId) {
    const result = await db.query(
        `
        SELECT
            c.id,
            c.name,
            c.email,
            c.phone,
            c.document,
            c.document_type,
            c.created_at
        FROM clients c
        JOIN vendors v ON v.id = c.vendor_id
        WHERE v.user_id = $1
        ORDER BY c.id DESC
        `,
        [loggedUserId]
    );

    return result.rows;
}

/*UPDATE CLIENT (VENDOR DONO)*/

async function updateClientService(clientId, data, loggedUserId) {
    const { name, email, phone } = data;

    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        /* lock + ownership */
        const exists = await client.query(
            `
            SELECT c.id
            FROM clients c
            JOIN vendors v ON v.id = c.vendor_id
            WHERE c.id = $1
              AND v.user_id = $2
            FOR UPDATE
            `,
            [clientId, loggedUserId]
        );

        ensureClientOwnership(exists);

        /* update */
        const result = await client.query(
            `
            UPDATE clients
            SET
                name  = COALESCE($1, name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone)
            WHERE id = $4
            RETURNING *
            `,
            [name, email, phone, clientId]
        );

        await client.query("COMMIT");
        return result.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

/*DELETE CLIENT (VENDOR DONO)*/

async function deleteClientService(clientId, loggedUserId) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        /* lock + ownership */
        const exists = await client.query(
            `
            SELECT c.id
            FROM clients c
            JOIN vendors v ON v.id = c.vendor_id
            WHERE c.id = $1
              AND v.user_id = $2
            FOR UPDATE
            `,
            [clientId, loggedUserId]
        );

        ensureClientOwnership(exists);

        await client.query(
            `DELETE FROM clients WHERE id = $1`,
            [clientId]
        );

        await client.query("COMMIT");
        return { message: "Cliente removido com sucesso" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createClientService,
    getAllClientsService,
    getMyClientsService,
    updateClientService,
    deleteClientService
};
