import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject  } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private baseUrl = '';
  private loggedIn = new BehaviorSubject<boolean>(false);
  private userEmail = new BehaviorSubject<string | null>(null);


  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      this.loggedIn.next(true);
      this.userEmail.next(token); // Decodifica o email do token se necessário
    }
  }

  login(email: string, password: string): Observable<any> {
    // Simular login com uma API real
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.loggedIn.next(true);
        this.userEmail.next(response.token.email);
        localStorage.setItem('token', response.token.email);
      })
    );
  }

  logout() {
    this.loggedIn.next(false);
    this.userEmail.next(null);
    localStorage.removeItem('token');
  }

  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  get getUserEmail() {
    return this.userEmail.asObservable();
  }
}
