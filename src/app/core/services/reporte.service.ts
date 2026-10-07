import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })

export class ReporteService {

    private supabase = inject(SupabaseService).client;
    private obtenerFechaInicio(periodo: 'semana' | 'mes') {

        const ahora = new Date();
        const fechaInicio = new Date();
        if (periodo === 'semana') {
            const diaActual = ahora.getDay();
            const diasDesdeLunes =diaActual === 0? 6: diaActual - 1;

            fechaInicio.setDate(ahora.getDate() - diasDesdeLunes);
            fechaInicio.setHours(0, 0, 0, 0);

        } else {

            fechaInicio.setDate(1);
            fechaInicio.setHours(0, 0, 0, 0);
        }

        return fechaInicio;
    }

    async obtenerReporteDiario() {

        const inicioDia = new Date();inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date();finDia.setHours(23, 59, 59, 999);
        const { data, error } = await this.supabase
            .from('compras')
            .select('precio_total, butacas, fecha_compra')
            .gte(
                'fecha_compra',
                inicioDia.toISOString()
            )
            .lte(
                'fecha_compra',
                finDia.toISOString()
            );

        if (error) {
            console.error('Error al obtener reporte diario:',error.message);

            return {
                facturacion: 0,
                entradasVendidas: 0
            };
        }

        let facturacion = 0;
        let entradasVendidas = 0;

        data.forEach(compra => {

            facturacion += Number(compra.precio_total);
            entradasVendidas += compra.butacas?.length || 0;

        });

        return {
            facturacion,
            entradasVendidas
        };
    }

    async obtenerPeliculasMasVistas( periodo: 'semana' | 'mes') {

        const ahora = new Date();
        const fechaInicio = this.obtenerFechaInicio(periodo);
        const { data, error } = await this.supabase
            .from('compras')
            .select(`
                butacas,
                fecha_compra,
                funciones (peliculas (pelicula_titulo))
            `)
            .gte(
                'fecha_compra',
                fechaInicio.toISOString()
            )
            .lte(
                'fecha_compra',
                ahora.toISOString()
            );


        if (error) {

            console.error('Error al obtener películas más vistas:',error.message);
            return [];
        }

        const peliculas: {[titulo: string]: number} = {};

        data.forEach((compra: any) => {

            const titulo =
                compra.funciones
                    ?.peliculas
                    ?.pelicula_titulo;

            if (!titulo) {
                return;
            }

            const cantidadEntradas = compra.butacas?.length || 0;

            if (peliculas[titulo]) {

                peliculas[titulo] +=
                    cantidadEntradas;

            } else {

                peliculas[titulo] =
                    cantidadEntradas;
            }
        });

        return Object.entries(peliculas)
            .map(([titulo, entradas]) => ({
                titulo,
                entradas
            }))
            .sort(
                (a, b) =>
                    b.entradas - a.entradas
            );
    }

    async obtenerCandyMasVendido( periodo: 'semana' | 'mes') {

        const ahora = new Date();
        const fechaInicio = this.obtenerFechaInicio(periodo);
        const { data, error } = await this.supabase
            .from('compras')
            .select(`
                candy_productos,
                fecha_compra
            `)
            .gte(
                'fecha_compra',
                fechaInicio.toISOString()
            )
            .lte(
                'fecha_compra',
                ahora.toISOString()
            );


        if (error) {

            console.error('Error al obtener Candy:',error.message);
            return [];
        }

        const productos: {[nombre: string]: number} = {};

        data.forEach((compra: any) => {const candy = compra.candy_productos;

            if (!Array.isArray(candy)) {
                return;
            }

            candy.forEach((producto: any) => {

                const nombre = producto.nombre_candy;
                const cantidad = Number(producto.cantidad) || 0;

                if (!nombre) {
                    return;
                }

                if (productos[nombre]) {

                    productos[nombre] += cantidad;

                } else {

                    productos[nombre] = cantidad;
                }
            });
        });

        return Object.entries(productos)
            .map(([nombre, cantidad]) => ({
                nombre,
                cantidad
            }))
            .sort(
                (a, b) =>
                    b.cantidad - a.cantidad
            );
    }
}