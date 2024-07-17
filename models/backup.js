const FirebaseConnection = require('../db');

class Backup {
  constructor() {}

  async fazerBackup() {
    try {
      const db = FirebaseConnection.getInstance().db;
      const jogadoresSnapshot = await db.collection('jogadores').get();
      const partidasSnapshot = await db.collection('partidas').get();

      // Extrair dados dos snapshots
      const jogadores = jogadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const partidas = partidasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      await db.collection('backup').add({
        data: new Date().toISOString(),
        partidas: partidas,
        jogadores: jogadores
      });

      console.log('Backup realizado com sucesso');
    } catch (error) {
      throw new Error('Erro ao fazer backup: ' + error.message);
    }
  }

  async restaurarBackup(dataEspecifica) {
    try {
      const db = FirebaseConnection.getInstance().db;
      const backupSnapshot = await db.collection('backup')
        .where('data', '==', dataEspecifica)
        .get();

      if (backupSnapshot.empty) {
        throw new Error('Nenhum backup encontrado para a data fornecida');
      }

      const backupData = backupSnapshot.docs[0].data();

      const batch = db.batch();

      // Restaurar jogadores
      backupData.jogadores.forEach(jogador => {
        const jogadorRef = db.collection('jogadores').doc(jogador.id);
        const { id, ...jogadorData } = jogador; // Excluir 'id' do objeto para evitar sobrescrever a chave do documento
        batch.set(jogadorRef, jogadorData);
      });

      // Restaurar partidas
      backupData.partidas.forEach(partida => {
        const partidaRef = db.collection('partidas').doc(partida.id);
        const { id, ...partidaData } = partida; // Excluir 'id' do objeto para evitar sobrescrever a chave do documento
        batch.set(partidaRef, partidaData);
      });

      await batch.commit();
      console.log('Restauração realizada com sucesso');
    } catch (error) {
      throw new Error('Erro ao restaurar backup: ' + error.message);
    }
  }

  async listarBackups() {
    try {
      const db = FirebaseConnection.getInstance().db;
      const backupSnapshot = await db.collection('backup').get();
      const backups = backupSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data().data }));
      return backups;
    } catch (error) {
      throw new Error('Erro ao listar backups: ' + error.message);
    }
  }
}

module.exports = Backup;
