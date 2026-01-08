// models/Jogador.js
const FirebaseConnection = require('../db');
const saltRounds = 10;
const bcrypt = require('bcrypt');

class User {
    constructor() {

    }

    static async login({ email, password }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const usersRef = db.collection('user');
            const query = usersRef.where('email', '==', email);

            const snapshot = await query.get();
            if (snapshot.empty) {
                throw new Error('Usuário não encontrado.');
            }

            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();

            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                throw new Error('Senha incorreta.');
            }

            // Retornar o token de autenticação (private_key_id)
            let serviceAccount;
            try {
                serviceAccount = require('../credenciais.json');
            } catch (error) {
                serviceAccount = {
                    private_key_id: process.env.private_key_id
                };
            }

            return serviceAccount.private_key_id;
        } catch (error) {
            throw error; // Rejeita a Promise com o erro original
        }
    }


    static async register({ email, password, admin }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const usersRef = db.collection('user');
            const query = usersRef.where('email', '==', email);

            const snapshot = await query.get();
            if (!snapshot.empty) {
                throw new Error('Usuário já cadastrado.');
            }

            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const user = await db.collection('user').add({
                data: new Date().toISOString(),
                email,
                password: hashedPassword,
                admin,
                status: true
            });

            const userData = await user.get();
            return userData.data();
        } catch (error) {
            throw error; // Rejeita a Promise com o erro original
        }
    }

    static async obterTodos() {
        try {
            const db = FirebaseConnection.getInstance().db;
            const usersSnapshot = await db.collection('user').get();
            const users = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                // Não retornar a senha
                delete data.password;
                return {
                    id: doc.id,
                    ...data
                };
            });
            return users;
        } catch (error) {
            throw new Error('Erro ao obter usuários: ' + error.message);
        }
    }

    static async buscarPorId(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const userDoc = await db.collection('user').doc(id).get();

            if (!userDoc.exists) {
                throw new Error('Usuário não encontrado.');
            }

            const userData = userDoc.data();
            delete userData.password;
            return { id: userDoc.id, ...userData };
        } catch (error) {
            throw new Error('Erro ao buscar usuário: ' + error.message);
        }
    }

    static async atualizarDados({ id, email, password, admin, status }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const updateData = {
                email,
                admin,
                status
            };

            // Só atualizar senha se foi fornecida
            if (password) {
                updateData.password = await bcrypt.hash(password, saltRounds);
            }

            await db.collection('user').doc(id).update(updateData);

            const userDoc = await db.collection('user').doc(id).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                delete userData.password;
                return { id, ...userData };
            } else {
                throw new Error('Usuário não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao atualizar usuário: ' + error.message);
        }
    }

    static async atualizarPerfil({ email, emailNovo, password, passwordNova }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const usersRef = db.collection('user');
            
            // Buscar usuário pelo email atual
            const query = usersRef.where('email', '==', email);
            const snapshot = await query.get();

            if (snapshot.empty) {
                throw new Error('Usuário não encontrado.');
            }

            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();

            // Verificar senha atual
            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                throw new Error('Senha atual incorreta.');
            }

            const updateData = {};

            // Atualizar email se fornecido
            if (emailNovo && emailNovo !== email) {
                // Verificar se novo email já existe
                const emailExists = await usersRef.where('email', '==', emailNovo).get();
                if (!emailExists.empty) {
                    throw new Error('Este email já está em uso.');
                }
                updateData.email = emailNovo;
            }

            // Atualizar senha se fornecida
            if (passwordNova) {
                updateData.password = await bcrypt.hash(passwordNova, saltRounds);
            }

            if (Object.keys(updateData).length > 0) {
                await db.collection('user').doc(userDoc.id).update(updateData);
            }

            const updatedUserData = {
                id: userDoc.id,
                email: updateData.email || email,
                admin: userData.admin,
                status: userData.status
            };

            return updatedUserData;
        } catch (error) {
            throw new Error('Erro ao atualizar perfil: ' + error.message);
        }
    }

    static async excluir(id) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('user').doc(id).delete();
            return { message: 'Usuário excluído com sucesso.' };
        } catch (error) {
            throw new Error('Erro ao excluir usuário: ' + error.message);
        }
    }

}
module.exports = User;