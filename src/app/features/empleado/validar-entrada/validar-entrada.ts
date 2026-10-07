import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompraService } from '../../../core/services/compra.service';

@Component({
  selector: 'app-validar-entrada',
  imports: [FormsModule],
  templateUrl: './validar-entrada.html',
  styleUrl: './validar-entrada.css',
})
export class ValidarEntrada {

  private compraService = inject(CompraService);
  codigo = '';
  mensaje = signal<string | null>(null);
  tipoMensaje = signal<'exito' | 'error' | null>(null);
  cargando = signal(false);

  async validarCodigo() {

    const codigoLimpio = this.codigo.trim();

    if (!codigoLimpio) {
      this.mensaje.set('Ingresá un código para validar.');
      this.tipoMensaje.set('error');
      return;
    }

    this.cargando.set(true);
    this.mensaje.set(null);
    this.tipoMensaje.set(null);

    try {

      const resultado =
        await this.compraService.validarEntrada(codigoLimpio);

      if (resultado.exito) {

        this.tipoMensaje.set('exito');
        this.mensaje.set(resultado.mensaje);

      } else {

        this.tipoMensaje.set('error');
        this.mensaje.set(resultado.mensaje);

      }

    } catch (error) {

      console.error(error);

      this.tipoMensaje.set('error');
      this.mensaje.set('Ocurrió un error al validar la entrada.');

    } finally {

      this.cargando.set(false);

    }
  }

  codigoEscaneado(codigo: string) {
    this.codigo = codigo;
    this.validarCodigo();
  }

  limpiar() {
    this.codigo = '';
    this.mensaje.set(null);
    this.tipoMensaje.set(null);
  }
}