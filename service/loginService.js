const db = require("../dataBase/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function loginService({ email, password }) {
    const result = await db.query(
        `SELECT id, name, email, password, role
         FROM users
         WHERE email = $1 AND active = true`,
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error("Usuário ou senha inválidos");
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        throw new Error("Usuário ou senha inválidos");
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}

module.exports = { loginService };
