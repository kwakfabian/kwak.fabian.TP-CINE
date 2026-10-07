import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })

export class ButacasService {

  constructor(private supabase: SupabaseService) {
  }

  async obtenerButacasOcupadas(funcionId: string): Promise<string[]> {

    const { data, error } = await this.supabase.client
      .from('butacas')
      .select('butacas_ocupadas')
      .eq('funciones_id', funcionId)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener las butacas ocupadas:', error);
      throw error;
    }

    return data?.butacas_ocupadas ?? [];
  }

  iniciarRealTime(funcionId: string, actualizarButacas: (butacas: string[]) => void): RealtimeChannel {

    return this.supabase.client
      .channel(`butacas-${funcionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'butacas',
          filter: `funciones_id=eq.${funcionId}`
        },
        (payload) => {

          console.log('Cambio en butacas:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const nuevasButacas = payload.new['butacas_ocupadas'] ?? [];
            actualizarButacas(nuevasButacas);
          }
        }
      )
      .subscribe();
  }

  detenerRealTime(channel: RealtimeChannel) {
    this.supabase.client.removeChannel(channel);
  }

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