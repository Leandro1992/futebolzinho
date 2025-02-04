import { Component } from '@angular/core';
import { EstatisticaService } from './estatisticas.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-estatisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estatisticas.component.html',
  styleUrl: './estatisticas.component.css'
})
export class EstatisticasComponent {
  constructor(private estatisticasService: EstatisticaService) { }

  estatisticas: any[] = [];
  ordenacao = { coluna: '', direcao: '' };
  anos: number[] = [];
  meses: { nome: string, valor: string }[] = [
    { nome: 'Janeiro', valor: '01' },
    { nome: 'Fevereiro', valor: '02' },
    { nome: 'Março', valor: '03' },
    { nome: 'Abril', valor: '04' },
    { nome: 'Maio', valor: '05' },
    { nome: 'Junho', valor: '06' },
    { nome: 'Julho', valor: '07' },
    { nome: 'Agosto', valor: '08' },
    { nome: 'Setembro', valor: '09' },
    { nome: 'Outubro', valor: '10' },
    { nome: 'Novembro', valor: '11' },
    { nome: 'Dezembro', valor: '12' }
  ];
  anoInicial: number = 2025;
  mesInicial: string = '01';
  anoFinal: number = 2025;
  mesFinal: string = '12';
  dataInicial: string =  '2025-01-01';
  dataFim: string = '2025-12-31';

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2000; year--) {
      this.anos.push(year);
    }
    this.anoInicial = currentYear;
    this.mesInicial = '01';
    this.anoFinal = currentYear;
    this.mesFinal = '12';
    this.atualizarDataInicial();
    this.atualizarDataFinal();
  }

  atualizarDataInicial() {
    this.dataInicial = `${this.anoInicial}-${this.mesInicial}-01`;
    this.filtrarEstatisticas();
  }

  atualizarDataFinal() {
    const lastDay = new Date(this.anoFinal, parseInt(this.mesFinal), 0).getDate();
    this.dataFim = `${this.anoFinal}-${this.mesFinal}-${lastDay}`;
    this.filtrarEstatisticas();
  }

  filtrarEstatisticas() {
    // Chame o método para obter as estatísticas filtradas por data
    // this.estatisticasService.obterEstatisticasPartidas(this.dataInicial, this.dataFim).then(estatisticas => {
    //   this.estatisticas = estatisticas;
    // });
     this.estatisticasService.getEstatisticas(this.dataInicial, this.dataFim).subscribe({
      next: (estatistica: any) => {
        console.log("estatistica?", estatistica);
        this.estatisticas = estatistica.data;
      },
      error: (error) => {
        console.log("erro ao carregar estatisticas", error);
        console.error('Erro ao carregar estatisticas:', error);
      }
    });
  }

  ordenarPor(coluna: string) {
    if (this.ordenacao.coluna === coluna) {
      this.ordenacao.direcao = this.ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenacao.coluna = coluna;
      this.ordenacao.direcao = 'asc';
    }

    this.estatisticas.sort((a, b) => {
      if (this.ordenacao.direcao === 'asc') {
        return a[coluna] - b[coluna];
      } else {
        return b[coluna] - a[coluna];
      }
    });
  }

}
