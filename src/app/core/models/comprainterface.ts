export interface Compra {
    compra_id?: string;
    funciones_id: string;
    usuario_id: string | null;
    nombre_comprador: string | null;
    email_comprador: string | null;
    butacas: string[];
    candy_items: any | null;
    precio_total: number;
}