import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'; // Importe os módulos necessários
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PartidaService } from '../partidas/partidas.service';

@Component({
  selector: 'app-partida-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './partida-form.component.html',
  styleUrl: './partida-form.component.css'
})

export class PartidaFormComponent implements OnInit {
  partidaForm: FormGroup;
  jogadores: any[] = [];
  jogadoresStage: any[] = [];
  jogadoresTimeA: any[] = [];
  jogadoresTimeB: any[] = [];

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private partidaService: PartidaService,) {
    this.partidaForm = this.fb.group({
      data: ['', Validators.required], // Campo obrigatório
      local: ['', Validators.required], // Campo obrigatório
    });

    this.route.params.subscribe(params => {
      this.jogadores = JSON.parse(params['jogadores']);
      this.jogadoresStage = JSON.parse(params['jogadores']);
    });
  }

  ngOnInit(): void {

  }

  salvarPartida(): void {
    if (this.jogadoresTimeB.length < 5 || this.jogadoresTimeA.length < 5) {
      alert("Não é possível cadastrar uma partida com menos de 5 jogadores em um dos times")
    } else {
      let partidaData = this.partidaForm.value;
      partidaData.timeA = this.jogadoresTimeA;
      partidaData.timeB = this.jogadoresTimeB
      partidaData.status = 0;
      console.log('Dados da partida:', partidaData);
      this.partidaService.criarPartidas(partidaData).subscribe({
        next: (partida: any) => {
          alert("Partida criada com sucesso")
          console.log(partida)
          this.resetForm(true);
        },
        error: (error) => {
          alert("Ocorreu um erro ao tentar criar a partida")
          console.error('Erro ao carregar jogadores:', error);
        }
      });
    }
  }

  resetForm(resetForm: boolean): void {
    this.jogadores = this.jogadoresStage.slice();
    this.jogadoresTimeA = [];
    this.jogadoresTimeB = [];
    if (resetForm) {
      this.partidaForm = this.fb.group({
        data: ['', Validators.required], // Campo obrigatório
        local: ['', Validators.required], // Campo obrigatório
      });
    }
  }

  // Métodos para adicionar/remover jogadores (você pode adaptar conforme necessário)
  adicionarJogadorTimeA(event: Event): void {
    if (this.jogadoresTimeA.length >= 10) {
      alert("Limite máximo de jogadores por partida - 10")
    } else {
      const target = event.target as HTMLInputElement;
      const jogadorId = target.value;

      const jogador = this.jogadores.find(j => j.id === jogadorId);
      if (jogador) {
        const jogadorIndex = this.jogadores.indexOf(jogador);
        this.jogadores.splice(jogadorIndex, 1);
        this.jogadoresTimeA.push({ ...jogador, "assistencia": 0, "gol": 0 });
      }
    }
  }

  gerarTimeAleatoriamente(): void {
    let mensalistas = this.jogadores.filter(jogador => jogador.mensalista === true);
    this.resetForm(false);
    for (let index = 0; index < 12; index++) {
      const numeroAleatorio = Math.random();

      const indice = Math.floor(numeroAleatorio * mensalistas.length);
      if (index < 6) {
        this.jogadoresTimeA.push({ ...mensalistas[indice], "assistencia": 0, "gol": 0 });
        mensalistas.splice(indice, 1);
      } else {
        this.jogadoresTimeB.push({ ...mensalistas[indice], "assistencia": 0, "gol": 0 });
        mensalistas.splice(indice, 1);
      }
    }
  }

  removerJogadorTimeA(jogador: any): void {
    const jogadorIndex = this.jogadoresTimeA.indexOf(jogador);
    this.jogadores.push(jogador)
    this.jogadoresTimeA.splice(jogadorIndex, 1);
  }

  adicionarJogadorTimeB(event: Event): void {
    if (this.jogadoresTimeB.length >= 10) {
      alert("Limite máximo de jogadores por partida - 10")
    } else {
      const target = event.target as HTMLInputElement;
      const jogadorId = target.value;

      console.log(jogadorId);

      const jogador = this.jogadores.find(j => j.id === jogadorId);
      if (jogador) {
        const jogadorIndex = this.jogadores.indexOf(jogador);
        this.jogadores.splice(jogadorIndex, 1);
        this.jogadoresTimeB.push({ ...jogador, "assistencia": 0, "gol": 0 });
      }
    }
  }

  removerJogadorTimeB(jogador: number): void {
    const jogadorIndex = this.jogadoresTimeB.indexOf(jogador);
    this.jogadores.push(jogador)
    this.jogadoresTimeB.splice(jogadorIndex, 1);
  }

}
