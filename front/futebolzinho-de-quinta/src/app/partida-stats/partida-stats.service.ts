import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PartidaStatsService {

  private apiUrl = ''; // Substitua pela URL da sua API

  constructor(private http: HttpClient) { }

  // Buscar todas as partidas
  getPartidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/partida-stats/`).pipe(
      catchError(this.handleError<any[]>('getPartidas', []))
    );
  }

  // Buscar uma partida por ID
  getPartida(id: number): Observable<any> {
    const url = `${this.apiUrl}/partida-stats/${id}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError<any>(`getPartida id=${id}`))
    );
  }

  // Cadastrar uma nova partida
  addPartida(partida: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/partida-stats/`, partida, this.httpOptions).pipe(
      catchError(this.handleError<any>('addPartida'))
    );
  }

  // Editar uma partida existente
  updatePartida(partida: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/partida-stats/`, partida, this.httpOptions).pipe(
      catchError(this.handleError<any>('updatePartida'))
    );
  }

  // Função para tratar erros
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  // Opções HTTP padrão
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

}