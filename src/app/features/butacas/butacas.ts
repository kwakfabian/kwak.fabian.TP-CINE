import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ButacasService } from '../../core/services/butacas.service';
import { CompraService } from '../../core/services/compra.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-butacas',
  imports: [CommonModule],
  templateUrl: './butacas.html',
  styleUrl: './butacas.css'
})
export class Butacas implements OnInit {

  filas: string[] = [
  'A', 'B', 'C', 'D', 'E',
  'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T'
  ];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private butacasService = inject(ButacasService);
  private compraService = inject(CompraService);

  funcionId!: string;
  cantidadBoletos!: number;

  butacas: string[] = [];
  butacasOcupadas: string[] = [];
  butacasSeleccionadas: string[] = [];

  async ngOnInit() {

    this.funcionId =
      this.route.snapshot.queryParamMap.get('funcionId')!;

    this.cantidadBoletos =
      Number(this.route.snapshot.queryParamMap.get('cantidad'));

    this.compraService.setearFuncion(
      this.funcionId,
      this.cantidadBoletos
    );

    this.butacas =
      this.butacasService.generarTodasLasButacas();

    this.butacasOcupadas =
      await this.butacasService.obtenerButacasOcupadas(
        this.funcionId
      );
  }

  estaOcupada(butaca: string): boolean {
    return this.butacasOcupadas.includes(butaca);
  }

  estaSeleccionada(butaca: string): boolean {
    return this.butacasSeleccionadas.includes(butaca);
  }

  seleccionarButaca(butaca: string) {
    if (this.estaOcupada(butaca)) {
      return;
    }

    if (this.estaSeleccionada(butaca)) {
      this.butacasSeleccionadas =
        this.butacasSeleccionadas.filter(
          b => b !== butaca
        );
    } else {
      if (
        this.butacasSeleccionadas.length >=
        this.cantidadBoletos
      ) {
        return;
      }
      this.butacasSeleccionadas.push(butaca);
    }
  }

  puedeContinuar(): boolean {
    return (
      this.butacasSeleccionadas.length ===
      this.cantidadBoletos
    );
  }

  continuar() {
    if (!this.puedeContinuar()) {
      alert(
        `Tenés que elegir ${this.cantidadBoletos} butaca(s) para continuar.`
      );
      return;
    }
    this.compraService.setearButacas(
      this.butacasSeleccionadas
    );
    console.log(
      'Butacas guardadas en CompraService:',
      this.compraService.butacasSeleccionadas()
    );
    this.router.navigate(['/candy']);
  }
}