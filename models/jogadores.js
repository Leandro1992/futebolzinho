// models/Jogador.js
const FirebaseConnection = require('../db');
const cache = require('./cache');
const bcrypt = require('bcrypt');

class Jogador {
    constructor({ nome, mensalista, email, senha, timeId }) {
        this.nome = nome;
        this.mensalista = mensalista;
        this.email = email || null;
        this.senha = senha || null;
        this.timeId = timeId || null;
    }

    async salvar() {
        try {
            const db = FirebaseConnection.getInstance().db;
            
            const jogadorData = {
                nome: this.nome,
                mensalista: this.mensalista
            };

            // Adicionar email se fornecido
            if (this.email) {
                jogadorData.email = this.email;
            }

            // Hash da senha se fornecida
            if (this.senha) {
                const saltRounds = 10;
                jogadorData.senhaHash = await bcrypt.hash(this.senha, saltRounds);
            }

            // Adicionar referência ao time se fornecido
            if (this.timeId) {
                jogadorData.timeRef = db.doc(`times/${this.timeId}`);
            }

            const jogadorRef = await db.collection('jogadores').add(jogadorData);
             const jogadorDoc = await jogadorRef.get();
             if (jogadorDoc.exists) {
                 const jogadorData = jogadorDoc.data();
                 jogadorData.id = jogadorRef.id;

                // Atualizar cache
                const jogadores = cache.get('jogadores') || [];
                jogadores.push(jogadorData);
                cache.set('jogadores', jogadores);

                return jogadorData
             } else {
                 console.log('Documento não encontrado.');
             }

        } catch (error) {
            throw new Error('Erro ao salvar jogador: ' + error.message);
        }
    }

    async atualizarDados({ id, nome, mensalista, email, senha, timeId }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            
            const updateData = {
                nome: nome,
                mensalista: mensalista
            };

            // Atualizar email se fornecido
            if (email !== undefined) {
                updateData.email = email;
            }

            // Atualizar senha se fornecida
            if (senha) {
                const saltRounds = 10;
                updateData.senhaHash = await bcrypt.hash(senha, saltRounds);
            }

            // Atualizar referência ao time se fornecido
            if (timeId !== undefined) {
                if (timeId) {
                    updateData.timeRef = db.doc(`times/${timeId}`);
                } else {
                    updateData.timeRef = null;
                }
            }

            await db.collection('jogadores').doc(id).update(updateData);

            const jogadorDoc = await db.collection('jogadores').doc(id).get();

            if (jogadorDoc.exists) {
                const jogadorData = jogadorDoc.data();
                // Atualizar cache
                const jogadores = cache.get('jogadores') || [];
                const index = jogadores.findIndex(j => j.id === id);
                if (index !== -1) {
                    jogadores[index] = { id, nome, mensalista };
                }
                cache.set('jogadores', jogadores);

                return jogadorData;
            } else {
                console.log('Documento não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
        }
    }
   
    async atualizarEstatiscasJogadores({ id, jogos, gols, assistencias, vitorias, derrotas, empate, destaque }) {
        try {
            const db = FirebaseConnection.getInstance().db;
            await db.collection('jogadores').doc(id).update({
                jogos: jogos,
                gols: gols,
                assistencias: assistencias,
                vitorias: vitorias,
                derrotas: derrotas,
                empate: empate,
                destaque: destaque,
            });

            const jogadorDoc = await db.collection('jogadores').doc(id).get();

            if (jogadorDoc.exists) {
                const jogadorData = jogadorDoc.data();
                // Atualizar cache
                const jogadores = cache.get('jogadores') || [];
                const index = jogadores.findIndex(j => j.id === id);
                if (index !== -1) {
                    jogadores[index] = { id, nome, mensalista };
                }
                cache.set('jogadores', jogadores);

                return jogadorData;
            } else {
                console.log('Documento não encontrado.');
            }
        } catch (error) {
            throw new Error('Erro ao atualizar dados do jogador: ' + error.message);
        }
    }


    static async obterTodos() {
        const cachedJogadores = cache.get('jogadores');
            if (cachedJogadores) {
                return cachedJogadores;
            }
        try {
            const db = FirebaseConnection.getInstance().db;
            const jogadoresSnapshot = await db.collection('jogadores').get();
            
            // Resolver referências de times
            const jogadores = await Promise.all(jogadoresSnapshot.docs.map(async doc => {
                const jogadorData = { id: doc.id, ...doc.data() };
                
                // Se tiver referência ao time, buscar dados do time
                if (jogadorData.timeRef) {
                    const timeSnapshot = await jogadorData.timeRef.get();
                    if (timeSnapshot.exists) {
                        jogadorData.time = { id: timeSnapshot.id, ...timeSnapshot.data() };
                    }
                    // Remover a referência do objeto retornado
                    delete jogadorData.timeRef;
                }
                
                // Remover senhaHash do objeto retornado por segurança
                delete jogadorData.senhaHash;
                
                return jogadorData;
            }));
            
            cache.set('jogadores', jogadores);
            return jogadores;
        } catch (error) {
            throw new Error('Erro ao obter jogadores: ' + error.message);
        }
    }

    static async buscarPorEmail(email) {
        try {
            const db = FirebaseConnection.getInstance().db;
            const jogadoresSnapshot = await db.collection('jogadores')
                .where('email', '==', email)
                .limit(1)
                .get();

            if (jogadoresSnapshot.empty) {
                return null;
            }

            const jogadorDoc = jogadoresSnapshot.docs[0];
            const jogadorData = { id: jogadorDoc.id, ...jogadorDoc.data() };

            // Buscar dados do time se houver referência
            if (jogadorData.timeRef) {
                const timeSnapshot = await jogadorData.timeRef.get();
                if (timeSnapshot.exists) {
                    jogadorData.time = { id: timeSnapshot.id, ...timeSnapshot.data() };
                }
                delete jogadorData.timeRef;
            }

            return jogadorData;
        } catch (error) {
            throw new Error('Erro ao buscar jogador por email: ' + error.message);
        }
    }

    static async autenticar(email, senha) {
        try {
            const jogador = await this.buscarPorEmail(email);
            
            if (!jogador) {
                return null;
            }

            if (!jogador.senhaHash) {
                throw new Error('Jogador não possui senha cadastrada.');
            }

            const senhaValida = await bcrypt.compare(senha, jogador.senhaHash);
            
            if (!senhaValida) {
                return null;
            }

            // Remover senhaHash antes de retornar
            delete jogador.senhaHash;
            
            return jogador;
        } catch (error) {
            throw new Error('Erro ao autenticar jogador: ' + error.message);
        }
    }

    // Adicione métodos de atualização e exclusão conforme necessário
}
module.exports = Jogador;