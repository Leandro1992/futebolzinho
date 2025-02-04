// src/app/services/estatistica.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstatisticaService {
  private apiUrl = ''; // Substitua pelo seu URL do Firebase

  constructor(private http: HttpClient) { }

  getEstatisticas(dataInicial: string, dataFim: string): Observable<any[]> {
    const params = new HttpParams()
      .set('dataInicial', dataInicial)
      .set('dataFim', dataFim);
    return this.http.get<any[]>(`${this.apiUrl}/estatisticas`, { params });

  }
}