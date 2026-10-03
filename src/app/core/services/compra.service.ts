import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Compra } from '../models/comprainterface';

export interface ItemCandySeleccionado {
    candy_id: string;
    nombre_candy: string;
    cantidad: number;
    precio: number;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
    private supabase = inject(SupabaseService).client;

    funcionId = signal<string | null>(null);
    cantidadEntradas = signal<number>(1);
    butacasSeleccionadas = signal<string[]>([]);
    candySeleccionado = signal<ItemCandySeleccionado[]>([]);

    setearFuncion(funcionId: string, cantidad: number) {
        this.funcionId.set(funcionId);
        this.cantidadEntradas.set(cantidad);
    }

    setearButacas(butacas: string[]) {
        this.butacasSeleccionadas.set(butacas);
    }

    setearCandy(candy: ItemCandySeleccionado[]) {
        this.candySeleccionado.set(candy);
    }

    reiniciarCompra() {
        this.funcionId.set(null);
        this.cantidadEntradas.set(1);
        this.butacasSeleccionadas.set([]);
        this.candySeleccionado.set([]);
    }

    esVip(butaca: string): boolean {
        const fila = butaca.charAt(0);
        return fila === 'R' || fila === 'S' || fila === 'T';
    }

    calcularPrecioTotal(precioFuncion: number): number {
        const totalButacas = this.butacasSeleccionadas().reduce((suma, butaca) => {
            const precio = this.esVip(butaca) ? precioFuncion * 1.5 : precioFuncion;
            return suma + precio;
        }, 0);

        const totalCandy = this.candySeleccionado().reduce((suma, item) => {
            return suma + (item.precio * item.cantidad);
        }, 0);

        return totalButacas + totalCandy;
    }

    async confirmarCompra(datosComprador: {
        usuario_id: string | null;
        nombre: string | null;
        email: string | null;
    }, precioFuncion: number): Promise<boolean> {

        const precioTotal = this.calcularPrecioTotal(precioFuncion);

        const nuevaCompra: Compra = {
            funciones_id: this.funcionId()!,
            usuario_id: datosComprador.usuario_id,
            nombre_comprador: datosComprador.nombre,
            email_comprador: datosComprador.email,
            butacas: this.butacasSeleccionadas(),
            candy_items: this.candySeleccionado().length > 0 ? this.candySeleccionado() : null,
            precio_total: precioTotal
        };

        // 1. Insertamos la compra
        const { error: errorCompra } = await this.supabase
            .from('compras')
            .insert([nuevaCompra]);

        if (errorCompra) {
            console.error('Error al guardar la compra:', errorCompra.message);
            return false;
        }

        // 2. Actualizamos la ocupación de butacas para esa función
        const exitoButacas = await this.marcarButacasComoOcupadas();

        if (!exitoButacas) {
            console.error('La compra se guardó, pero hubo un error al marcar las butacas como ocupadas.');
            return false;
        }

        this.reiniciarCompra();
        return true;
    }

    private async marcarButacasComoOcupadas(): Promise<boolean> {
        const funcionId = this.funcionId();
        if (!funcionId) return false;

        // Buscamos si ya existe una fila de ocupación para esta función
        const { data: filaExistente, error: errorBusqueda } = await this.supabase
            .from('butacas')
            .select('id, butacas_ocupadas')
            .eq('funciones_id', funcionId)
            .maybeSingle();

        if (errorBusqueda) {
            console.error('Error al buscar butacas ocupadas:', errorBusqueda.message);
            return false;
        }

        if (filaExistente) {
            // Ya existe una fila: actualizamos, sumando las nuevas butacas
            const ocupadasActuales: string[] = filaExistente.butacas_ocupadas || [];
            const nuevasOcupadas = [
                ...new Set([
                ...ocupadasActuales,
                ...this.butacasSeleccionadas()
                ])
            ];

            const { error: errorUpdate } = await this.supabase
                .from('butacas')
                .update({ butacas_ocupadas: nuevasOcupadas })
                .eq('id', filaExistente.id);

            if (errorUpdate) {
                console.error('Error al actualizar butacas ocupadas:', errorUpdate.message);
                return false;
            }
        } else {
            // No existe fila todavía: la creamos
            const { error: errorInsert } = await this.supabase
                .from('butacas')
                .insert([{
                    funciones_id: funcionId,
                    butacas_ocupadas: this.butacasSeleccionadas()
                }]);

            if (errorInsert) {
                console.error('Error al crear fila de butacas ocupadas:', errorInsert.message);
                return false;
            }
        }

        return true;
    }
}