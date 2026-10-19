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
  carregandoLista = true;
  listaPronta = false;
  salvando = false;

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
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }

  jogadoresMensalistas(): any[] {
    return this.filtrarEOrdenarJogadores().filter((jogador) => jogador.mensalista);
  }

  jogadoresAvulsos(): any[] {
    return this.filtrarEOrdenarJogadores().filter((jogador) => !jogador.mensalista);
  }


  novoJogador(): void {
    this.jogador = {}; // Limpa os dados existentes antes de abrir o modal
  }

  editarJogador(jogador: any): void {
    this.jogador = { ...jogador }; // Clona os dados do jogador antes de abrir o modal
  }


  salvarJogador() {
    if (!this.listaPronta || this.carregandoLista || this.salvando) return;
    const nome = (this.jogador?.nome || '').trim();
    if (!nome) return;

    this.salvando = true;
    this.jogadorService.criarJogador({ ...this.jogador, nome }).subscribe({
      next: (novo_jogador: any) => {
        this.jogador = novo_jogador.data;
        this.atualizarLista();
        this.salvando = false;
        this.fecharModal();
      },
      error: (error) => {
        this.salvando = false;
        console.error('Erro ao carregar jogadores:', error);
      }
    });
  }

  salvarEdicaoJogador() {
    console.log(this.jogador)
    this.jogadorService.editarJogador(this.jogador).subscribe({
      next: (novo_jogador: any) => {
        console.log("jogador editado", novo_jogador);
        this.atualizarLista();
      },
      error: (error) => {
        console.log("Erro ao carregar jogadores", error);
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
    this.carregandoLista = true;
    this.listaPronta = false;
    this.jogadorService.getJogadores().subscribe({
      next: (jogadores: any) => {
        this.jogadores = jogadores.data;
        this.listaPronta = true;
        this.carregandoLista = false;
      },
      error: (error) => {
        this.listaPronta = false;
        this.carregandoLista = false;
        console.error('Erro ao carregar jogadores:', error);
      }
    });
  }

}
