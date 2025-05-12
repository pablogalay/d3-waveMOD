// Primero, vamos a crear una clase para el panel de filtro
import { WaveGraphSignal } from './data';

export class SignalFilterPanel {
  private graph: any;
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private filterPanel: d3.Selection<any, unknown, null, undefined> | null = null;
  private isOpen: boolean = false;
  private signalCheckboxes: Map<string, boolean> = new Map();
  private originalFilter: ((d: WaveGraphSignal) => boolean) | null = null;
  private allSignalsList: string[] = []; // Para almacenar todas las señales disponibles

  constructor(graph: any) {
    this.graph = graph;
    this.container = graph.svg.append('g')
      .attr('class', 'filter-panel-container');
  }

  // Método para mostrar/ocultar el panel
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Método para abrir el panel
  private open(): void {
    const graph = this.graph;
    
    // Guardar el filtro original
    this.originalFilter = graph.treelist?.getFilter() || null;
    
    // Crear el div del panel si no existe
    if (!this.filterPanel) {
      // Usamos foreignObject para incluir elementos HTML dentro del SVG
      const foreignObject = this.container.append("foreignObject")
        .attr("width", 300)
        .attr("height", 400)
        .attr("x", graph.sizes.margin.left + 50)
        .attr("y", graph.sizes.margin.top + 20);

      this.filterPanel = foreignObject.append("xhtml:div")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
        .style("max-height", "350px")
        .style("overflow-y", "auto");

      // Añadir título
      this.filterPanel.append("h3")
        .style("margin-top", "0")
        .style("border-bottom", "1px solid #eee")
        .style("padding-bottom", "8px")
        .text("Filter Signals");

      // Contenedor para los checkboxes
      const checkboxContainer = this.filterPanel.append("div")
        .style("margin-bottom", "10px");

      // Añadir botones de acción
      const buttonContainer = this.filterPanel.append("div")
        .style("display", "flex")
        .style("justify-content", "space-between")
        .style("margin-top", "10px");

      buttonContainer.append("button")
        .style("padding", "4px 8px")
        .style("background-color", "#f1f1f1")
        .style("border", "1px solid #ddd")
        .style("border-radius", "3px")
        .style("cursor", "pointer")
        .text("Select All")
        .on("click", () => this.selectAll(true));

      buttonContainer.append("button")
        .style("padding", "4px 8px")
        .style("background-color", "#f1f1f1")
        .style("border", "1px solid #ddd")
        .style("border-radius", "3px")
        .style("cursor", "pointer")
        .text("Deselect All")
        .on("click", () => this.selectAll(false));

      buttonContainer.append("button")
        .style("padding", "4px 8px")
        .style("background-color", "#4CAF50")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "3px")
        .style("cursor", "pointer")
        .text("Apply")
        .on("click", () => this.applyFilter());

      buttonContainer.append("button")
        .style("padding", "4px 8px")
        .style("background-color", "#f44336")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "3px")
        .style("cursor", "pointer")
        .text("Cancel")
        .on("click", () => this.close());

      // Poblar con checkboxes
      this.populateCheckboxes(checkboxContainer);
    }

    // Mostrar el panel
    this.container.style("display", "block");
    this.isOpen = true;
  }

  // Método para cerrar el panel
  private close(): void {
    if (this.container) {
      this.container.style("display", "none");
    }
    this.isOpen = false;
  }

  // Método para poblar la lista de checkboxes con las señales disponibles
  private populateCheckboxes(container: d3.Selection<HTMLDivElement, unknown, null, undefined>): void {
    // Limpiar contenedor
    container.html("");
    
    // Obtener todas las señales disponibles y almacenarlas
    this.allSignalsList = this.getAllSignals(this.graph._allData);
    
    // Crear un conjunto de señales actualmente visibles
    const visibleSignals = new Set<string>();
    if (this.graph.data) {
      this.graph.data.forEach((signal: WaveGraphSignal) => {
        visibleSignals.add(signal.name);
      });
    }
    
    // Crear checkboxes para cada señal
    this.allSignalsList.forEach(signal => {
      const isChecked = visibleSignals.has(signal);
      this.signalCheckboxes.set(signal, isChecked);
      
      const label = container.append("label")
        .style("display", "block")
        .style("margin", "5px 0")
        .style("cursor", "pointer");
      
      const checkbox = label.append("input")
        .attr("type", "checkbox")
        .attr("name", "signal")
        .attr("value", signal)
        .property("checked", isChecked)
        .style("margin-right", "8px")
        .on("change", () => {
          const isChecked = (checkbox.node() as HTMLInputElement).checked;
          this.signalCheckboxes.set(signal, isChecked);
        });
      
      label.append("span")
        .text(signal);
    });
  }
  
  // Método para seleccionar/deseleccionar todos los checkboxes
  private selectAll(select: boolean): void {
    if (!this.filterPanel) return;
    
    // Actualizar los checkboxes en el DOM
    this.filterPanel.selectAll("input[type=checkbox]")
      .property("checked", select);
    
    // Actualizar el mapa de señales
    this.signalCheckboxes.forEach((_, key) => {
      this.signalCheckboxes.set(key, select);
    });
  }
  
  // Método para aplicar el filtro basado en los checkboxes seleccionados
  private applyFilter(): void {
    if (!this.graph.treelist) return;
    
    // Paso 1: Quitar cualquier filtro existente para mostrar todas las señales primero
    this.graph.treelist.resetFilter();
    
    // Reconstruir el árbol completo de señales
    if (this.graph._allData) {
      // Crear una nueva jerarquía con todos los datos originales
      this.graph.treelist.data(this.graph._allData);
      this.graph.draw();
    }
    
    // Paso 2: Crear un conjunto de señales seleccionadas
    const selectedSignals = new Set<string>();
    this.signalCheckboxes.forEach((isSelected, signalName) => {
      if (isSelected) {
        selectedSignals.add(signalName);
      }
    });
    
    // Paso 3: Aplicar el filtro al TreeList después de haber mostrado todas las señales
    this.graph.treelist.filter((d: WaveGraphSignal) => {
      // Si es una señal derivada de descomposición, buscar su padre
      if (d.isBrokenDown && d.name.includes('_bit')) {
        const parentName = d.name.split('_bit')[0];
        return selectedSignals.has(parentName);
      }
      return selectedSignals.has(d.name);
    });
    
    // Redibuja el gráfico
    this.graph.draw();
    
    // Cierra el panel
    this.close();
  }
  
  // Método para obtener todas las señales disponibles del árbol
  private getAllSignals(signal: WaveGraphSignal | undefined): string[] {
    if (!signal) return [];
    
    let signals: string[] = [];
    
    // Añadir la señal actual si no es una señal derivada automáticamente
    if (!signal.isBrokenDown) {
      signals.push(signal.name);
    }
    
    // Recorrer los hijos recursivamente
    if (signal.children) {
      signal.children.forEach(child => {
        signals = signals.concat(this.getAllSignals(child));
      });
    }
    
    // También recorrer los _children (nodos colapsados)
    if (signal._children) {
      signal._children.forEach(child => {
        signals = signals.concat(this.getAllSignals(child));
      });
    }
    
    return signals;
  }
}