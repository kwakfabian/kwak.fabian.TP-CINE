import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CompraService } from '../../core/services/compra.service';
import { FuncionService } from '../../core/services/funcion.service';
import { PeliculaService } from '../../core/services/pelicula.service';
import { ResenaService } from '../../core/services/resena.service';
import { Compra } from '../../core/models/comprainterface';
import { Funcion } from '../../core/models/funcioninterface';
import { Pelicula } from '../../core/models/peliculainterface';

@Component({
    selector: 'app-perfil',
    imports: [FormsModule],
    templateUrl: './perfil.html',
    styleUrl: './perfil.css'
})
export class Perfil implements OnInit {

    authService = inject(AuthService);
    compraService = inject(CompraService);
    funcionService = inject(FuncionService);
    peliculaService = inject(PeliculaService);
    resenaService = inject(ResenaService);

    estrellasSeleccionadas: { [peliculaId: string]: number } = {};
    comentarios: { [peliculaId: string]: string } = {};
    resenasExpandidas: { [peliculaId: string]: boolean } = {};

    async ngOnInit() {
        const usuario = this.authService.currentUser();

        if (usuario) {
            await this.compraService.cargarComprasUsuario(usuario.id);
            await this.funcionService.cargarTodasLasFunciones();
            await this.resenaService.cargarResenasUsuario(usuario.id);

            for (const resena of this.resenaService.resenasUsuario()) {
                this.estrellasSeleccionadas[resena.pelicula_id] = resena.estrellas;
                this.comentarios[resena.pelicula_id] = resena.comentario ?? '';
            }
        }
    }

    obtenerFuncion(compra: Compra): Funcion | undefined {
        return this.funcionService.funciones().find(
            funcion => funcion.funciones_id === compra.funciones_id
        );
    }

    obtenerPelicula(compra: Compra): Pelicula | undefined {
        const funcion = this.obtenerFuncion(compra);

        if (!funcion) {
            return undefined;
        }

        return this.peliculaService.peliculas().find(
            pelicula => pelicula.pelicula_id === funcion.peliculas_id
        );
    }

    funcionYaPaso(compra: Compra): boolean {
        const funcion = this.obtenerFuncion(compra);

        if (!funcion) {
            return false;
        }

        const fechaFuncion = new Date(
            `${funcion.fecha}T${funcion.hora_inicio}`
        );

        const ahora = new Date();

        return fechaFuncion.getTime() <= ahora.getTime();
    }

    puedeCancelar(compra: Compra): boolean {
        const funcion = this.obtenerFuncion(compra);

        if (!funcion || !compra.compra_activa) {
            return false;
        }

        return this.compraService.puedeCancelar(
            funcion.fecha,
            funcion.hora_inicio
        );
    }

    tienePeliculasCompradas(): boolean {
        return this.compraService.comprasUsuario().some(
            compra => compra.compra_activa && !this.funcionYaPaso(compra)
        );
    }

    tieneHistorial(): boolean {
        return this.compraService.comprasUsuario().some(
            compra => compra.compra_activa && this.funcionYaPaso(compra)
        );
    }

    tieneComprasCanceladas(): boolean {
        return this.compraService.comprasUsuario().some(
            compra => !compra.compra_activa
        );
    }

    seleccionarEstrellas(peliculaId: string, estrellas: number) {
        this.estrellasSeleccionadas[peliculaId] = estrellas;
    }

    cambiarTamanoResena(peliculaId: string) {
        this.resenasExpandidas[peliculaId] = !this.resenasExpandidas[peliculaId];
    }

    async guardarResena(compra: Compra) {
        const usuario = this.authService.currentUser();
        const pelicula = this.obtenerPelicula(compra);

        if (!usuario || !pelicula) {
            return;
        }

        const estrellas = this.estrellasSeleccionadas[pelicula.pelicula_id];

        if (!estrellas) {
            alert('Seleccioná una calificación de 1 a 5 estrellas.');
            return;
        }

        const exito = await this.resenaService.guardarResena({
            usuario_id: usuario.id,
            pelicula_id: pelicula.pelicula_id,
            estrellas: estrellas,
            comentario: this.comentarios[pelicula.pelicula_id] ?? ''
        });

        if (!exito) {
            alert('Hubo un error al guardar la reseña.');
            return;
        }

        alert('Reseña guardada correctamente.');
    }

    async quitarResena(peliculaId: string) {
        const usuario = this.authService.currentUser();
        const resena = this.resenaService.obtenerResenaPelicula(peliculaId);

        if (!usuario || !resena || !resena.resena_id) {
            return;
        }

        const confirmar = confirm(
            '¿Seguro que querés quitar esta reseña?'
        );

        if (!confirmar) {
            return;
        }

        const exito = await this.resenaService.eliminarResena(
            resena.resena_id,
            usuario.id
        );

        if (!exito) {
            alert('Hubo un error al quitar la reseña.');
            return;
        }

        delete this.estrellasSeleccionadas[peliculaId];
        delete this.comentarios[peliculaId];
        delete this.resenasExpandidas[peliculaId];

        alert('Reseña eliminada correctamente.');
    }

    async cancelarCompra(compra: Compra) {
        if (!this.puedeCancelar(compra)) {
            alert(
                'La compra solo puede cancelarse hasta 2 horas antes de la función.'
            );

            return;
        }

        const confirmar = confirm(
            '¿Seguro que querés cancelar esta compra?'
        );

        if (!confirmar) {
            return;
        }

        const exito = await this.compraService.cancelarCompra(compra);

        if (!exito) {
            alert('Hubo un error al cancelar la compra.');
            return;
        }

        const usuario = this.authService.currentUser();

        if (usuario) {
            await this.compraService.cargarComprasUsuario(usuario.id);
        }

        alert('Compra cancelada correctamente.');
    }
}