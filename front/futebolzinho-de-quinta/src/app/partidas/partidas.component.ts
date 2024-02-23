import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JogadorService } from '../jogadores/jogadores.service';
import { PartidaService } from './partidas.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-partidas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partidas.component.html',
  styleUrl: './partidas.component.css'
})
export class PartidasComponent {
  jogadores: any[] = [];
  partidas: any[] = [];
  jogadorSelecionado: any;
  partidaTemp: any
  melhorDaPartidaTemp: any[] = [];

  constructor(private jogadorService: JogadorService, private partidaService: PartidaService, private router: Router) { }

  ngOnInit(): void {
    this.carregarJogadores();
    this.carregarPartidas();
  }

  salvarMelhorPartida(): void {
    console.log(this.jogadorSelecionado);
    console.log(this.partidaTemp);

    const partidaEncontrada = this.partidas.find(part => part.id === this.partidaTemp.id);
    if (partidaEncontrada) {
      let jogadorEncontrado = partidaEncontrada.timeA.find((jog: { id: any; }) => jog.id === this.jogadorSelecionado);
      if (jogadorEncontrado) {
        jogadorEncontrado.destaque = true;
      } else {
        jogadorEncontrado = partidaEncontrada.timeB.find((jog: { id: any; }) => jog.id === this.jogadorSelecionado);
        if (jogadorEncontrado) {
          jogadorEncontrado.destaque = true;
        }
      }

      partidaEncontrada.status = 1;
    }
    this.fecharModal();
    this.salvarPartida(partidaEncontrada)
  }

  salvarPartida(partidaEncontrada: any): void {
    console.log(partidaEncontrada)
    this.partidaService.editarPartidas(partidaEncontrada).subscribe({
      next: (partidas: any) => {
        console.log("partidas?", partidas);
        alert("Partida atualizada com sucesso")
      },
      error: (error) => {
        console.log("erro ao carregar jogadores", error);
        console.error('Erro ao carregar jogadores:', error);
      }
    });
  }

  fecharModal(): void {
    const botaoSalva = document.getElementById("fecharMelhorDaPartidaModal");
    if (botaoSalva) {
      botaoSalva.click();
    }
  }

  selecionarPartidaEncerrar(partida: any): void {
    this.partidaTemp = partida;
    this.melhorDaPartidaTemp = [...partida.timeA, ...partida.timeB];
    console.log(this.partidaTemp, this.melhorDaPartidaTemp);
  }

  atualizarPartidaGol(partida: any, jogador: any, tipo: number, time: string): void {
    // Implemente a lógica para adicionar a partida
    const partidaEncontrada = this.partidas.find(part => part.id === partida);
    if (partidaEncontrada) {
      if (time == 'A') {
        const jogadorEncontrado = partidaEncontrada.timeA.find((jog: { id: any; }) => jog.id === jogador);
        console.log(jogadorEncontrado, "Jogador selecionado")
        if (tipo == 1) {
          jogadorEncontrado.gol += 1;
        } else {
          if (jogadorEncontrado.gol > 0) {
            jogadorEncontrado.gol -= 1;
          }
        }
      } else {
        const jogadorEncontrado = partidaEncontrada.timeB.find((jog: { id: any; }) => jog.id === jogador);
        console.log(jogadorEncontrado, "Jogador selecionado")
        if (tipo == 1) {
          jogadorEncontrado.gol += 1;
        } else {
          if (jogadorEncontrado.gol > 0) {
            jogadorEncontrado.gol -= 1;
          }
        }
      }
      this.partidaService.editarPartidas(partidaEncontrada).subscribe({
        next: (partidas: any) => {
          console.log("partidas?", partidas);
          alert("Partida atualizada com sucesso")
        },
        error: (error) => {
          console.log("erro ao carregar jogadores", error);
          console.error('Erro ao carregar jogadores:', error);
        }
      });
    }
  }

  atualizarPartidaAssitencia(partida: any, jogador: any, tipo: number, time: string): void {
    // Implemente a lógica para adicionar a partida
    console.log(partida, jogador, tipo, time, "Teste");
    const partidaEncontrada = this.partidas.find(part => part.id === partida);
    if (partidaEncontrada) {
      if (time == 'A') {
        const jogadorEncontrado = partidaEncontrada.timeA.find((jog: { id: any; }) => jog.id === jogador);
        console.log(jogadorEncontrado, "Jogador selecionado")
        if (tipo == 1) {
          jogadorEncontrado.assistencia += 1;
        } else {
          if (jogadorEncontrado.assistencia > 0) {
            jogadorEncontrado.assistencia -= 1;
          }
        }
      } else {
        const jogadorEncontrado = partidaEncontrada.timeB.find((jog: { id: any; }) => jog.id === jogador);
        console.log(jogadorEncontrado, "Jogador selecionado")
        if (tipo == 1) {
          jogadorEncontrado.assistencia += 1;
        } else {
          if (jogadorEncontrado.assistencia > 0) {
            jogadorEncontrado.assistencia -= 1;
          }
        }
      }
      this.partidaService.editarPartidas(partidaEncontrada).subscribe({
        next: (partidas: any) => {
          console.log("partidas?", partidas);
        },
        error: (error) => {
          console.log("erro ao carregar jogadores", error);
          console.error('Erro ao carregar jogadores:', error);
        }
      });
    }
  }

  criarNovaPartida(): void {
    this.router.navigate(['/partida-form', { jogadores: JSON.stringify(this.jogadores) }]);
  }

  obterNomeJogador(id: string): string | undefined {
    const jogador = this.jogadores.find(j => j.id === id);
    return jogador ? jogador.nome : undefined;
  }


  carregarPartidas(): void {
    this.partidaService.getPartidas().subscribe({
      next: (partidas: any) => {
        console.log("partidas?", partidas);
        this.partidas = partidas.data.map((partida: any) => ({ ...partida, expandido: false }));
        this.partidas.sort((a, b) => {
          return new Date(b.data).getTime() - new Date(a.data).getTime();
        })
      },
      error: (error) => {
        console.log("erro ao carregar jogadores", error);
        console.error('Erro ao carregar jogadores:', error);
      }
    });
  }

  toggleDetalhes(partida: any): void {
    partida.expandido = !partida.expandido;
  }

  carregarJogadores(): void {
    this.jogadorService.getJogadores().subscribe({
      next: (jogadores: any) => {
        console.log("jogadores?", jogadores);
        this.jogadores = jogadores.data;
      },
      error: (error) => {
        console.log("erro ao carregar jogadores", error);
        console.error('Erro ao carregar jogadores:', error);
      }
    });
  }
}

