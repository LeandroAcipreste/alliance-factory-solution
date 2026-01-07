const db = require("../dataBase/connection");

/* -----------------------------------------
   VALIDAÇÃO OFICIAL DE CPF
----------------------------------------- */
function validarCPF(cpf) {
    const clean = cpf.replace(/\D/g, "");

    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(clean.charAt(i)) * (10 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(clean.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(clean.charAt(i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(clean.charAt(10))) return false;

    return true;
}

/* -----------------------------------------
   VALIDAÇÃO OFICIAL DE CNPJ
----------------------------------------- */
function validarCNPJ(cnpj) {
    const clean = cnpj.replace(/\D/g, "");

    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += parseInt(clean.charAt(i)) * pesos1[i];
    }

    let resto = soma % 11;
    let dig1 = resto < 2 ? 0 : 11 - resto;
    if (dig1 !== parseInt(clean.charAt(12))) return false;

    soma = 0;
    for (let i = 0; i < 13; i++) {
        soma += parseInt(clean.charAt(i)) * pesos2[i];
    }

    resto = soma % 11;
    let dig2 = resto < 2 ? 0 : 11 - resto;
    if (dig2 !== parseInt(clean.charAt(13))) return false;

    return true;
}

/* -----------------------------------------
   VALIDAÇÃO DE DOCUMENTO
----------------------------------------- */
function validarDocumento(document) {
    const clean = document.replace(/\D/g, "");

    if (clean.length === 11) {
        if (!validarCPF(clean)) throw new Error("CPF inválido.");
        return { value: clean, type: "CPF" };
    }

    if (clean.length === 14) {
        if (!validarCNPJ(clean)) throw new Error("CNPJ inválido.");
        return { value: clean, type: "CNPJ" };
    }

    throw new Error("Documento deve ser CPF (11) ou CNPJ (14).");
}

/* -----------------------------------------
   CREATE CLIENT (COM TRANSACTION)
----------------------------------------- */
async function createClient(clientData) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const { vendor_id, name, email, phone, document } = clientData;

        if (!vendor_id || !name || !document) {
            throw new Error("Vendedor, nome e documento são obrigatórios.");
        }

        const { value: documentValue, type: documentType } =
            validarDocumento(document);

        const exists = await client.query(
            "SELECT id FROM clients WHERE document = $1 FOR UPDATE",
            [documentValue]
        );

        if (exists.rows.length > 0) {
            throw new Error(`${documentType} já cadastrado.`);
        }

        const result = await client.query(
            `INSERT INTO clients
                (vendor_id, name, email, phone, document, document_type)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING 
                id,
                vendor_id,
                name,
                email,
                phone,
                document,
                document_type`,
            [
                vendor_id,
                name,
                email || null,
                phone || null,
                documentValue,
                documentType
            ]
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

/* -----------------------------------------
   GET ALL CLIENTS (SEM TRANSACTION)
----------------------------------------- */
async function getAllClientsService() {
    const result = await db.query(
        `SELECT 
            id,
            vendor_id,
            name,
            email,
            phone,
            document,
            document_type,
            created_at
         FROM clients
         ORDER BY id DESC`
    );

    return result.rows;
}

/* -----------------------------------------
   UPDATE CLIENT (PATCH COM TRANSACTION)
----------------------------------------- */
async function updateClient(clientId, clientData) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const { name, email, phone } = clientData;

        if (!name && !email && !phone) {
            throw new Error("Nenhum dado válido para atualização.");
        }

        const exists = await client.query(
            "SELECT id FROM clients WHERE id = $1 FOR UPDATE",
            [clientId]
        );

        if (exists.rows.length === 0) {
            throw new Error("Cliente não encontrado.");
        }

        const result = await client.query(
            `UPDATE clients
             SET
                name = COALESCE($1, name),
                email = COALESCE($2, email),
                phone = COALESCE($3, phone)
             WHERE id = $4
             RETURNING
                id,
                vendor_id,
                name,
                email,
                phone,
                document,
                document_type`,
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

/* -----------------------------------------
   DELETE CLIENT (COM TRANSACTION)
----------------------------------------- */
async function deleteClient(clientId) {
    const client = await db.getClient();

    try {
        await client.query("BEGIN");

        const exists = await client.query(
            "SELECT id FROM clients WHERE id = $1 FOR UPDATE",
            [clientId]
        );

        if (exists.rows.length === 0) {
            throw new Error("Cliente não encontrado.");
        }

        await client.query(
            "DELETE FROM clients WHERE id = $1",
            [clientId]
        );

        await client.query("COMMIT");
        return { message: "Cliente removido com sucesso." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createClient,
    getAllClientsService,
    updateClient,
    deleteClient
};
