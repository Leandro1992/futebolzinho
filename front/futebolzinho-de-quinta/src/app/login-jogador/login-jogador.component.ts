import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login-jogador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-jogador.component.html',
  styleUrls: ['./login-jogador.component.css']
})
export class LoginJogadorComponent {
  loginData = {
    email: '',
    senha: ''
  };
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(): void {
    if (!this.loginData.email || !this.loginData.senha) {
      this.mensagemErro = 'Por favor, preencha todos os campos';
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';

    this.http.post<any>('/api/auth/jogador/login', this.loginData).subscribe({
      next: (response) => {
        if (response.success) {
          // Armazenar dados do jogador no localStorage
          localStorage.setItem('jogadorLogado', JSON.stringify(response.jogador));
          
          // Redirecionar para a página de partidas
          this.router.navigate(['/']);
        }
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro no login:', error);
        this.mensagemErro = error.error?.error || 'Erro ao fazer login';
        this.carregando = false;
      }
    });
  }

  logout(): void {
    localStorage.removeItem('jogadorLogado');
    this.router.navigate(['/login-jogador']);
  }

  get jogadorLogado(): any {
    const jogador = localStorage.getItem('jogadorLogado');
    return jogador ? JSON.parse(jogador) : null;
  }
}
