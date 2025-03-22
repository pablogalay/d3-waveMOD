import { ContextMenu, ContextMenuItem } from './contextMenu';
export class SignalContextMenu extends ContextMenu {
    constructor(waveGraph) {
        super();
        this.waveGraph = waveGraph;
    }
    getMenuItems(d) {
        var _a;
        let waveGraph = this.waveGraph;
        let formatOptions = [];
        // construct format options from values in formatters dictionary
        var formatters = ((_a = d.data.data.type.renderer) === null || _a === void 0 ? void 0 : _a.FORMATTERS) || {};
        function formatChanger(cm, elm, data, index) {
            var _a;
            const key = data.data;
            // function which switches data format function on every currently selected signals
            const newFormatter = formatters[key];
            d.data.data.type.formatter = newFormatter;
            const currentRenderrer = d.data.data.type.renderer;
            (_a = waveGraph.treelist) === null || _a === void 0 ? void 0 : _a.visibleNodes().forEach(function (d) {
                if (d.data.type.isSelected && d.data.type.renderer === currentRenderrer) {
                    // === currentRenderrer because we do not want to change format on signals
                    // which do not support this format option
                    d.data.type.formatter = newFormatter;
                }
            });
            waveGraph.draw();
        }
        for (var key in formatters) {
            if (formatters.hasOwnProperty(key)) {
                formatOptions.push(new ContextMenuItem(
                /*title*/ key, key, [], 
                /* divider */ false, 
                /* disabled */ false, 
                /*action*/ formatChanger));
            }
        }
        return [
            new ContextMenuItem('Remove', d.data, [], false, false, 
            /*action*/ (cm, elm, data, index) => {
                var _a;
                d.data.data.type.isSelected = true;
                return (_a = waveGraph.treelist) === null || _a === void 0 ? void 0 : _a.filter((d) => {
                    return !d.type.isSelected;
                });
            }),
            new ContextMenuItem('Format', d.data, 
            /* children */ formatOptions, 
            /* divider */ false, 
            /* disabled */ formatOptions.length == 0, 
            /*action*/ null)
        ];
    }
}
//# sourceMappingURL=signalLabelContextMenu.js.map