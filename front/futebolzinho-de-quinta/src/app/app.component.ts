import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { AuthService } from './auth.service';
import { Alert, Modal } from 'bootstrap';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'futebolzinho-de-quinta';

  loginForm: FormGroup;
  isLoggedIn = false;
  loginError: string | null = null;
  userEmail: string | null = null;
  private modalElement: HTMLElement | null = null;
  private modal: Modal | null = null;
  isNavbarCollapsed: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.authService.isLoggedIn.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.getUserEmail.subscribe(email => {
      this.userEmail = email;
    });

    // Subscribe to router events to close menu on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isNavbarCollapsed = false;
    });
  }

  ngAfterViewInit() {
    this.modalElement = document.getElementById('loginModal');
    if (this.modalElement) {
      this.modal = new Modal(this.modalElement);
      this.modalElement.addEventListener('hidden.bs.modal', () => {
        // Certifique-se de remover qualquer backdrop remanescente
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
      });
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe(
        response => {
          if (this.modal) {
            this.modal.hide();
          }
          this.loginError = null;
        },
        error => {
          console.error('Login failed', error);
          this.loginError = 'Erro ao realizar login! Verifique suas credenciais.';
        }
      );
    }
  }

  toggleNavbar() {
    console.log("passou no toggle")
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}
