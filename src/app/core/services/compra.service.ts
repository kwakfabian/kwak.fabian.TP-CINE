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

    calcularPrecioTotal(): number {
        const PRECIO_NORMAL = 3000;
        const PRECIO_VIP = 4500;

        const totalButacas = this.butacasSeleccionadas().reduce((suma, butaca) => {
            const precio = this.esVip(butaca) ? PRECIO_VIP : PRECIO_NORMAL;
            return suma + precio;
        }, 0);

        const totalCandy = this.candySeleccionado().reduce((suma, item) => {
            return suma + (item.precio * item.cantidad);
        }, 0);

        return totalButacas + totalCandy;
    }

    async confirmarCompra(datosComprador: {
        usuario_id: string | null;
        nombre_comprador: string | null;
        email_comprador: string | null;
        fecha_nacimiento_comprador: string | null;
    }): Promise<Compra | null> {

        const precioTotal = this.calcularPrecioTotal();
        const codigoQr = crypto.randomUUID();
        const nuevaCompra: Compra = {
            funciones_id: this.funcionId()!,
            usuario_id: datosComprador.usuario_id,
            nombre_comprador: datosComprador.nombre_comprador,
            email_comprador: datosComprador.email_comprador,
            fecha_nacimiento_comprador: datosComprador.fecha_nacimiento_comprador,
            butacas: this.butacasSeleccionadas(),
            candy_productos: this.candySeleccionado().length > 0 ? this.candySeleccionado() : null,
            qr_disponible: true,
            codigo_qr: codigoQr,
            precio_total: precioTotal
        };

        const { error: errorCompra } = await this.supabase
            .from('compras')
            .insert([nuevaCompra]);
        if (errorCompra) {
            console.error('Error al guardar la compra:', errorCompra.message);
            return null;
        }

        const exitoButacas = await this.marcarButacasComoOcupadas();
        if (!exitoButacas) {
            console.error('La compra se guardó, pero hubo un error al marcar las butacas como ocupadas.');
            return null;
        }
        this.reiniciarCompra();
        return nuevaCompra;
    }

    private async marcarButacasComoOcupadas(): Promise<boolean> {
        const funcionId = this.funcionId();
        if (!funcionId) return false;

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