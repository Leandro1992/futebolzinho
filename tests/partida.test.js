const Partida = require('../models/partidas');

describe('Partida', () => {
    let mockPartida;

    beforeEach(() => {
        mockPartida = new Partida({
            data: new Date(),
            local: 'Campo 1',
            timeA: [
                { id: '1', nome: 'Jogador 1' },
                { id: '2', nome: 'Jogador 2' }
            ],
            timeB: [
                { id: '3', nome: 'Jogador 3' },
                { id: '4', nome: 'Jogador 4' }
            ],
            status: 'AGENDADA'
        });
    });

    describe('Constructor', () => {
        it('deve criar uma instância de Partida com os valores corretos', () => {
            expect(mockPartida.local).toBe('Campo 1');
            expect(mockPartida.status).toBe('AGENDADA');
            expect(mockPartida.timeA).toHaveLength(2);
            expect(mockPartida.timeB).toHaveLength(2);
        });
    });

    describe('Validações', () => {
        it('deve ter times com o mesmo número de jogadores', () => {
            expect(mockPartida.timeA.length).toBe(mockPartida.timeB.length);
        });

        it('deve ter um local definido', () => {
            expect(mockPartida.local).toBeTruthy();
        });

        it('deve ter uma data válida', () => {
            expect(mockPartida.data instanceof Date).toBeTruthy();
        });
    });
}); 