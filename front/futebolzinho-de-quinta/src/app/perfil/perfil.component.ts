import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  perfilForm: any = {
    email: '',
    emailNovo: '',
    password: '',
    passwordNova: '',
    passwordNovaConfirm: ''
  };
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;
  userEmail: string = '';

  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obter email do usuário logado
    this.authService.getUserEmail.subscribe(email => {
      if (email) {
        this.userEmail = email;
        this.perfilForm.email = email;
      }
    });
  }

  atualizarPerfil(): void {
    // Validações
    if (!this.perfilForm.password) {
      this.mostrarErro('Senha atual é obrigatória');
      return;
    }

    if (!this.perfilForm.emailNovo && !this.perfilForm.passwordNova) {
      this.mostrarErro('Informe um novo email ou senha para atualizar');
      return;
    }

    if (this.perfilForm.passwordNova && this.perfilForm.passwordNova !== this.perfilForm.passwordNovaConfirm) {
      this.mostrarErro('As senhas não coincidem');
      return;
    }

    this.carregando = true;

    const updateData: any = {
      email: this.perfilForm.email,
      password: this.perfilForm.password
    };

    if (this.perfilForm.emailNovo) {
      updateData.emailNovo = this.perfilForm.emailNovo;
    }

    if (this.perfilForm.passwordNova) {
      updateData.passwordNova = this.perfilForm.passwordNova;
    }

    this.usersService.updateProfile(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarSucesso('Perfil atualizado com sucesso!');
          
          // Atualizar email local se foi alterado
          if (updateData.emailNovo) {
            this.userEmail = updateData.emailNovo;
            this.perfilForm.email = updateData.emailNovo;
            this.perfilForm.emailNovo = '';
          }
          
          // Limpar campos de senha
          this.perfilForm.password = '';
          this.perfilForm.passwordNova = '';
          this.perfilForm.passwordNovaConfirm = '';
        }
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao atualizar perfil:', error);
        this.mostrarErro(error.error?.error || 'Erro ao atualizar perfil');
        this.carregando = false;
      }
    });
  }

  mostrarSucesso(mensagem: string): void {
    this.mensagemSucesso = mensagem;
    this.mensagemErro = '';
    setTimeout(() => {
      this.mensagemSucesso = '';
    }, 5000);
  }

  mostrarErro(mensagem: string): void {
    this.mensagemErro = mensagem;
    this.mensagemSucesso = '';
    setTimeout(() => {
      this.mensagemErro = '';
    }, 5000);
  }
}
