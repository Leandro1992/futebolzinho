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

            return userData;
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

}
module.exports = User;