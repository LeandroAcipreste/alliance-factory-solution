const { getUsersService,
        createUserService,
        updateUserService,
        deleteUserService,

    } = require("../service/usersService");


    async function getUsersController(req, res) {
    try {
        const users = await getUsersService();
        return res.json(users);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}

async function createUserController(req, res) {
    try {
        const user = await createUserService(req.body);
        return res.status(201).json(user);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}


function updateUserController(req, res) {
    try {
        const id = req.params.id;
        const updated = updateUserService(id, req.body);
        res.send(updated);
    } catch (err) {
        res.status(422).send(err.message);
    }
}

function deleteUserController(req, res) {
    try {
        const id = req.params.id;
        const deleted = deleteUserService(id);
        res.send({ message: "Usuário deletado com sucesso.", deleted });
    } catch (err) {
        res.status(422).send(err.message);
    }
}

module.exports = {
    getUsersController,
    createUserController,
    updateUserController,
    deleteUserController
};
