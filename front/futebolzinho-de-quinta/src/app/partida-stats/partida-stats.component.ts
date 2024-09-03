import { Component, OnInit  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PartidaStatsService } from './partida-stats.service';


interface Jogador {
  nome: string;
  posicao: string;
  numero: number;
  gols: number;
  assistencias: number;
  falhas: number;
  acertos: number;
  amarelo: number;
  vermelho: number;
  finalizacoes: number;
  finalizacoesAlvo: number;
  mando_campo: string; 
}

interface Partida {
  id: string;
  nome: string;
  local: string;
  data: Date;
  encerrada: boolean;
  jogadores: Jogador[];
}

@Component({
  selector: 'app-partida-stats',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './partida-stats.component.html',
  styleUrl: './partida-stats.component.css'
})

export class PartidaStatsComponent implements OnInit {

  isCollapsed: { [key: string]: boolean } = {};
  isPlayerCollapsed: { [key: string]: boolean } = {};
  novaPartida: Partida = {id:'', nome: '', local: '', data: new Date(), jogadores: [], encerrada: false };
  novoJogador: Jogador = {
    nome: '',
    numero: 0,
    posicao: '',
    gols: 0,
    assistencias: 0,
    falhas: 0,
    acertos: 0,
    amarelo: 0,
    vermelho: 0,
    finalizacoes: 0,
    finalizacoesAlvo: 0,
    mando_campo: "casa"
  };
  partidas: Partida[] = [];

  constructor(private partidaStatsService: PartidaStatsService) { }

  ngOnInit(): void {
    this.loadPartidas();
  }

  loadPartidas(): void {
    this.partidaStatsService.getPartidas().subscribe(partidas => this.partidas = partidas);
  }

  savePartida(): void {
    console.log(this.novaPartida, "nova partida")
    if (this.novaPartida.id) {
      this.partidaStatsService.updatePartida(this.novaPartida).subscribe(() => this.loadPartidas());
    } else {
      this.partidaStatsService.addPartida(this.novaPartida).subscribe(() => this.loadPartidas());
    }
  }
 
  // partidas = [
  //   {
  //     nome: 'Final do Campeonato',
  //     local: 'Estádio Nacional',
  //     encerrada: false,
  //     jogadores: [
  //       { nome: 'João Silva', numero: 10, posicao: 'Atacante', gols: 2, assistencias: 1, falhas: 0, acertos: 5, amarelo: 1, vermelho: 0, finalizacoes: 7, finalizacoesAlvo: 4, mando_campo: "casa" },
  //       { nome: 'Carlos Pereira', numero: 8, posicao: 'Meio-campo', gols: 1, assistencias: 2, falhas: 1, acertos: 7, amarelo: 0, vermelho: 0, finalizacoes: 3, finalizacoesAlvo: 2, mando_campo: "casa" },
  //       { nome: 'Lucas Mendes', numero: 5, posicao: 'Zagueiro', gols: 0, assistencias: 0, falhas: 3, acertos: 4, amarelo: 2, vermelho: 1, finalizacoes: 0, finalizacoesAlvo: 0, mando_campo: "fora" }
  //     ]
  //   },
  //   {
  //     nome: 'Amistoso Internacional',
  //     local: 'Arena da Cidade',
  //     encerrada: false,
  //     jogadores: [
  //       { nome: 'Pedro Oliveira', numero: 9, posicao: 'Atacante', gols: 3, assistencias: 0, falhas: 1, acertos: 6, amarelo: 1, vermelho: 0, finalizacoes: 9, finalizacoesAlvo: 6, mando_campo: "fora" },
  //       { nome: 'André Souza', numero: 7, posicao: 'Meio-campo', gols: 1, assistencias: 3, falhas: 0, acertos: 8, amarelo: 0, vermelho: 0, finalizacoes: 4, finalizacoesAlvo: 3, mando_campo: "fora" },
  //       { nome: 'Ricardo Santos', numero: 4, posicao: 'Zagueiro', gols: 0, assistencias: 1, falhas: 2, acertos: 3, amarelo: 1, vermelho: 0, finalizacoes: 1, finalizacoesAlvo: 0, mando_campo: "casa" }
  //     ]
  //   }
  // ];

  adicionarJogador() {
    this.novaPartida.jogadores.push({ ...this.novoJogador });
    this.novoJogador = {
      nome: '',
      posicao: '',
      numero: 0,
      gols: 0,
      assistencias: 0,
      falhas: 0,
      acertos: 0,
      amarelo: 0,
      vermelho: 0,
      finalizacoes: 0,
      finalizacoesAlvo: 0,
      mando_campo: "casa"
    };
  }

  removerJogador(index: number) {
    this.novaPartida.jogadores.splice(index, 1);
  }

  adicionarPartida() {
    this.partidas.push({ ...this.novaPartida });
    this.novaPartida = {id:'', nome: '', local: '', encerrada: false, data: new Date(), jogadores: [] };
  }

  isPartidaValida(): boolean {
    const partidaPreenchida = !!this.novaPartida.nome && !!this.novaPartida.local && !!this.novaPartida.data;
    const jogadoresSuficientes = Array.isArray(this.novaPartida.jogadores) && this.novaPartida.jogadores.length >= 2;
    return partidaPreenchida && jogadoresSuficientes;
  }

  isJogadorValido(): boolean {
    const jogadorPreenchido = !!this.novoJogador.nome && !!this.novoJogador.posicao && !!this.novoJogador.numero && !!this.novoJogador.mando_campo;
    return jogadorPreenchido;
  }

  getJogadoresOrdenados(jogadores: Jogador[]): Jogador[] {
    return jogadores.sort((a, b) => a.mando_campo.localeCompare(b.mando_campo));
  }

  toggleCollapse(partidaId: string): void {
    this.isCollapsed[partidaId] = !this.isCollapsed[partidaId];
  }

  togglePlayerCollapse(jogadorId: string): void {
    console.log(jogadorId, this.isPlayerCollapsed[jogadorId],  this.isPlayerCollapsed)
    this.isPlayerCollapsed[jogadorId] = !this.isPlayerCollapsed[jogadorId];
  }

  alterarValor(jogador: Jogador, atributo: keyof Jogador, valor: number) {
  if (typeof jogador[atributo] === 'number') {
    (jogador[atributo] as number) += valor;
    if ((jogador[atributo] as number) < 0) {
      (jogador[atributo] as number) = 0 as any;  // Evita valores negativos
    }
  }
}
}
