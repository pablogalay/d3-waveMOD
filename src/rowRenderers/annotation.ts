import type { WaveGraph } from '../waveGraph';
import { AnyWaveGraphValue, SignalDataValueTuple, WaveGraphSignalTypeInfo, WaveGraphSignal } from '../data';
import { RowRendererBase } from './base';

export class RowRendererAnnotation extends RowRendererBase {
  constructor(waveGraph: WaveGraph) {
    super(waveGraph);
    this.DEFAULT_FORMAT = (d: AnyWaveGraphValue) => String(d);
    this.FORMATTERS = {
      'default': this.DEFAULT_FORMAT
    };
  }

  select(typeInfo: WaveGraphSignalTypeInfo): boolean {
    // This renderer is specialized for annotation rendering
    // It would be called explicitly rather than through type selection
    return false;
  }

  render(parent: d3.Selection<SVGGElement, any, any, any>, data: SignalDataValueTuple[], typeInfo: WaveGraphSignalTypeInfo, formatter?: string | ((d: AnyWaveGraphValue) => string)) {
    // First call parent renderer to get the background
    super.render(parent, data, typeInfo, formatter);

    const waveRowX = this.waveGraph.waveRowX;
    if (!waveRowX) {
      return;
    }

    const signal = parent.datum() as WaveGraphSignal;
    if (!signal.annotations || signal.annotations.length === 0) {
      return;
    }

    // Eliminar anotaciones anteriores
    parent.selectAll('.signal-annotation').remove();

    // Crear grupo para las anotaciones
    const annotationsGroup = parent.append('g')
      .attr('class', 'signal-annotation');

    // Obtener la altura de la fila
    const waveRowHeight = this.waveGraph.sizes.row.height;

    // Dibujar las anotaciones según el tipo de señal
    signal.annotations.forEach(annotation => {
      const x = waveRowX(annotation.time);

      if (annotation.startTime !== undefined && annotation.endTime !== undefined) {
        const startX = Math.max(waveRowX(annotation.startTime), 0);
        const endX = waveRowX(annotation.endTime);
        
        // Determinar el tipo de anotación según el ancho de la señal
        const isMultiBit = signal.type.width != 1;
        
        
        const lineY = signal.type.name === 'wire' ? -5 : -10;
        const textWidth = 20;

        if (startX < endX) {
          if (isMultiBit) {
            // Para señales multi-bit, usar líneas diagonales
            const patternId = `diagonalHatch_${Math.random().toString(36).substr(2, 9)}`;
            
            // Definir el patrón de líneas diagonales en el SVG
            const defs = annotationsGroup.append('defs');
            const pattern = defs.append('pattern')
              .attr('id', patternId)
              .attr('patternUnits', 'userSpaceOnUse')
              .attr('width', 8)
              .attr('height', 8)
              .attr('patternTransform', 'rotate(45)');
            
            pattern.append('line')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', 8)
              .attr('stroke', annotation.color)
              .attr('stroke-width', 2);
            
            // Crear un rectángulo con el patrón de líneas diagonales
            annotationsGroup.append('rect')
              .attr('x', startX)
              .attr('y', 0)
              .attr('width', endX - startX)
              .attr('height', waveRowHeight)
              .attr('fill', `url(#${patternId})`)
              .attr('fill-opacity', 1)
              .attr('pointer-events', 'none');
          } else {
            // Para señales de un bit, usar líneas horizontales
            // Línea sin palabra
            annotationsGroup.append('line')
              .attr('x1', startX)
              .attr('y1', lineY + 15) 
              .attr('x2', endX)
              .attr('y2', lineY + 15)
              .attr('stroke', annotation.color)
              .attr('stroke-width', 2)
              .attr('pointer-events', 'none');
            
          }

          /*// Añadir la etiqueta de texto en el centro del rango
          annotationsGroup.append('text')
            .attr('x', x)
            .attr('y', isMultiBit ? waveRowHeight / 2 : lineY + 18)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', annotation.color)
            .attr('font-weight', 'bold')
            .text(annotation.text);*/
        }
      }
    });
  }
}