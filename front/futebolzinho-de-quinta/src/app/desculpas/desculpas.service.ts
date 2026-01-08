import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Desculpa {
  id?: string;
  jogadorId: string;
  jogadorNome: string;
  data: string;
  descricao: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface FiltrosDesculpa {
  jogadorId?: string;
  dataInicial?: string;
  dataFinal?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesculpasService {
  private apiUrl = '/api/desculpas';

  constructor(private http: HttpClient) {}

  getDesculpas(filtros?: FiltrosDesculpa): Observable<any> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.jogadorId) {
        params = params.set('jogadorId', filtros.jogadorId);
      }
      if (filtros.dataInicial) {
        params = params.set('dataInicial', filtros.dataInicial);
      }
      if (filtros.dataFinal) {
        params = params.set('dataFinal', filtros.dataFinal);
      }
    }

    return this.http.get<any>(`${this.apiUrl}`, { params });
  }

  getDesculpa(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  criarDesculpa(desculpa: Desculpa): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, desculpa);
  }

  editarDesculpa(id: string, desculpa: Desculpa): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, desculpa);
  }

  excluirDesculpa(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
