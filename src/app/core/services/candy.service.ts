import { Injectable, signal, computed, inject, DestroyRef } from "@angular/core";
import { SupabaseService } from './supabase.service';
import { Candy } from '../models/candyinterface';
import { RealtimeChannel } from "@supabase/supabase-js";


@Injectable({ providedIn: 'root' })
export class CandyService{
    private supabase = inject(SupabaseService).client;
    private destroyRef = inject(DestroyRef);

    private candySignal = signal<Candy[]>([]);

    cargando = signal(false);

    candy = computed(() => this.candySignal());

    private channel! : RealtimeChannel;

    constructor() {
        this.cargarCandydesdeDB();
        
        this.channel = this.iniciarRealTime();

        this.destroyRef.onDestroy(() =>{
            this.supabase.removeChannel(this.channel);
        });
    }

    private async cargarCandydesdeDB(): Promise<void> {
        
        this.cargando.set(true);

        const { data, error } = await this.supabase
            .from('candy')
            .select('*');

        console.log('DATOS:', data);
        console.log('ERROR:', error);

        if (error){
            console.error('Error al cargar candies:', error.message);
        } else{
            this.candySignal.set(data || []);
        }

        this.cargando.set(false);
    }
    
    private iniciarRealTime(): RealtimeChannel {
        return this.supabase
            .channel('candy-realtime')
            .on('postgres_changes',
                {event: '*', schema: 'public', table: 'candy'},
                (payload) => {
                    console.log('Cambio en tiempo real:', payload.eventType, payload);
                    
                    switch (payload.eventType){
                        case 'INSERT':
                            this.candySignal.update(candy =>[...candy, payload.new as Candy]);
                            break;

                        case 'UPDATE':
                            this.candySignal.update(candy =>
                                candy.map(c => c.candy_id === (payload.new as Candy).candy_id? payload.new as Candy : c)
                            );
                            break;

                        case 'DELETE':
                            this.candySignal.update(candy =>
                                candy.filter(c => c.candy_id !== (payload.old as {candy_id: string}).candy_id)
                            );
                            break;
                    }
                }
            )
            .subscribe();
    }

    getCandyId(id:string){
        return computed(() => this.candySignal().find(candy => candy.candy_id === id));
    }

    async agregarCandy(candy: Omit<Candy, 'candy_id'>): Promise<boolean> {
        const {error} = await this.supabase
            .from('candy')
            .insert([{...candy}]);

        if (error) {
            console.error('Error al agregar candy', error.message);
            return false;
        }

        console.log(`Nuevo candy Agregada: "${candy.nombre_candy}"`);
        return true;
    }

    async editarCandy(id: string, cambios: Omit<Candy, 'candy_id'>): Promise<boolean> {
        const { error } = await this.supabase
            .from('candy')
            .update(cambios)
            .eq('candy_id', id);

        if (error) {
            console.error('Error al editar candy:', error.message);
            return false;
        }
        return true;
    }
}