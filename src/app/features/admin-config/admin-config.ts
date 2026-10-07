import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { CuponService } from '../../core/services/cupon.service';
import { Cupon } from '../../core/models/cuponinterface';

@Component({
    selector: 'app-admin-config',
    imports: [FormsModule],
    templateUrl: './admin-config.html',
    styleUrl: './admin-config.css'
})
export class AdminConfig {

    configuracionService = inject(ConfiguracionService);
    cuponService = inject(CuponService);
    precioEstandar: number = 0;
    precioDiscapacitado: number = 0;
    precioVip: number = 0;
    codigoCupon: string = '';
    descuentoCupon: number = 0;
    cuponEditando: Cupon | null = null;

    async ngOnInit() {
        await this.configuracionService.cargarConfiguracion();
        await this.cuponService.cargarCupones();

        const configuracion = this.configuracionService.configuracion();

        if (configuracion) {
            this.precioEstandar = configuracion.precio_estandar;
            this.precioDiscapacitado = configuracion.precio_discapacitado;
            this.precioVip = configuracion.precio_vip;
        }
    }

    async guardarConfiguracion() {
        if (this.precioEstandar < 0 || this.precioDiscapacitado < 0 || this.precioVip < 0 ) {
            alert('Los precios no pueden ser negativos.');
            return;
        }
        const exito = await this.configuracionService.modificarConfiguracion(
            this.precioEstandar,
            this.precioDiscapacitado,
            this.precioVip
        );
        if (exito) {
            alert('Configuracion guardada correctamente.');
        } else {
            alert('Hubo un error al guardar la configuracion.');
        }
    }

    async guardarCupon() {
        if (!this.codigoCupon.trim()) {
            alert('Ingresa un codigo para el cupon.');
            return;
        }
        if (this.descuentoCupon <= 0 || this.descuentoCupon > 100 ) {
            alert('El descuento debe estar entre 1% y 100%.');
            return;
        }
        let exito: boolean;
        if (this.cuponEditando) {
            exito = await this.cuponService.modificarCupon(
                this.cuponEditando.cupon_id,
                this.codigoCupon,
                this.descuentoCupon,
            );
        } else {
            exito = await this.cuponService.crearCupon(
                this.codigoCupon,
                this.descuentoCupon,
            );
        }
        if (exito) {
            if (this.cuponEditando) {
                alert('Cupon modificado correctamente.');
            } else {
                alert('Cupon creado correctamente.');
            }
            this.cancelarEdicion();
        } else {
            alert('Hubo un error al guardar el cupon.');
        }
    }

    async cambiarEstadoCupon(cupon: Cupon) {
        const exito = await this.cuponService.cambiarEstadoCupon(cupon);

        if (!exito) {
            alert('Hubo un error al cambiar el estado del cupon.');
        }
    }

    editarCupon(cupon: Cupon) {
        this.cuponEditando = cupon;
        this.codigoCupon = cupon.codigo;
        this.descuentoCupon = cupon.descuento;
    }

    cancelarEdicion() {
        this.cuponEditando = null;
        this.codigoCupon = '';
        this.descuentoCupon = 0;
    }
}