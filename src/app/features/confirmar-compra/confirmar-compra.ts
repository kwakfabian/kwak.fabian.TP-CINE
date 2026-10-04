import { Component, inject, computed, OnInit  } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class ConfirmarCompra implements OnInit {

  authService = inject(AuthService);
  compraService = inject(CompraService);
  private funcionService = inject(FuncionService);
  private peliculaService = inject(PeliculaService);
  private router = inject(Router);

  ngOnInit() {
    this.funcionService.cargarTodasLasFunciones();
  }

  esAnonimo = computed(() => !this.authService.currentUser());

  funcionActual = computed(() => {
    const funcionId = this.compraService.funcionId();

    return this.funcionService.funciones().find(
      f => f.funciones_id === funcionId
    );
  });

  peliculaActual = computed(() => {
    const peliculaId = this.funcionActual()?.peliculas_id;

    if (!peliculaId) return undefined;

    return this.peliculaService.peliculas().find(
      p => p.pelicula_id === peliculaId
    );
  });

  datosInvitadoForm = new FormGroup({
    nombre_comprador: new FormControl('', [
      Validators.required,
      Validators.minLength(2)
    ]),

    email_comprador: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    fecha_nacimiento_comprador: new FormControl('', [
      Validators.required
    ])
  });

  get f() {
    return this.datosInvitadoForm.controls;
  }

  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && hoy.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
  }

  puedeConfirmar(): boolean {
    if (this.esAnonimo()) {
      return this.datosInvitadoForm.valid;
    }

    return true;
  }

  iniciarSesion() {
    this.router.navigate(['/login']);
  }

  async confirmarCompra() {

    let edadComprador: number;
    let fechaNacimientoComprador: string | null = null;
    let nombreComprador: string | null = null;
    let emailComprador: string | null = null;

    if (this.esAnonimo()) {

        if (this.datosInvitadoForm.invalid) {
            this.datosInvitadoForm.markAllAsTouched();
            return;
        }
        fechaNacimientoComprador = this.datosInvitadoForm.value.fecha_nacimiento_comprador!;
        edadComprador = this.calcularEdad(fechaNacimientoComprador);
        nombreComprador = this.datosInvitadoForm.value.nombre_comprador!;
        emailComprador = this.datosInvitadoForm.value.email_comprador!;

    } else {
        edadComprador = this.calcularEdad(
            this.authService.currentUserData()!.fechaDeNacimiento
        );
    }

    const restriccion =
        this.peliculaActual()?.edad_restriccion;

    const edadMinima = parseInt(
        restriccion?.replace('+', '') || '0'
    );

    if (
        restriccion !== 'ATP' &&
        edadComprador < edadMinima
    ) {
        const acompañadoPorAdulto = confirm(
            `Esta película tiene restricción ${restriccion} y no cumplís con la edad mínima.\n\n` +
            `Para ver esta película debés estar acompañado por un adulto.\n\n` +
            `¿Vas a asistir acompañado por un adulto?`
        );

        if (!acompañadoPorAdulto) {
            alert(
                'No podés continuar con la compra sin estar acompañado por un adulto.'
            );
            return;
        }
    }

    const usuarioActual =
        this.authService.currentUser();

    const compraCreada = await this.compraService.confirmarCompra({
            usuario_id: usuarioActual?.id ?? null,
            nombre_comprador: nombreComprador,
            email_comprador: emailComprador,
            fecha_nacimiento_comprador: fechaNacimientoComprador
        });

    if (compraCreada) {
        alert('¡Compra confirmada con éxito!');
        this.router.navigate(['/home']);
    } else {
        alert(
            'Hubo un error al confirmar tu compra. Intentá de nuevo.'
        );
    }
  }
}