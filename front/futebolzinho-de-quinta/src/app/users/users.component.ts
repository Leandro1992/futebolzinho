import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from './users.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  userForm: any = {
    email: '',
    password: '',
    admin: false,
    status: true
  };
  editando: boolean = false;
  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarUsers();
  }

  carregarUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (response) => {
        this.users = response.data || [];
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.mostrarErro('Erro ao carregar usuários');
      }
    });
  }

  salvarUser(): void {
    if (!this.userForm.email || !this.userForm.password) {
      this.mostrarErro('Email e senha são obrigatórios');
      return;
    }

    if (this.editando) {
      this.usersService.updateUser(this.userForm).subscribe({
        next: () => {
          this.mostrarSucesso('Usuário atualizado com sucesso');
          this.carregarUsers();
          this.resetarFormulario();
        },
        error: (error) => {
          console.error('Erro ao editar usuário:', error);
          this.mostrarErro('Erro ao editar usuário');
        }
      });
    } else {
      // Usar a rota de registro do auth
      this.authService.register(this.userForm).subscribe({
        next: () => {
          this.mostrarSucesso('Usuário criado com sucesso');
          this.carregarUsers();
          this.resetarFormulario();
        },
        error: (error) => {
          console.error('Erro ao criar usuário:', error);
          this.mostrarErro(error.error?.error || 'Erro ao criar usuário');
        }
      });
    }
  }

  editarUser(user: any): void {
    this.userForm = { 
      ...user,
      password: '' // Não preencher senha ao editar
    };
    this.editando = true;
  }

  excluirUser(id: string): void {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      this.usersService.deleteUser(id).subscribe({
        next: () => {
          this.mostrarSucesso('Usuário excluído com sucesso');
          this.carregarUsers();
        },
        error: (error) => {
          console.error('Erro ao excluir usuário:', error);
          this.mostrarErro(error.error?.error || 'Erro ao excluir usuário');
        }
      });
    }
  }

  resetarFormulario(): void {
    this.userForm = {
      email: '',
      password: '',
      admin: false,
      status: true
    };
    this.editando = false;
  }

  mostrarSucesso(mensagem: string): void {
    this.mensagemSucesso = mensagem;
    this.mensagemErro = '';
    setTimeout(() => {
      this.mensagemSucesso = '';
    }, 3000);
  }

  mostrarErro(mensagem: string): void {
    this.mensagemErro = mensagem;
    this.mensagemSucesso = '';
    setTimeout(() => {
      this.mensagemErro = '';
    }, 3000);
  }
}
