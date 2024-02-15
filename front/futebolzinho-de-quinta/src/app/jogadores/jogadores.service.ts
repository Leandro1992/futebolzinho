// src/app/services/jogador.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JogadorService {
  private apiUrl = ''; 

  constructor(private http: HttpClient) {}

  getJogadores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jogadores`);
  }

  criarJogador(jogador: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/jogadores`, jogador);
  }

  editarJogador(jogador: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/jogadores`, jogador);
  }

  // Adicione mais métodos conforme necessário para atualizar, deletar, etc.
}