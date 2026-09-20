import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  succesMessage= signal<string | null>(null);

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.value;

    try {
      const { data, error } = await this.authService.signUp(email!, password!);

      console.log('DATA:', data);
      console.log('ERROR:', error); 
      if (error) throw error;

      if (data.user?.identities?.length === 0){
        this.errorMessage.set('Este email ya esta registrado')
      } else{
        this.succesMessage.set('Registro exitoso')
        this.registerForm.reset()
      }

      this.router.navigate(['/home']);

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al registrar la cuenta');
    } finally {
      this.isLoading.set(false);
    }
  }
}
