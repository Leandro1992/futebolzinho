// src/app/services/estatistica.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstatisticaService {
  private apiUrl = ''; // Substitua pelo seu URL do Firebase

  constructor(private http: HttpClient) {}

  getEstatisticas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/estatisticas`);
  }

}
