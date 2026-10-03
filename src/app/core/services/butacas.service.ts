import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ButacasService {

  constructor(private supabase: SupabaseService) {}

  async obtenerButacasOcupadas(funcionId: string): Promise<string[]> {

    const { data, error } = await this.supabase.client
      .from('butacas')
      .select('butacas_ocupadas')
      .eq('funciones_id', funcionId)
      .maybeSingle();   // 👈 cambiado de .single() a .maybeSingle()

    if (error) {
      console.error('Error al obtener las butacas ocupadas:', error);
      throw error;
    }

    // Si no hay fila todavía (nadie compró para esta función), no hay ocupadas
    return data?.butacas_ocupadas ?? [];
  }

  // Genera la lista completa de butacas que existen en una sala.
  // Por ahora, fijo para todas las salas (ajustable si cada sala es distinta).
  generarTodasLasButacas(): string[] {
    const filas = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
    const butacas: string[] = [];

    for (const fila of filas) {
      const cantidadColumnas = (fila === 'J' || fila === 'K') ? 14 : 28;

      for (let col = 1; col <= cantidadColumnas; col++) {
        butacas.push(`${fila}${col}`);
      }
    }

    return butacas;
  }
}