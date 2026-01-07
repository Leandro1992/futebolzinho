import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimesService } from './times.service';

@Component({
  selector: 'app-times',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './times.component.html',
  styleUrls: ['./times.component.css']
})
export class TimesComponent implements OnInit {
  times: any[] = [];
  timeForm: any = {
    nome: '',
    cor: '#000000',
    escudo: ''
  };
  editando: boolean = false;
  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(private timesService: TimesService) {}

  ngOnInit(): void {
    this.carregarTimes();
  }

  carregarTimes(): void {
    this.timesService.getTimes().subscribe({
      next: (response) => {
        this.times = response.data || [];
      },
      error: (error) => {
        console.error('Erro ao carregar times:', error);
        this.mostrarErro('Erro ao carregar times');
      }
    });
  }

  salvarTime(): void {
    if (!this.timeForm.nome) {
      this.mostrarErro('Nome do time é obrigatório');
      return;
    }

    if (this.editando) {
      this.timesService.editarTime(this.timeForm).subscribe({
        next: () => {
          this.mostrarSucesso('Time atualizado com sucesso');
          this.carregarTimes();
          this.resetarFormulario();
        },
        error: (error) => {
          console.error('Erro ao editar time:', error);
          this.mostrarErro('Erro ao editar time');
        }
      });
    } else {
      this.timesService.criarTime(this.timeForm).subscribe({
        next: () => {
          this.mostrarSucesso('Time criado com sucesso');
          this.carregarTimes();
          this.resetarFormulario();
        },
        error: (error) => {
          console.error('Erro ao criar time:', error);
          this.mostrarErro('Erro ao criar time');
        }
      });
    }
  }

  editarTime(time: any): void {
    this.timeForm = { ...time };
    this.editando = true;
  }

  excluirTime(id: string): void {
    if (confirm('Tem certeza que deseja excluir este time?')) {
      this.timesService.excluirTime(id).subscribe({
        next: () => {
          this.mostrarSucesso('Time excluído com sucesso');
          this.carregarTimes();
        },
        error: (error) => {
          console.error('Erro ao excluir time:', error);
          this.mostrarErro(error.error?.error || 'Erro ao excluir time');
        }
      });
    }
  }

  resetarFormulario(): void {
    this.timeForm = {
      nome: '',
      cor: '#000000',
      escudo: ''
    };
    this.editando = false;
  }

  mostrarSucesso(mensagem: string): void {
    this.mensagemSucesso = mensagem;
    this.mensagemErro = '';
    setTimeout(() => {
      this.mensagemSucesso = '';
    }, 3000);
  }

  mostrarErro(mensagem: string): void {
    this.mensagemErro = mensagem;
    this.mensagemSucesso = '';
    setTimeout(() => {
      this.mensagemErro = '';
    }, 3000);
  }
}
