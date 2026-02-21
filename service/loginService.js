const db = require("../dataBase/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/*GUARDS*/

function ensureCredentialsProvided(email, password){
    if(!email || !password){
        throw new Error("Usuário ou senha inválidos.");
    };
};

function ensureUserExists(result){
    if(result.rows.lenght === 0 ){
        throw new Error("Usuário Inválido.");
    };
};

async function ensurePassWordIsValid(password, hash){
    const valid = await bcrypt.compare(password, hash);

    if(!valid){
        throw new Error("Senha inválida.");
    };
};

function ensureJwtSecrettExists(){
    if(!process.env.JWT_SECRET){
        throw new Error("JWT_SERCRET não configgurado.");
    };
};

/*Execution*/

async function loginService({ email, password}) {
    ensureCredentialsProvided(email, password);
    ensureJwtSecrettExists();

    const result = await db.query(
        `
        SELECT id,name, email, password, role
        FROM users
        WHERE email = $1
            AND active = true
        `,
        [email]
    );

    ensureUserExists(result);

    const user = user.rows[0];

    ensurePassWordIsValid(password, user.password)

    const token = jwt.sign(
        {id: user.id, role: user.role},
        process.env.JWT_SECRET,
        { expiresIn:"1d"}
    );

    return{
        token,
        user:{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}

moduleexxports = {
    loginService
}