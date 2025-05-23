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
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log("Constructor - today:", today);
    
    this.partidaForm = this.fb.group({
      data: [today, Validators.required],
      local: ['Paula Ramos', Validators.required],
    });
    console.log("Constructor - form value:", this.partidaForm.value);

    this.route.params.subscribe(params => {
      this.jogadores = JSON.parse(params['jogadores']);
      this.jogadoresStage = JSON.parse(params['jogadores']);
    });
    this.ordenarJogadoresPorMensalistaNome();
  }

  ngOnInit(): void {
    console.log("ngOnInit - before patch");
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    this.partidaForm.patchValue({
      data: today,
      local: 'Paula Ramos'
    });
    console.log('ngOnInit - form value after patch:', this.partidaForm.value);
    console.log('ngOnInit - today value:', today);
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
      const today = new Date().toISOString().split('T')[0];
      this.partidaForm = this.fb.group({
        data: [today, Validators.required],
        local: ['Paula Ramos', Validators.required],
      });
      console.log("ResetForm - form value:", this.partidaForm.value);
    }
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
            this.jogadoresTimeA.push({ ...jogador, assistencia: 0, gol: 0, golContra: 0 });
          }else{
            this.jogadoresTimeB.push({ ...jogador, assistencia: 0, gol: 0, golContra: 0 });
          }
          this.ordenarJogadoresPorFixoNome()
        }
      }
    }

    removerJogadorTime(jogador: any, time: string): void {
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

  preencherComMensalistas(): void {
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
    this.ordenarJogadoresPorFixoNome()
  }

  fixarJogadorNoTime(jogador: any): void{
    if(jogador.fixo == true){
      jogador.fixo = false
    } else {
      jogador.fixo = true
    }
    console.log("jogador.fixo depois",jogador.fixo)
  }

  equilibrarTimes(){
    const pesoMediaGol = 3;
    const pesoMediaAss = 2;
    const pesoMediaDestaque = 3;
    const pesoMediavit = 5;

    this.partidaService.getEstatisticas().subscribe(stats => {
      const estatisticas = stats.data;

      this.jogadoresTimeA.forEach(jogador => jogador.timeOriginal = 'a')
      this.jogadoresTimeB.forEach(jogador => jogador.timeOriginal = 'b')

      const jogadoresNaoFixos = [...this.jogadoresTimeA,...this.jogadoresTimeB].filter(jogador => !jogador.fixo)
      if(jogadoresNaoFixos.length > 1){
        jogadoresNaoFixos.forEach(jogador => {
          const jogadorStats = estatisticas.find((atleta: { jogadorId: any; }) => atleta.jogadorId === jogador.id);
          console.log(jogadorStats)
          if(jogadorStats){
            jogador.jogos = jogadorStats.jogos;
            jogador.golsPorJogo = jogadorStats.gols / jogadorStats.jogos;
            jogador.assistenciaPorJogo = jogadorStats.assistencia / jogadorStats.jogos;
            jogador.destaquePorJogo = jogadorStats.destaque / jogadorStats.jogos;
            jogador.vitoriaPorJogo = jogadorStats.vitorias / jogadorStats.jogos;
          } else {
            jogador.jogos = 0;
            jogador.golsPorJogo = 0;
            jogador.assistenciaPorJogo = 0;
            jogador.destaquePorJogo = 0;
            jogador.vitoriaPorJogo = 0;
          }
          jogador.pontuacao =
          jogador.golsPorJogo*pesoMediaGol
          + jogador.assistenciaPorJogo*pesoMediaAss
          + jogador.destaquePorJogo*pesoMediaDestaque
          + jogador.vitoriaPorJogo*pesoMediavit

          // remove jogador do time
          if(jogador.timeOriginal.toLowerCase() === 'a'){
          this.removerJogadorTime(jogador, 'a')
        } else{
          this.removerJogadorTime(jogador, 'b')
        }
      });

      this.distribuiJogadores(jogadoresNaoFixos)

    } else {
      let msgErroEquilibrar = ""
      if(jogadoresNaoFixos.length == 0){
        msgErroEquilibrar = "Não tem jogador pra equilibrar, não ta vendo seu tanso?"
      }else{
        msgErroEquilibrar = "Tu mato a aula de matemática básica? Vai equilibrar 1 jogador como seu tanso? Vai dividir ele no meio?"
      }
      alert(msgErroEquilibrar)
    }

  });
}

  private distribuiJogadores(jogadoresNaoFixos: any[]){
    const tamJogadoresNaoFixos = jogadoresNaoFixos.length;
    const tamJogadoresFixoA = this.jogadoresTimeA.length;
    const tamJogadoresFixoB = this.jogadoresTimeB.length;
    const totalJogadores = tamJogadoresNaoFixos + tamJogadoresFixoA + tamJogadoresFixoB;

    // Calcular quantos jogadores precisam ir para cada time
    const tamJogadoresA = totalJogadores % 2 + Math.floor(totalJogadores / 2);
    const tamJogadoresB = Math.floor(totalJogadores / 2);

    // Ordenar jogadores não fixos por pontuação (decrescente)
    jogadoresNaoFixos.sort((a, b) => b.pontuacao - a.pontuacao);

    // Inicializar pontuações dos times
    let totalPontuacaoA = 0
    let totalPontuacaoB = 0;

    console.log("totalPontuacaoA",totalPontuacaoA)
    console.log("totalPontuacaoB",totalPontuacaoB)
    // Distribuir jogadores não fixos
    jogadoresNaoFixos.forEach(jogador => {
      if (this.jogadoresTimeA.length < tamJogadoresA && (totalPontuacaoA <= totalPontuacaoB || this.jogadoresTimeB.length >= tamJogadoresB)) {
        this.adicionarJogadorTime(jogador.id, 'a');
        console.log("foi pro time A",jogador.nome)
        totalPontuacaoA += jogador.pontuacao;
      } else {
        console.log("foi pro time B",jogador.nome)
        this.adicionarJogadorTime(jogador.id, 'b');
        totalPontuacaoB += jogador.pontuacao;
      }
      console.log("jogador",jogador.nome)
      console.log("totalPontuacaoA",totalPontuacaoA)
      console.log("totalPontuacaoB",totalPontuacaoB)
    });
    // Verificar se a distribuição está correta
    console.log('Time A:', this.jogadoresTimeA);
    console.log('Time B:', this.jogadoresTimeB);
    console.log('Pontuação total Time A:', totalPontuacaoA);
    console.log('Pontuação total Time B:', totalPontuacaoB);
  }
  private ordenarJogadoresPorMensalistaNome():void{
    this.jogadores.sort((a, b) => {
      // Primeiro, comparar a propriedade mensalista
      if (a.mensalista !== b.mensalista) {
        return a.mensalista ? -1 : 1;  // Os mensalistas vêm primeiro
      }
      // Se ambos forem mensalistas ou ambos não forem, comparar pelo nome
      return a.nome.localeCompare(b.nome);
    });
  }

  private ordenarJogadoresPorFixoNome():void{
    this.jogadoresTimeA.sort((a, b) => {
      // Primeiro, comparar a propriedade mensalista
      if (a.fixo !== b.fixo) {
        return a.fixo ? -1 : 1;  // Os mensalistas vêm primeiro
      }
      // Se ambos forem mensalistas ou ambos não forem, comparar pelo nome
      return a.nome.localeCompare(b.nome);
    });
    this.jogadoresTimeB.sort((a, b) => {
      // Primeiro, comparar a propriedade mensalista
      if (a.fixo !== b.fixo) {
        return a.fixo ? -1 : 1;  // Os mensalistas vêm primeiro
      }
      // Se ambos forem mensalistas ou ambos não forem, comparar pelo nome
      return a.nome.localeCompare(b.nome);
    });
  }

  arredondaValor(num: number): string{
    return num.toFixed(2)
  }
}
