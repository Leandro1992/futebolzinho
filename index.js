
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const Jogadores = require("./models/jogadores");
const Partidas = require("./models/partidas");
const PartidasAvulsas = require("./models/partida-avulsa");
const User = require("./models/user");
const cors = require('cors');
const cache = require('./models/cache');
const Backup = require('./models/backup');
const { Console } = require('console');
let serviceAccount;
try {
    serviceAccount = require('./credenciais.json');
} catch (error) {
    console.log("Rodando em ambiente produtivo")
}


app.listen(PORT, () => {
    console.log(`Servidor está ouvindo na porta ${PORT}`);
});

app.use(express.json());
app.use(cors());

app.use('/', express.static(path.resolve(__dirname + '/public/browser')));

// app.get('/*', function(req, res) {
//     res.sendFile(path.join(__dirname, '/public/browser'));
// });

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];

    let key = serviceAccount && serviceAccount.private_key_id ? serviceAccount.private_key_id : process.env.private_key_id;

    if (!token) {
      return res.status(403).send('Token não fornecido');
    }
    
    if (token !== `Bearer ${key}`) {
      return res.status(403).send('Token inválido');
    }
  
    next();
};


//LOGIN / REGISTRO

//==============================================================================================================================//
app.post('/login', async (req, res) => {
    try {
        const token = await User.login(req.body);
        res.status(200).send({ success: true, token });
    } catch (error) {
        res.status(400).send({ success: false, error: error.message });
    }
});


app.post('/register', authenticate,  async (req, res) => {
    try {
        const user = await User.register(req.body);
        res.status(200).send({ success: true, user });
    } catch (error) {
        res.status(400).send({ success: false, error: error.message });
    }
});

//CRUD jogadores

//==============================================================================================================================//
app.get('/jogadores', async (req, res) => {
    try {
        let todos = await Jogadores.obterTodos()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.post('/jogadores', async (req, res) => {
    try {
        let jogador = new Jogadores(req.body);
        const data = await jogador.salvar();
        res.status(201).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar jogador ' + error.message });
    }
});


app.put('/jogadores', async (req, res) => {
    const jogador = new Jogadores(req.body); // ou obtenha a instância de outra forma
    jogador.atualizarDados(req.body)
        .then((mensagem) => {
            res.status(201).json({ data: mensagem });
        })
        .catch((error) => {
            console.error('Erro ao atualizar dados do jogador:', error.message);
            res.status(500).json({ error: error.message });
        });
});

//==============================================================================================================================//


//CRUD partidas

//==============================================================================================================================//
app.get('/partidas', async (req, res) => {
    try {
        let todos = await Partidas.obterTodas()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.get('/estatisticas', async (req, res) => {
    try {
        const { dataInicial, dataFim } = req.query;
        let todos = await Partidas.obterEstatisticasPartidas(dataInicial, dataFim);
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.post('/partidas', async (req, res) => {
    try {
        let partida = new Partidas(req.body);
        partida.salvar();
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});

app.put('/partidas', async (req, res) => {
    try {
        let partida = Partidas.atualizarPartida(req.body);
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});

//CRUD partidas avulsas

//==============================================================================================================================//
app.get('/partida-avulsa', async (req, res) => {
    try {
        let todos = await PartidasAvulsas.obterTodas()
        res.status(200).json({ data: todos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});

app.post('/partida-avulsa', async (req, res) => {
    try {
        let partida = new PartidasAvulsas(req.body);
        partida.salvar();
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});

app.put('/partida-avulsa', async (req, res) => {
    try {
        let partida = PartidasAvulsas.atualizarPartida(req.body);
        res.status(201).json({ data: partida });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar partida ' + error.message });
    }
});

//==============================================================================================================================//

//BACKUPS /RESTORE

app.get('/backup', async (req, res) => {
    try {
        const backup = new Backup();
        backup.fazerBackup().then(() => {
            console.log('Backup completo');
        }).catch(error => {
            console.error('Erro ao fazer backup:', error);
        });
        res.status(200).json("backupeou bonito!");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
});
app.get('/restore-backup', async (req, res) => {
    try {
        const { data } = req.query; // Extrai o parâmetro de consulta 'data'
        if (!data) {
            return res.status(400).json({ error: 'O parâmetro "data" é obrigatório' });
        }

        const backup = new Backup();
        console.log('Data específica para restauração:', data);

        await backup.restaurarBackup(data);
        console.log('Restauração completa');
        res.status(200).json({ message: 'Restaurou o backup' });
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
});
app.get('/list-backup', async (req, res) => {
    try {
        const backup = new Backup();
        const backups = await backup.listarBackups();
        console.log('Restauração completa');
        res.status(200).json(backups);
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        res.status(500).json({ error: 'Erro ao restaurar backup' });
    }
});

app.get('/cache', async (req, res) => {
    try {
        cache.clear()
        res.status(200).json("cache limpinho!");
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao limpar o cache' });
    }
});