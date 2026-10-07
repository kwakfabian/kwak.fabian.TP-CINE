import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Cupon } from '../models/cuponinterface';

@Injectable({
    providedIn: 'root'
})
export class CuponService {

    private supabase = inject(SupabaseService).client;

    cupones = signal<Cupon[]>([]);
    cuponesUsados = signal<string[]>([]);

    constructor() {
        this.cargarCupones();
    }

    async cargarCupones() {
        const { data, error } = await this.supabase
            .from('cupones')
            .select('*')
            .order('codigo');

        if (error) {
            console.error('Error al cargar los cupones:', error.message);
            return;
        }

        this.cupones.set(data ?? []);
    }

    async cargarCuponesUsados(usuarioId: string) {

        const { data, error } = await this.supabase
            .from('cupones_usados')
            .select('cupon_id')
            .eq('usuario_id', usuarioId);

        if (error) {
            console.error('Error al cargar los cupones usados:', error.message);
            this.cuponesUsados.set([]);
            return;
        }

        this.cuponesUsados.set(
            (data ?? []).map(item => item.cupon_id)
        );
    }

    cuponFueUsado(cuponId: string): boolean {
        return this.cuponesUsados().includes(cuponId);
    }

    async registrarCuponUsado(cuponId: string, usuarioId: string): Promise<boolean> {

        const { error } = await this.supabase
            .from('cupones_usados')
            .insert([{
                cupon_id: cuponId,
                usuario_id: usuarioId
            }]);

        if (error) {
            console.error('Error al registrar el cupon usado:', error.message);
            return false;
        }

        await this.cargarCuponesUsados(usuarioId);

        return true;
    }

    async crearCupon(codigo: string, descuento: number): Promise<boolean> {

        const { error } = await this.supabase
            .from('cupones')
            .insert([{
                codigo: codigo.toUpperCase(),
                descuento: descuento,
                activo: true
            }]);

        if (error) {
            console.error('Error al crear el cupon:', error.message);
            return false;
        }

        await this.cargarCupones();
        return true;
    }

    async modificarCupon(
        cuponId: string,
        codigo: string,
        descuento: number
    ): Promise<boolean> {

        const { error } = await this.supabase
            .from('cupones')
            .update({
                codigo: codigo.toUpperCase(),
                descuento: descuento
            })
            .eq('cupon_id', cuponId);

        if (error) {
            console.error('Error al modificar el cupon:', error.message);
            return false;
        }

        await this.cargarCupones();
        return true;
    }

    async cambiarEstadoCupon(cupon: Cupon): Promise<boolean> {

        const { error } = await this.supabase
            .from('cupones')
            .update({
                activo: !cupon.activo
            })
            .eq('cupon_id', cupon.cupon_id);

        if (error) {
            console.error('Error al cambiar el estado del cupon:', error.message);
            return false;
        }

        await this.cargarCupones();
        return true;
    }
}