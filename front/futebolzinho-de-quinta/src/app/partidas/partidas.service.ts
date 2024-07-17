import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PartidaService {
  private apiUrl = ''; // Substitua pelo seu URL do Firebase

  constructor(private http: HttpClient) {}

  getPartidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/partidas`);
  }

  criarPartidas(partida: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/partidas`, partida);
  }

  editarPartidas(partida: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/partidas`, partida);
  }

  getEstatisticas(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/estatisticas`);
  }

  // Adicione mais métodos conforme necessário para atualizar, deletar, etc.
}
