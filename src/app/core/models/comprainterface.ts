export interface Compra {
    compra_id?: string;
    funciones_id: string;
    usuario_id: string | null;
    nombre_comprador: string | null;
    email_comprador: string | null;
    fecha_nacimiento_comprador: string | null;
    butacas: string[];
    candy_productos: any | null;
    qr_disponible: boolean;
    codigo_qr: string;
    precio_total: number;
}