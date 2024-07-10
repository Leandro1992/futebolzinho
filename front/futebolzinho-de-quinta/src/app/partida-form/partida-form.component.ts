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
    this.ordenarJogadoresPorMensalistaNome();
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
    this.ordenarJogadoresPorMensalistaNome()
    this.jogadoresTimeA = [];
    this.jogadoresTimeB = [];
    if (resetForm) {
      this.partidaForm = this.fb.group({
        data: ['', Validators.required], // Campo obrigatório
        local: ['', Validators.required], // Campo obrigatório
      });
    }
  }

  ordenarJogadoresPorMensalistaNome():void{
    this.jogadores.sort((a, b) => {
      // Primeiro, comparar a propriedade mensalista
      if (a.mensalista !== b.mensalista) {
        return a.mensalista ? -1 : 1;  // Os mensalistas vêm primeiro
      }
      // Se ambos forem mensalistas ou ambos não forem, comparar pelo nome
      return a.nome.localeCompare(b.nome);
    });
  }

  adicionarJogadorTimePorEvento(event: Event, time : string): void {
    const target = event.target as HTMLSelectElement;
    const jogadorIdStr = target.value;
      this.adicionarJogadorTime(jogadorIdStr, time);
  }

  adicionarJogadorTime(jogadorId: string, time: string): void {
    if (this.jogadoresTimeA.length >= 10 || this.jogadoresTimeB.length >= 10) {
      alert("Limite máximo de jogadores por partida - 10");
    } else {
        const jogador = this.jogadores.find(j => j.id === jogadorId);
        if (jogador) {
          const jogadorIndex = this.jogadores.indexOf(jogador);
          this.jogadores.splice(jogadorIndex, 1);
          this.ordenarJogadoresPorMensalistaNome();
          //Coloca no time
          if(time.toLowerCase() === 'a'){
            this.jogadoresTimeA.push({ ...jogador, assistencia: 0, gol: 0 });
          }else{
            this.jogadoresTimeB.push({ ...jogador, assistencia: 0, gol: 0 });
          }
        }
    }
  }

  removerJogadorTime(jogador: any, time: string): void {
    console.log("index em A",this.jogadoresTimeA.indexOf(jogador.id))
    console.log("index em B",this.jogadoresTimeB.indexOf(jogador.id))
    console.log("jogador", jogador)
    console.log(this.jogadoresTimeA)
    if(time.toLowerCase() === 'a'){

      const jogadorIndex = this.jogadoresTimeA.indexOf(jogador);
      this.jogadoresTimeA.splice(jogadorIndex, 1);
    }else{
      const jogadorIndex = this.jogadoresTimeB.indexOf(jogador);
      this.jogadoresTimeB.splice(jogadorIndex, 1);
    }
    this.jogadores.push(jogador)
    this.ordenarJogadoresPorMensalistaNome()
  }

  gerarTimeAleatoriamente(): void {
    let mensalistas = this.jogadores.filter(jogador => jogador.mensalista === true);
    let mensalistasTamanho = mensalistas.length

    for (let index = 0; index < mensalistasTamanho; index++) {
      const numeroAleatorio = Math.random();
      const indice = Math.floor(numeroAleatorio * mensalistas.length);

      if ((index < 6) && (this.jogadoresTimeA.length < 6)) {
        this.adicionarJogadorTime(mensalistas[indice].id, 'a')
        mensalistas.splice(indice, 1);
      } else {
        this.adicionarJogadorTime(mensalistas[indice].id, 'b')
        mensalistas.splice(indice, 1);
      }
    }
  }

  trocarJogadorDeTime(jogador: any): void {
    if(this.jogadoresTimeA.indexOf(jogador)!== -1){
      this.removerJogadorTime(jogador, 'a')
      this.adicionarJogadorTime(jogador.id, 'b')
    }else{
      this.removerJogadorTime(jogador, 'b')
      this.adicionarJogadorTime(jogador.id, 'a')
    }
  }
}
