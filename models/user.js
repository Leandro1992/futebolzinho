// models/Jogador.js
const FirebaseConnection = require('../db');
const { signInWithEmailAndPassword } = require('firebase/auth');

class User {
    constructor() { }

    static async login({ email, password }) {
        try {
            const auth = FirebaseConnection.getInstance().auth;
            console.log(auth)
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            return token;
        } catch (error) {
            console.log(error)
            return error;
        }
    }

    static async register({ email, password }) {
        try {
            const admin = FirebaseConnection.getInstance().auth;
            const userRecord = await admin.auth().createUser({
                email: email,
                password: password
            });
            return { uid: userRecord.uid };
        } catch (error) {
            return error;
        }
    }

}
module.exports = User;