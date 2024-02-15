import { Component } from '@angular/core';
import { EstatisticaService } from './estatisticas.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estatisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estatisticas.component.html',
  styleUrl: './estatisticas.component.css'
})
export class EstatisticasComponent {
  constructor(private estatisticasService: EstatisticaService) { }

  estatisticas: any[] = [];
  ordenacao = { coluna: '', direcao: '' };

  ngOnInit(): void {
    this.estatisticasService.getEstatisticas().subscribe({
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
