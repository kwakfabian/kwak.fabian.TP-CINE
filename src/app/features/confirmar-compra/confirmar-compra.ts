import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

import { AuthService } from '../../core/services/auth.service';
import { CompraService } from '../../core/services/compra.service';
import { FuncionService } from '../../core/services/funcion.service';
import { PeliculaService } from '../../core/services/pelicula.service';
import { CuponService } from '../../core/services/cupon.service';
import { Cupon } from '../../core/models/cuponinterface';
import { Compra } from '../../core/models/comprainterface';
import { Funcion } from '../../core/models/funcioninterface';
import { Pelicula } from '../../core/models/peliculainterface';

@Component({
    selector: 'app-confirmar-compra',
    imports: [ReactiveFormsModule],
    templateUrl: './confirmar-compra.html',
    styleUrl: './confirmar-compra.css'
})
export class ConfirmarCompra implements OnInit {

    authService = inject(AuthService);
    compraService = inject(CompraService);
    cuponService = inject(CuponService);

    private funcionService = inject(FuncionService);
    private peliculaService = inject(PeliculaService);
    private router = inject(Router);

    creditoUsado = new FormControl(0);
    cuponSeleccionado = new FormControl('');

    compraFinalizada = signal(false);
    qrImagen = signal<string | null>(null);
    codigoQr = signal<string | null>(null);

    compraConfirmada: Compra | null = null;
    funcionConfirmada: Funcion | null = null;
    peliculaConfirmada: Pelicula | null = null;

    async ngOnInit() {
        this.funcionService.cargarTodasLasFunciones();
        await this.cuponService.cargarCupones();

        const usuarioActual = this.authService.currentUser();

        if (usuarioActual) {
            await this.cuponService.cargarCuponesUsados(usuarioActual.id);
        }
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

        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return edad;
    }

    cuponesDisponibles(): Cupon[] {
        return this.cuponService.cupones().filter(
            cupon => cupon.activo && !this.cuponService.cuponFueUsado(cupon.cupon_id)
        );
    }

    obtenerCuponSeleccionado(): Cupon | undefined {

        const cuponId = this.cuponSeleccionado.value;

        if (!cuponId) {
            return undefined;
        }

        return this.cuponesDisponibles().find(
            cupon => cupon.cupon_id === cuponId
        );
    }

    obtenerDescuentoCupon(): number {
        return Number(
            this.obtenerCuponSeleccionado()?.descuento ?? 0
        );
    }

    obtenerMontoDescuentoCupon(): number {
        const total = this.compraService.calcularPrecioTotal();
        const descuento = this.obtenerDescuentoCupon();

        return total * (descuento / 100);
    }

    calcularTotalConCupon(): number {
        return this.compraService.calcularPrecioConCupon(
            this.obtenerDescuentoCupon()
        );
    }

    obtenerCreditoDisponible(): number {
        return Number(
            this.authService.currentUserData()?.credito ?? 0
        );
    }

    obtenerCreditoUsado(): number {
        return Number(this.creditoUsado.value ?? 0);
    }

    creditoValido(): boolean {
        const credito = this.obtenerCreditoUsado();
        const creditoDisponible = this.obtenerCreditoDisponible();
        const totalCompra = this.calcularTotalConCupon();

        if (credito < 0) {
            return false;
        }

        if (credito > creditoDisponible) {
            return false;
        }

        if (credito > totalCompra) {
            return false;
        }

        return true;
    }

    calcularTotalAPagar(): number {

        if (!this.creditoValido()) {
            return this.calcularTotalConCupon();
        }

        const totalCompra = this.calcularTotalConCupon();
        const credito = this.obtenerCreditoUsado();

        return totalCompra - credito;
    }

    puedeConfirmar(): boolean {

        if (this.esAnonimo()) {
            return this.datosInvitadoForm.valid;
        }

        return this.creditoValido();
    }

    iniciarSesion() {
        this.router.navigate(['/login']);
    }

    volverAlHome() {
        this.router.navigate(['/home']);
    }

    async confirmarCompra() {

        let edadComprador: number;
        let fechaNacimientoComprador: string | null = null;
        let nombreComprador: string | null = null;
        let emailComprador: string | null = null;

        if (this.esAnonimo()) {

            if (this.datosInvitadoForm.invalid) {this.datosInvitadoForm.markAllAsTouched();
                return;
            }

            fechaNacimientoComprador =this.datosInvitadoForm.value.fecha_nacimiento_comprador!;
            edadComprador =this.calcularEdad(fechaNacimientoComprador);
            nombreComprador =this.datosInvitadoForm.value.nombre_comprador!;
            emailComprador =this.datosInvitadoForm.value.email_comprador!;

        } else {

            if (!this.creditoValido()) {
                alert('La cantidad de crédito ingresada no es válida.');
                return;
            }

            edadComprador = this.calcularEdad(
                this.authService.currentUserData()!.fechaDeNacimiento
            );
        }

        const restriccion =this.peliculaActual()?.edad_restriccion;
        const edadMinima = parseInt(restriccion?.replace('+', '') || '0');

        if (restriccion !== 'ATP' && edadComprador < edadMinima) {

            const acompañadoPorAdulto = confirm(
                `Esta película tiene restricción ${restriccion} y no cumplís con la edad mínima.\n\n` +
                `Para ver esta película debés estar acompañado por un adulto.\n\n` +
                `¿Vas a asistir acompañado por un adulto?`
            );

            if (!acompañadoPorAdulto) {
                alert('No podés continuar con la compra sin estar acompañado por un adulto.');
                return;
            }
        }

        const usuarioActual = this.authService.currentUser();
        const creditoUsado = usuarioActual ? this.obtenerCreditoUsado() : 0;
        const cupon = usuarioActual ? this.obtenerCuponSeleccionado() : undefined;
        const descuentoCupon = cupon ? Number(cupon.descuento) : 0;
        const funcionAntesDeComprar = this.funcionActual();
        const peliculaAntesDeComprar = this.peliculaActual();

        const compraCreada = await this.compraService.confirmarCompra({
            usuario_id: usuarioActual?.id ?? null,
            nombre_comprador: nombreComprador,
            email_comprador: emailComprador,
            fecha_nacimiento_comprador: fechaNacimientoComprador
        }, creditoUsado, descuentoCupon);

        if (compraCreada) {
            if (usuarioActual && cupon) {
                const cuponRegistrado =
                    await this.cuponService.registrarCuponUsado(
                        cupon.cupon_id,
                        usuarioActual.id
                    );
                if (!cuponRegistrado) {
                    console.error(
                        'La compra se realizó, pero hubo un error al registrar el cupón.'
                    );
                }
            }

            this.compraConfirmada = compraCreada;
            this.funcionConfirmada = funcionAntesDeComprar ?? null;
            this.peliculaConfirmada = peliculaAntesDeComprar ?? null;
            this.codigoQr.set(compraCreada.codigo_qr);

            const imagenQr = await QRCode.toDataURL(
                compraCreada.codigo_qr
            );

            this.qrImagen.set(imagenQr);
            this.compraFinalizada.set(true);

        } else {
            alert('Hubo un error al confirmar tu compra. Intentá de nuevo.');
        }
    }

    descargarQrPdf() {

        const qr = this.qrImagen();
        const codigo = this.codigoQr();

        if (!qr || !codigo || !this.compraConfirmada) {
            return;
        }

        const pdf = new jsPDF();

        pdf.setFontSize(22);
        pdf.text('CINEKWAK', 105, 20, { align: 'center' });
        pdf.setFontSize(16);
        pdf.text('ENTRADA', 105, 30,{ align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Pelicula: ${this.peliculaConfirmada?.pelicula_titulo ?? '-'}`, 20, 50);
        pdf.text(`Fecha: ${this.funcionConfirmada?.fecha ?? '-'}`, 20, 60);
        pdf.text(`Horario: ${this.funcionConfirmada?.hora_inicio ?? '-'}`, 20, 70);
        pdf.text(`Butacas: ${this.compraConfirmada.butacas.join(', ')}`, 20, 80);
        pdf.text(`Total: $${this.compraConfirmada.precio_total}`, 20, 90);
        pdf.addImage(qr, 'PNG', 65, 105, 80, 80);
        pdf.setFontSize(11);
        pdf.text('Codigo manual:', 105, 200, { align: 'center' });
        pdf.setFontSize(9);
        pdf.text(codigo, 105, 208,{ align: 'center' });
        pdf.setFontSize(10);
        pdf.text('Presenta este QR al ingresar al cine',105, 225, { align: 'center' });
        pdf.text('y para retirar tu Candy.', 105, 232, { align: 'center' });
        pdf.save('entrada-cinekwak.pdf');
    }
}