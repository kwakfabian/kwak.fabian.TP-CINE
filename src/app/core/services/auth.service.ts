import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';
import { Usuario } from '../models/usuariointerface';

@Injectable({ providedIn: 'root' })

export class AuthService{
    private supabase = inject(SupabaseService).client;

    currentUser = signal<User | null>(null);
    currentSession = signal<Session | null>(null);

    currentUserData = signal<Usuario | null>(null);

    constructor(){
        this.initAuthSession();
    }

    private initAuthSession(){
        this.supabase.auth.getSession().then(({ data: { session }}) => {
            this.currentSession.set(session);
            this.currentUser.set(session?.user ?? null);

            if (session?.user){
                this.cargarDatosUsuario(session.user.id);
            }
        });

        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.currentSession.set(session);
            this.currentUser.set(session?.user ?? null);
            if (session?.user) {
                this.cargarDatosUsuario(session.user.id);
            } else {
                this.currentUserData.set(null);
            }
        });
    }

    private async cargarDatosUsuario(userId: string) {

    console.log("ID DEL USUARIO AUTH:", userId);

    const { data, error } = await this.supabase
        .from('usuarios')
        .select('*')
        .eq('usuario_id', userId)
        .maybeSingle();

    if (error) {
        console.error("ERROR USUARIO:", error);
    } else {
        console.log("DATOS USUARIO:", data);
        this.currentUserData.set(data);
    }
}

    async signUp(email: string, password:string, nombre:string, apellido:string, fechaDeNacimiento:string, tipoDeSangre:string, colorDeOjos:string,vacacionesPorAnio:number){
        return this.supabase.auth.signUp({email, password,
            options:{
                data:{
                    nombre:nombre,
                    apellido:apellido,
                    fechaDeNacimiento:fechaDeNacimiento,
                    tipoDeSangre:tipoDeSangre,
                    colorDeOjos:colorDeOjos,
                    vacacionesPorAnio:vacacionesPorAnio

                }
            }
        })
    }
    
    async signIn(email:string, password:string){
        return this.supabase.auth.signInWithPassword({ email, password })
    }

    async signOut(){
        return this.supabase.auth.signOut();
    }
}