import { Component } from '@angular/core';
import { JogadorService } from './jogadores.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-jogadores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jogadores.component.html',
  styleUrl: './jogadores.component.css'
})
export class JogadoresComponent {
  jogadores: any[] = [];
  jogador: any = { nome: "", mensalista: true }; // Objeto para armazenar dados do jogador
  filtro: string = '';
  campoOrdenacao: string = 'nome';
  direcaoOrdenacao: string = 'asc';

  constructor(private jogadorService: JogadorService) { }

  ngOnInit(): void {
    // Carregar a lista de jogadores ao inicializar o componente
    this.carregarJogadores();
  }

  ordenarPor(campo: string): void {
    this.direcaoOrdenacao = this.direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
  }

  filtrarEOrdenarJogadores(): any[] {
    return this.jogadores
      .filter(jogador => jogador.nome.toLowerCase().includes(this.filtro.toLowerCase()))
      .sort((a, b) => {
        const campoA = a[this.campoOrdenacao];
        const campoB = b[this.campoOrdenacao];
        const comparacao = campoA.localeCompare(campoB);

        return this.direcaoOrdenacao === 'asc' ? comparacao : -comparacao;
      });
  }


  novoJogador(): void {
    this.jogador = {}; // Limpa os dados existentes antes de abrir o modal
  }

  editarJogador(jogador: any): void {
    this.jogador = { ...jogador }; // Clona os dados do jogador antes de abrir o modal
  }


  salvarJogador() {
    console.log(this.jogador)
    this.jogadorService.criarJogador(this.jogador).subscribe({
      next: (novo_jogador: any) => {
        console.log("novo jogador", novo_jogador);
        this.jogador = novo_jogador.data;
        this.atualizarLista();
      },
      error: (error) => {
        console.log("erro ao carregar jogadores", error);
        console.error('Erro ao carregar jogadores:', error);
      }
    });
    this.fecharModal();
  }

  salvarEdicaoJogador() {
    console.log(this.jogador)
    this.jogadorService.editarJogador(this.jogador).subscribe({
      next: (novo_jogador: any) => {
        console.log("jogador editado", novo_jogador);
        this.atualizarLista();
      },
      error: (error) => {
        console.log("erro ao carregar jogadores", error);
        console.error('Erro ao carregar jogadores:', error);
      }
    });
  }

  fecharModal(): void {
    const botaoEdita = document.getElementById("fecharModalEditaJogador");
    const botaoSalva = document.getElementById("fecharModalJogador");

    if (botaoEdita) {
      botaoEdita.click();
    }

    if (botaoSalva) {
      botaoSalva.click();
    }

  }

  atualizarLista() {
    const index = this.jogadores.findIndex(j => j.id === this.jogador.id);
    if (index !== -1) {
      this.jogadores[index] = { ...this.jogador };
    }else{
      this.jogadores.push(this.jogador)
    }
    this.jogador = {};
    this.fecharModal();
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
