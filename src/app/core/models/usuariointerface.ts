export interface Usuario {
    usuario_id: string;
    email: string;
    nombre: string;
    apellido: string;
    fechaDeNacimiento: string;
    tipoDeSangre: string[];
    colorDeOjos: string[];
    vacacionesPorAnio: number;
    credito: number;
    rol: string;
}