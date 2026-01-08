import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DesculpasService, Desculpa, FiltrosDesculpa } from './desculpas.service';
import { JogadorService } from '../jogadores/jogadores.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-desculpas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './desculpas.component.html',
  styleUrl: './desculpas.component.css'
})
export class DesculpasComponent implements OnInit {
  desculpas: any[] = [];
  jogadores: any[] = [];
  isLoggedIn = false;
  
  // Filtros
  filtroJogadorId: string = '';
  filtroDataInicial: string = '';
  filtroDataFinal: string = '';
  
  // Nova desculpa
  novaDesculpa: Desculpa = {
    jogadorId: '',
    jogadorNome: '',
    data: '',
    descricao: ''
  };
  
  // Edição
  desculpaEmEdicao: any = null;
  
  constructor(
    private desculpasService: DesculpasService,
    private jogadorService: JogadorService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarJogadores();
    this.carregarDesculpas();
    
    this.authService.isLoggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
    
    // Definir data padrão como hoje
    const hoje = new Date().toISOString().split('T')[0];
    this.novaDesculpa.data = hoje;
  }

  carregarJogadores(): void {
    this.jogadorService.getJogadores().subscribe({
      next: (response: any) => {
        this.jogadores = response.data;
        this.jogadores.sort((a, b) => a.nome.localeCompare(b.nome));
      },
      error: (error) => {
        console.error('Erro ao carregar jogadores:', error);
        alert('Erro ao carregar jogadores');
      }
    });
  }

  carregarDesculpas(): void {
    const filtros: FiltrosDesculpa = {};
    
    if (this.filtroJogadorId) {
      filtros.jogadorId = this.filtroJogadorId;
    }
    if (this.filtroDataInicial) {
      filtros.dataInicial = this.filtroDataInicial;
    }
    if (this.filtroDataFinal) {
      filtros.dataFinal = this.filtroDataFinal;
    }
    
    this.desculpasService.getDesculpas(filtros).subscribe({
      next: (response: any) => {
        this.desculpas = response.data;
      },
      error: (error) => {
        console.error('Erro ao carregar desculpas:', error);
        alert('Erro ao carregar desculpas');
      }
    });
  }

  aplicarFiltros(): void {
    this.carregarDesculpas();
  }

  limparFiltros(): void {
    this.filtroJogadorId = '';
    this.filtroDataInicial = '';
    this.filtroDataFinal = '';
    this.carregarDesculpas();
  }

  onJogadorSelecionado(): void {
    const jogador = this.jogadores.find(j => j.id === this.novaDesculpa.jogadorId);
    if (jogador) {
      this.novaDesculpa.jogadorNome = jogador.nome;
    }
  }

  salvarDesculpa(): void {
    if (!this.novaDesculpa.jogadorId || !this.novaDesculpa.data || !this.novaDesculpa.descricao) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    this.desculpasService.criarDesculpa(this.novaDesculpa).subscribe({
      next: (response: any) => {
        alert('Desculpa registrada com sucesso!');
        this.resetarFormulario();
        this.carregarDesculpas();
      },
      error: (error) => {
        console.error('Erro ao salvar desculpa:', error);
        alert('Erro ao salvar desculpa');
      }
    });
  }

  resetarFormulario(): void {
    const hoje = new Date().toISOString().split('T')[0];
    this.novaDesculpa = {
      jogadorId: '',
      jogadorNome: '',
      data: hoje,
      descricao: ''
    };
  }

  editarDesculpa(desculpa: any): void {
    this.desculpaEmEdicao = { ...desculpa };
  }

  cancelarEdicao(): void {
    this.desculpaEmEdicao = null;
  }

  salvarEdicao(): void {
    if (!this.desculpaEmEdicao) return;

    const jogador = this.jogadores.find(j => j.id === this.desculpaEmEdicao.jogadorId);
    if (jogador) {
      this.desculpaEmEdicao.jogadorNome = jogador.nome;
    }

    this.desculpasService.editarDesculpa(this.desculpaEmEdicao.id, this.desculpaEmEdicao).subscribe({
      next: (response: any) => {
        alert('Desculpa atualizada com sucesso!');
        this.desculpaEmEdicao = null;
        this.carregarDesculpas();
      },
      error: (error) => {
        console.error('Erro ao atualizar desculpa:', error);
        alert('Erro ao atualizar desculpa');
      }
    });
  }

  excluirDesculpa(id: string): void {
    if (!confirm('Tem certeza que deseja excluir esta desculpa?')) {
      return;
    }

    this.desculpasService.excluirDesculpa(id).subscribe({
      next: (response: any) => {
        alert('Desculpa excluída com sucesso!');
        this.carregarDesculpas();
      },
      error: (error) => {
        console.error('Erro ao excluir desculpa:', error);
        alert('Erro ao excluir desculpa');
      }
    });
  }

  formatarData(data: string): string {
    if (!data) return '';
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  }
}
