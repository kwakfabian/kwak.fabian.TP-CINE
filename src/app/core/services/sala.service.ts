import { Injectable, signal, computed, inject, DestroyRef } from "@angular/core";
import { SupabaseService } from './supabase.service';
import { Sala } from '../models/salainterface';
import { RealtimeChannel } from "@supabase/supabase-js";

@Injectable({ providedIn: 'root' })

export class SalaService {

    private supabase = inject(SupabaseService).client;
    private destroyRef = inject(DestroyRef);
    private salasSignal = signal<Sala[]>([]);
    private channel! : RealtimeChannel;
    cargando = signal(false);
    salas = computed(() => this.salasSignal());

    constructor() {

        this.cargarSalasdesdeDB();
        this.channel = this.iniciarRealTime();
        this.destroyRef.onDestroy(() => {this.supabase.removeChannel(this.channel);});
    }

    private async cargarSalasdesdeDB(): Promise<void> {

        this.cargando.set(true);
        const { data, error } = await this.supabase
            .from('salas')
            .select('*');

        console.log('DATOS:', data);
        console.log('ERROR:', error);

        if (error) {
            console.error('Error al cargar salas:', error.message);
        } else {
            this.salasSignal.set(data || []);
        }
        this.cargando.set(false);
    }

    private iniciarRealTime(): RealtimeChannel {
        return this.supabase
            .channel('salas-realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'salas' },
                (payload) => {
                    console.log('Cambio en tiempo real:', payload.eventType, payload);

                    switch (payload.eventType) {
                        case 'INSERT':
                            this.salasSignal.update(salas => [...salas, payload.new as Sala]);
                            break;

                        case 'UPDATE':
                            this.salasSignal.update(salas =>
                                salas.map(s => s.salas_id === (payload.new as Sala).salas_id ? payload.new as Sala : s)
                            );
                            break;

                        case 'DELETE':
                            this.salasSignal.update(salas =>
                                salas.filter(s => s.salas_id !== (payload.old as { salas_id: string }).salas_id)
                            );
                            break;
                    }
                }
            )
            .subscribe();
    }

    getSalaId(id: string) {
        return computed(() => this.salasSignal().find(sala => sala.salas_id === id));
    }
}