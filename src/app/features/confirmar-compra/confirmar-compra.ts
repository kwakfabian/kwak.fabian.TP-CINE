import { Component, inject, computed } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CompraService } from '../../core/services/compra.service';
import { FuncionService } from '../../core/services/funcion.service';
import { PeliculaService } from '../../core/services/pelicula.service';

@Component({
  selector: 'app-confirmar-compra',
  imports: [ReactiveFormsModule],
  templateUrl: './confirmar-compra.html',
  styleUrl: './confirmar-compra.css'
})
export class ConfirmarCompra {
  authService = inject(AuthService);
  compraService = inject(CompraService);
  private funcionService = inject(FuncionService);
  private peliculaService = inject(PeliculaService);

  esAnonimo = computed(() => !this.authService.currentUser());

  funcionActual = computed(() => {
    const funcionId = this.compraService.funcionId();
    return this.funcionService.funciones().find(f => f.funciones_id === funcionId);
  });

  peliculaActual = computed(() => {
    const peliculaId = this.funcionActual()?.peliculas_id;
    if (!peliculaId) return undefined;
    return this.peliculaService.peliculas().find(p => p.pelicula_id === peliculaId);
  });

  datosInvitadoForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    fecha_nacimiento: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.datosInvitadoForm.controls;
  }

  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  puedeConfirmar = computed(() => {
    if (this.esAnonimo()) {
      return this.datosInvitadoForm.valid;
    }
    return true;
  });

  async confirmarCompra() {
    let edadComprador: number;
    let nombreComprador: string | null = null;
    let emailComprador: string | null = null;

    if (this.esAnonimo()) {
      if (this.datosInvitadoForm.invalid) {
        this.datosInvitadoForm.markAllAsTouched();
        return;
      }
      edadComprador = this.calcularEdad(this.datosInvitadoForm.value.fecha_nacimiento!);
      nombreComprador = this.datosInvitadoForm.value.nombre!;
      emailComprador = this.datosInvitadoForm.value.email!;
    } else {
      edadComprador = this.calcularEdad(this.authService.currentUserData()!.fechaDeNacimiento);
    }

    const restriccion = this.peliculaActual()?.edad_restriccion;
    const edadMinima = parseInt(restriccion?.replace('+', '') || '0');

    if (restriccion !== 'ATP' && edadComprador < edadMinima) {
      alert(`Esta película tiene restricción ${restriccion}. No podés comprar esta entrada.`);
      return;
    }

    const precioFuncion = this.funcionActual()?.precio ?? 0;
    const usuarioActual = this.authService.currentUser();

    const exito = await this.compraService.confirmarCompra({
      usuario_id: usuarioActual?.id ?? null,
      nombre: nombreComprador,
      email: emailComprador
    }, precioFuncion);

    if (exito) {
      alert('¡Compra confirmada con éxito!');
    } else {
      alert('Hubo un error al confirmar tu compra. Intentá de nuevo.');
    }
  }
}