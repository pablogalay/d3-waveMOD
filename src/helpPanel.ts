import { WaveGraph } from './waveGraph';

export class HelpPanel {
  private waveGraph: WaveGraph;
  private helpDialogId: string = 'd3-wave-help-dialog';
  private helpDialog: HTMLDivElement | null = null;
  
  constructor(waveGraph: WaveGraph) {
    this.waveGraph = waveGraph;
  }
  
  /**
   * Muestra u oculta el panel de ayuda
   */
  toggle(): void {
    console.log('Toggle help panel');
    // Si el diálogo ya existe, lo elimina (lo cierra)
    const existingDialog = document.getElementById(this.helpDialogId);
    if (existingDialog) {
      document.body.removeChild(existingDialog);
      this.helpDialog = null;
      return;
    }
    
    // Si no existe, lo crea y muestra
    this.showHelpDialog();
  }
  
  /**
   * Crea y muestra el panel de ayuda
   */
  private showHelpDialog(): void {
    // Crear un nuevo diálogo
    this.helpDialog = document.createElement('div');
    this.helpDialog.id = this.helpDialogId;
    this.helpDialog.style.position = 'fixed';
    this.helpDialog.style.top = '50%';
    this.helpDialog.style.left = '50%';
    this.helpDialog.style.transform = 'translate(-50%, -50%)';
    this.helpDialog.style.backgroundColor = '#fff';
    this.helpDialog.style.padding = '20px';
    this.helpDialog.style.border = '1px solid #ccc';
    this.helpDialog.style.borderRadius = '5px';
    this.helpDialog.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    this.helpDialog.style.zIndex = '1000';
    this.helpDialog.style.maxWidth = '800px';
    this.helpDialog.style.maxHeight = '80vh';
    this.helpDialog.style.overflow = 'auto';
    
    // Contenido de la ayuda
    this.helpDialog.innerHTML = `
      <h2 style="margin-top: 0; color: #333;">D3-Wave Help</h2>
      
      <h3>Navigation</h3>
      <ul>
        <li><strong>Pan:</strong> Click and drag on the main area to move the view horizontally.</li>
        <li><strong>Zoom:</strong> Use mouse wheel to zoom in and out.</li>
        <li><strong>Reset View:</strong> Click the arrows icon in the toolbar to reset zoom and fit the content to the screen.</li>
      </ul>
      
      <h3>Signal Management</h3>
      <ul>
        <li><strong>Filter Signals:</strong> Click the filter icon to open the signal filter panel.</li>
        <li><strong>Expand/Collapse:</strong> Click the arrow next to a signal name to expand or collapse its children.</li>
        <li><strong>Context Menu:</strong> Right-click on a signal name to access formatting options and other actions.</li>
        <li><strong>Signal Breakdown:</strong> Right-click on multi-bit signals and select "Break down" to display individual bits.</li>
      </ul>
      
      <h3>Signal Comparison</h3>
      <ul>
        <li><strong>Signals S and S*:</strong> These signals are automatically compared, and differences are highlighted.</li>
        <li><strong>Bit-level Comparison:</strong> For multi-bit signals, individual bits are compared when broken down.</li>
        <li><strong>Difference Highlighting:</strong>
          <ul>
            <li>Single-bit signals: Differences are marked with horizontal red lines.</li>
            <li>Multi-bit signals: Differences are marked with diagonal red stripes.</li>
          </ul>
        </li>
      </ul>
      
      <h3>Visual Elements</h3>
      <ul>
        <li><strong>Red Markings:</strong> Indicate differences between signals S and S*.</li>
        <li><strong>Gray Areas:</strong> Represent invalid or unknown values (X, Z, etc.).</li>
        <li><strong>Vertical Help Line:</strong> A guideline that follows your cursor for time reference.</li>
      </ul>
      
      <h3>Other Features</h3>
      <ul>
        <li><strong>Download SVG:</strong> Click the download icon to save the current view as an SVG image.</li>
        <li><strong>Regenerate Signals:</strong> Click the refresh icon to restore any signals that were removed.</li>
        <li><strong>Resize Panels:</strong> Drag the divider between the signal names and waveforms to adjust the width.</li>
      </ul>
      
      <div style="text-align: center; margin-top: 20px;">
        <button id="closeHelpButton" style="padding: 8px 16px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;
    
    // Añadir el diálogo al body
    document.body.appendChild(this.helpDialog);
    
    // Agregar event listener para cerrar el diálogo
    document.getElementById('closeHelpButton')?.addEventListener('click', () => {
      this.toggle();
    });
    
    // También cerrar al hacer clic fuera del diálogo
    
  }
  
  /**
   * Cierra el panel de ayuda al hacer clic fuera de él
   */
  private closeOnClickOutside = (event: MouseEvent): void => {
    if (this.helpDialog && event.target && 
        !this.helpDialog.contains(event.target as Node) && 
        event.target !== this.helpDialog) {
      this.toggle();
      document.removeEventListener('click', this.closeOnClickOutside);
    }
  }
}