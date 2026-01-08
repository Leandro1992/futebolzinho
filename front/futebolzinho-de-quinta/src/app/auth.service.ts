import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject  } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private baseUrl = 'api/auth';
  private loggedIn = new BehaviorSubject<boolean>(false);
  private userEmail = new BehaviorSubject<string | null>(null);


  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token) {
      this.loggedIn.next(true);
      this.userEmail.next(email);
    }
  }

  login(email: string, password: string): Observable<any> {
    // Simular login com uma API real
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(response => {
        console.log('Resposta do login:', response);
        if (response.success && response.token) {
          this.loggedIn.next(true);
          this.userEmail.next(email);
          localStorage.setItem('token', response.token);
          localStorage.setItem('userEmail', email);
          console.log('Token salvo:', response.token);
        } else {
          console.error('Token não encontrado na resposta:', response);
        }
      })
    );
  }

  logout() {
    this.loggedIn.next(false);
    this.userEmail.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, userData);
  }

  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  get getUserEmail() {
    return this.userEmail.asObservable();
  }
}
