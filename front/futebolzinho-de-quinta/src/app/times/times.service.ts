// src/app/services/times.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimesService {
  private apiUrl = '/api/times';

  constructor(private http: HttpClient) {}

  getTimes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`);
  }

  getTimePorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  criarTime(time: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, time);
  }

  editarTime(time: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}`, time);
  }

  excluirTime(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
