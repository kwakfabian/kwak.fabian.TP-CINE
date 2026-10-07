import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Configuracion } from '../models/configuracioninterface';

@Injectable({ providedIn: 'root' })

export class ConfiguracionService {

    private supabase = inject(SupabaseService).client;
    configuracion = signal<Configuracion | null>(null);

    constructor() {
        this.cargarConfiguracion();
    }

    async cargarConfiguracion() {

        const { data, error } = await this.supabase
            .from('configuracion')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error al cargar la configuracion:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.error('No se encontro ninguna configuracion.');
            this.configuracion.set(null);
            return;
        }

        this.configuracion.set(data[0]);
    }

    async modificarConfiguracion(
        precioEstandar: number,
        precioDiscapacitado: number,
        precioVip: number
    ): Promise<boolean> {

        const configuracionActual = this.configuracion();

        if (!configuracionActual) {
            console.error('No se encontro la configuracion.');
            return false;
        }

        const { error } = await this.supabase
            .from('configuracion')
            .update({
                precio_estandar: precioEstandar,
                precio_discapacitado: precioDiscapacitado,
                precio_vip: precioVip
            })
            .eq('configuracion_id', configuracionActual.configuracion_id);

        if (error) {
            console.error('Error al modificar la configuracion:', error.message);
            return false;
        }

        await this.cargarConfiguracion();

        return true;
    }
}