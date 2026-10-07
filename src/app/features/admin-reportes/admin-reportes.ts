import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ReporteService } from '../../core/services/reporte.service';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

@Component({
    selector: 'app-admin-reportes',
    imports: [],
    templateUrl: './admin-reportes.html',
    styleUrl: './admin-reportes.css'
})
export class AdminReportes implements OnInit, OnDestroy {

    private reporteService =inject(ReporteService);
    facturacion = signal(0);
    entradasVendidas = signal(0);
    cargando = signal(true);
    periodoPeliculas = signal<'semana' | 'mes'>('semana');
    periodoCandy = signal<'semana' | 'mes'>('semana');
    private graficoPeliculas?: Chart;
    private graficoCandy?: Chart;

    async ngOnInit() {

        const reporte = await this.reporteService.obtenerReporteDiario();
        this.facturacion.set(reporte.facturacion);
        this.entradasVendidas.set(reporte.entradasVendidas);
        this.cargando.set(false);

        setTimeout(async () => {
            await this.cargarPeliculasMasVistas();
            await this.cargarCandyMasVendido();
        }, 0);
    }

    async cambiarPeriodoPeliculas(
        periodo: 'semana' | 'mes'
    ) {
        this.periodoPeliculas.set(periodo);
        await this.cargarPeliculasMasVistas();
    }

    async cambiarPeriodoCandy(
        periodo: 'semana' | 'mes'
    ) {
        this.periodoCandy.set(periodo);
        await this.cargarCandyMasVendido();
    }

    async cargarPeliculasMasVistas() {
        const peliculas = await this.reporteService.obtenerPeliculasMasVistas(this.periodoPeliculas());
        const nombres = peliculas.map(pelicula => pelicula.titulo);
        const entradas = peliculas.map(pelicula =>pelicula.entradas);
        this.graficoPeliculas?.destroy();
        const canvas = document.getElementById('graficoPeliculas') as HTMLCanvasElement;

        if (!canvas) {
            return;
        }

        this.graficoPeliculas =
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: nombres,
                    datasets: [
                        {
                            label: 'Entradas vendidas',
                            data: entradas,
                            backgroundColor: '#ffffff',
                            borderColor: '#ffffff',
                            borderWidth: 1
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },

                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                color: '#ffffff',
                                precision: 0
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.1)'
                            }
                        },

                        y: {
                            ticks: {
                                color: '#ffffff'
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.1)'
                            }
                        }
                    }
                }
            });
    }

    async cargarCandyMasVendido() {

        const productos = await this.reporteService.obtenerCandyMasVendido(this.periodoCandy());
        const nombres = productos.map(producto => producto.nombre);
        const cantidades = productos.map(producto => producto.cantidad);
        this.graficoCandy?.destroy();
        const canvas = document.getElementById('graficoCandy') as HTMLCanvasElement;

        if (!canvas) {
            return;
        }

        this.graficoCandy =
            new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: nombres,
                    datasets: [
                        {
                            label: 'Unidades vendidas',
                            data: cantidades,
                            backgroundColor: '#ffffff',
                            borderColor: '#ffffff',
                            borderWidth: 1
                        }
                    ]
                },

                options: {

                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },

                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                color: '#ffffff',
                                precision: 0
                            },
                            grid: {
                                color:'rgba(255,255,255,0.1)'
                            }
                        },

                        y: {
                            ticks: {
                                color: '#ffffff'
                            },
                            grid: {
                                color:'rgba(255,255,255,0.1)'
                            }
                        }
                    }
                }
            });
    }


    exportarPDF() {

        const pdf = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-AR');
        pdf.setFontSize(20);
        pdf.text('Reporte de facturación', 20, 20);
        pdf.setFontSize(12);
        pdf.text(`Fecha: ${fecha}`, 20, 35);
        pdf.text(`Facturación total: $${this.facturacion()}`, 20, 45);
        pdf.text(`Entradas vendidas: ${this.entradasVendidas()}`, 20, 55);
        pdf.save(`reporte-facturacion-${fecha.replace(/\//g, '-')}.pdf`);
    }

    exportarExcel() {

        const fecha = new Date().toLocaleDateString('es-AR');
        const datos = [
            {
                Fecha: fecha,
                'Facturación total': this.facturacion(),
                'Entradas vendidas': this.entradasVendidas()
            }
        ];

        const hoja =XLSX.utils.json_to_sheet(datos);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Facturación');
        XLSX.writeFile(libro, `reporte-facturacion-${fecha.replace(/\//g, '-')}.xlsx`);
    }

    ngOnDestroy() {
        this.graficoPeliculas?.destroy();
        this.graficoCandy?.destroy();
    }
}