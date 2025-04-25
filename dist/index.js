var template$2 = "<span>Hello, ${this.name}!</span>";

var style = "span {\n  color: #df090c;\n  font-size: 1.5rem;\n  font-family: sans-serif;\n}\n";

/**
 * A light-weight implementation of a Web Component that uses imported template and styles.
 *
 * This class provides a foundation for creating custom Web Components that use imported template and styles.
 * It includes functionality for property observation, shadow DOM management, and render pipelines.
 *
 * To activate, run configureTemplate with the template and styles inlined from rollup/import.
 * To watch simple properties for changes, call watchSimplePropertiesForChanges.
 *
 * @abstract
 * @class
 * @extends HTMLElement
 */
class LightWebComponent {
    /**
     * Shadow root of the component
     */
    get shadow() {
        return this._shadow;
    }
    /**
     * If true, the render pipeline is active.
     */
    get isRenderPipelineEnabled() {
        return this.renderPipelineEnabled;
    }
    /**
     * Shadow root of the component
    */
    _shadow;
    /**
     * Host element for the component
     */
    el;
    /**
     * If true, the automatic render pipeline is active. Set to false to pause automatic rendering.
     */
    renderPipelineEnabled = true;
    /**
     * Raw template string, set by configureTemplate
     */
    rawTemplate = null;
    /**
     * Raw styles string, set by configureTemplate
     */
    rawStyles = null;
    /**
     * Record of properties that are intercepted and managed by the component.
     * This is used to intercept property changes and trigger the render pipeline.
     */
    shadowProperties = {};
    /**
     * The methods to run on render.
     */
    customRenderPipeline = [];
    /**
     * Constructs a new LightWebComponent instance and attaches the shadow root.
     * @param el - The host HTMLElement
     */
    constructor(el, template, styles) {
        this.el = el;
        this._shadow = this.el.attachShadow({ mode: 'open' });
        this.rawTemplate = template || null;
        this.rawStyles = styles || null;
        const tmp = el;
        // set a default render pipeline.
        if (tmp.preRender)
            this.customRenderPipeline.push(() => tmp.preRender.call(this.el));
        if (tmp.render) {
            this.customRenderPipeline.push(() => tmp.render.call(this.el));
        }
        else {
            this.customRenderPipeline.push(() => this.defaultRenderPipeline());
        }
        if (tmp.postRender)
            this.customRenderPipeline.push(() => tmp.postRender.call(this.el));
    }
    /**
     * Configures the template and styles for the component.
     * @param template - The HTML template string
     * @param styles - The CSS styles string
     * @param settings - Optional settings.  By default will watch for changes and perform an immediate render.
     */
    configureTemplate(template, styles, settings) {
        this.rawTemplate = template;
        this.rawStyles = styles;
        const defaults = { watchForFieldChanges: true, immediateRender: true };
        const mergedDefaults = { ...defaults, ...settings };
        if (mergedDefaults.watchForFieldChanges) {
            this.watchForFieldChanges();
        }
        if (mergedDefaults.immediateRender) {
            this.runRenderPipeline();
        }
    }
    /**
     * Watches simple properties from "observedAttributes" for changes.
     * When a property changes, it will automatically trigger a render.
     * This will not work for properties with getters/setters.
     */
    watchForFieldChanges() {
        const el = this.el;
        const ctor = el.constructor;
        const observedAttributes = ctor.observedAttributes;
        if (observedAttributes) {
            for (const attr of observedAttributes) {
                const descriptor = Object.getOwnPropertyDescriptor(el, attr);
                if (descriptor?.configurable && descriptor?.writable && descriptor?.enumerable) {
                    this.shadowProperties[attr] = el[attr];
                    Object.defineProperty(el, attr, {
                        get: () => this.getInterceptedProperty(attr),
                        set: (value) => {
                            this.setInterceptedProperty(attr, value);
                        },
                        configurable: true,
                        enumerable: true,
                    });
                }
            }
        }
    }
    /**
     * Runs the render pipeline, calling preRender, render, and postRender hooks if present.
     *
     * Your element should have the following hooks:
     * - preRender
     * - render
     * - postRender
     *
     * If you do not provide these hooks, the default render pipeline will be used.
     *
     * The default render pipeline will:
     * - evaluate the template and styles
     * - render the template and styles into the shadow DOM
     *
     */
    runRenderPipeline() {
        if (!this.renderPipelineEnabled)
            return;
        if (!this.rawTemplate || !this.rawStyles) {
            console.error('Template or styles not configured - please run configureTemplate first');
            return;
        }
        this.customRenderPipeline.forEach((step) => step());
    }
    /**
     * Pauses the automatic render pipeline.
     */
    pauseRenderPipeline() {
        this.renderPipelineEnabled = false;
    }
    /**
     * Resumes the automatic render pipeline.
     */
    resumeRenderPipeline() {
        this.renderPipelineEnabled = true;
    }
    /**
     * Updates the host element's properties and triggers a rerun of the render pipeline.
     * @param properties - Properties to update on the host element
     */
    updateProperties(properties) {
        this.pauseRenderPipeline();
        try {
            Object.assign(this.el, properties);
        }
        finally {
            this.resumeRenderPipeline();
        }
        this.runRenderPipeline();
    }
    // 5. Private methods
    /**
     * Gets the value of an intercepted property from shadowProperties.
     * @param name - The name of the property
     * @returns The value of the intercepted property
     */
    getInterceptedProperty(name) {
        return this.shadowProperties[name];
    }
    /**
     * Sets the value of an intercepted property in shadowProperties and triggers the render pipeline.
     * @param name - The name of the property
     * @param value - The new value to set
     */
    setInterceptedProperty(name, value) {
        this.shadowProperties[name] = value;
        this.runRenderPipeline();
    }
    /**
     * Evaluates a template string as an ES6 template literal in the context of this instance.
     * NOTE: This is not as feature rich as Angular, but it is sufficient for simple templates.
     * @returns The interpolated string
     */
    evaluateTemplate() {
        try {
            const template = this.rawTemplate;
            return new Function(`return \`${template}\`;`).call(this.el);
        }
        catch (e) {
            console.error('Error evaluating template:', e);
            return '';
        }
    }
    /**
     * Returns the styles string. Right now there isn't any additional processing of the string.
     * @returns The styles string
     */
    evaluateStyles() {
        return this.rawStyles;
    }
    /**
     * The default render pipeline that renders the template and styles into the shadow DOM.
     */
    defaultRenderPipeline() {
        const renderedTemplate = this.evaluateTemplate();
        const renderedStyles = this.evaluateStyles();
        this.renderTemplate(renderedTemplate, renderedStyles);
    }
    /**
     * Renders the provided template and styles into the component's shadow DOM.
     * @param template - The HTML template string to render
     * @param styles - The CSS styles string to render
     */
    renderTemplate(template, styles) {
        if (!this.shadow)
            return;
        this.shadow.innerHTML = `<style>${styles || ''}</style>${template}`;
    }
}

class HelloWorld extends HTMLElement {
    static get observedAttributes() {
        return ['name'];
    }
    name = 'World';
    lightComponent;
    connectedCallback() {
        this.lightComponent = new LightWebComponent(this);
        this.lightComponent.configureTemplate(template$2, style);
    }
}
customElements.define('hello-world', HelloWorld);

var template$1 = "<div class=\"donut-chart-container\">\n  <canvas class=\"donut-canvas\"></canvas>\n  <div class=\"donut-legend\"></div>\n  <div class=\"no-data-message\" style=\"display:none;\"></div>\n</div>\n";

var styles$1 = ".donut-chart-container {\n    display: flex;\n    align-items: center;\n    gap: 20px;\n    font-family: sans-serif;\n    justify-content: flex-start;\n}\n.donut-canvas {\n    display: block;\n}\n.donut-legend {\n    border-left: 1px solid #eee;\n    padding-left: 20px;\n    flex-shrink: 0;\n}\n.donut-legend ul {\n    list-style: none;\n    padding: 0;\n    margin: 0;\n    max-height: 280px;\n    overflow-y: auto;\n}\n.donut-legend li {\n    margin-bottom: 8px;\n    display: flex;\n    align-items: center;\n    font-size: 14px;\n}\n.legend-color-box {\n    width: 14px;\n    height: 14px;\n    display: inline-block;\n    margin-right: 8px;\n    border: 1px solid #ccc;\n}\n.legend-label { margin-right: 5px; color: #333; }\n.legend-amount { margin-right: 5px; color: #555; font-weight: bold; }\n.legend-percentage { color: #777; font-size: 0.9em; }\n.legend-total { margin-top: 15px; padding-top: 10px; border-top: 1px dashed #eee; font-size: 14px; }\n.no-data-message { color: #888; font-style: italic; padding: 20px; text-align: center; width: 100%; }\n@media (max-width: 600px) {\n    .donut-chart-container {\n        flex-direction: column;\n        align-items: center;\n    }\n    .donut-canvas {\n        margin: 0;\n    }\n    .donut-legend {\n        border-left: none;\n        border-top: 1px solid #eee;\n        padding-left: 0;\n        padding-top: 15px;\n        margin-top: 15px;\n        max-height: 150px;\n        width: 90%;\n        box-sizing: border-box;\n    }\n}\n";

// donut-chart.ts - HTML5 Web Component version
// This file implements the DonutChart custom element using TypeScript.
// It loads its template and CSS from external files and renders a donut chart to a canvas.
/**
 * DonutChart is a Web Component that renders an interactive and customizable donut chart.
 * It supports 3D effects, legends, labels, and dynamic data updates.
 */
class DonutChart extends HTMLElement {
    /**
     * Returns the list of attributes to observe for changes.
     * @returns {string[]}
     */
    static get observedAttributes() {
        return [
            'width', 'height', 'donut-thickness-ratio', 'label-in-chart',
            'label-in-chart-font-size', 'label-in-chart-threshold',
            'enable-3d-effect', 'depth-3d', 'enable-shadow',
            'shadow-color', 'shadow-blur', 'shadow-offset-x', 'shadow-offset-y'
        ];
    }
    /**
     * The data items to display in the donut chart.
     */
    items = [];
    /**
     * The width of the chart in pixels.
     */
    width = 300;
    /**
     * The height of the chart in pixels.
     */
    height = 300;
    /**
     * The ratio of the donut's thickness (0 to 1).
     */
    donutThicknessRatio = 0.4;
    /**
     * Whether to show labels inside the chart segments.
     */
    labelInChart = false;
    /**
     * Font size for labels inside the chart.
     */
    labelInChartFontSize = 12;
    /**
     * Minimum percentage threshold for showing a label inside a segment.
     */
    labelInChartThreshold = 5;
    /**
     * Enables or disables the 3D effect for the donut chart.
     */
    enable3dEffect = true;
    /**
     * The depth (in pixels) of the 3D effect.
     */
    depth3d = 8;
    /**
     * Enables or disables drop shadow for chart segments.
     */
    enableShadow = true;
    /**
     * The color of the drop shadow.
     */
    shadowColor = 'rgba(0, 0, 0, 0.3)';
    /**
     * The blur radius of the drop shadow.
     */
    shadowBlur = 6;
    /**
     * The horizontal offset of the drop shadow.
     */
    shadowOffsetX = 3;
    /**
     * The vertical offset of the drop shadow.
     */
    shadowOffsetY = 5;
    /**
     * The processed data items with calculated color and percentage.
     * @internal
     */
    processedData = [];
    /**
     * The sum of all segment values.
     * @internal
     */
    totalAmount = 0;
    /**
     * Animation frame ID for managing chart updates.
     * @internal
     */
    animationFrameId;
    /**
     * Default color palette for chart segments.
     * @internal
     */
    colors = [
        '#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6',
        '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#bdc3c7'
    ];
    lightComponent;
    get shadow() {
        return this.lightComponent?.shadow;
    }
    /**
     * Lifecycle callback: Invoked when the component is added to the DOM.
     */
    connectedCallback() {
        this.lightComponent = new LightWebComponent(this);
        this.lightComponent.configureTemplate(template$1, styles$1);
        window.addEventListener('resize', this.onResize);
    }
    /**
     * Lifecycle callback: Invoked when the component is removed from the DOM.
     */
    disconnectedCallback() {
        window.removeEventListener('resize', this.onResize);
        if (this.animationFrameId)
            cancelAnimationFrame(this.animationFrameId);
    }
    /**
     * Handles window resize events and triggers a re-render.
     * @private
     */
    onResize = () => {
        this.lightComponent?.runRenderPipeline();
    };
    /**
     * Processes the input data and calculates colors and percentages for each segment.
     *
     * Called by the render pipeline.
     *
     */
    preRender() {
        // Compute total and percentages
        this.totalAmount = this.items.reduce((sum, item) => sum + (item.amount > 0 ? item.amount : 0), 0);
        this.processedData = this.items.map((item, idx) => {
            const color = item.color || this.colors[idx % this.colors.length];
            const percentage = this.totalAmount > 0 ? (item.amount / this.totalAmount) * 100 : 0;
            return { ...item, color, percentage };
        });
    }
    /**
     * Called after the main template is rendered. Handles drawing the chart on the canvas.
     */
    postRender() {
        if (!this.shadow)
            return;
        // Get references
        const canvas = this.shadow.querySelector('canvas');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.clearRect(0, 0, this.width, this.height);
        if (this.totalAmount <= 0) {
            this.showNoData('Only zero or negative values provided.');
            return;
        }
        else {
            this.showNoData('');
        }
        // Chart dimensions
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const outerRadius = Math.min(centerX, centerY) * 0.95;
        const innerRadius = outerRadius * (1 - this.donutThicknessRatio);
        // Draw 3D effect (optional)
        this.draw3dEffect(ctx, centerX, centerY, outerRadius, innerRadius);
        // Draw main segments
        this.drawMainSegments(ctx, centerX, centerY, outerRadius, innerRadius);
        // Draw labels in chart (if enabled)
        this.drawLabels(innerRadius, outerRadius, centerX, centerY, ctx);
        // Draw legend
        this.drawLegend();
    }
    /**
   * Draws the main donut segments on the canvas.
   * @param ctx - The canvas rendering context
   * @param centerX - X coordinate of chart center
   * @param centerY - Y coordinate of chart center
   * @param outerRadius - Outer radius of the donut
   * @param innerRadius - Inner radius of the donut
   * @private
   */
    drawMainSegments(ctx, centerX, centerY, outerRadius, innerRadius) {
        let currentAngle = -Math.PI / 2;
        this.processedData.forEach(item => {
            if (!item.amount || item.amount <= 0)
                return;
            const segmentAngle = (item.amount / this.totalAmount) * 2 * Math.PI;
            const endAngle = currentAngle + segmentAngle;
            ctx.save();
            if (this.enableShadow) {
                ctx.shadowColor = this.shadowColor;
                ctx.shadowBlur = this.shadowBlur;
                ctx.shadowOffsetX = this.shadowOffsetX;
                ctx.shadowOffsetY = this.shadowOffsetY;
            }
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, currentAngle, true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            currentAngle = endAngle;
        });
    }
    /**
   * Draws the 3D effect for the donut chart if enabled.
   * @param ctx - The canvas rendering context
   * @param centerX - X coordinate of chart center
   * @param centerY - Y coordinate of chart center
   * @param outerRadius - Outer radius of the donut
   * @param innerRadius - Inner radius of the donut
   * @private
   */
    draw3dEffect(ctx, centerX, centerY, outerRadius, innerRadius) {
        if (this.enable3dEffect && this.depth3d > 0) {
            let depthAngle = -Math.PI / 2;
            this.processedData.forEach(item => {
                if (!item.amount || item.amount <= 0)
                    return;
                const segmentAngle = (item.amount / this.totalAmount) * 2 * Math.PI;
                const endAngle = depthAngle + segmentAngle;
                ctx.save();
                ctx.fillStyle = this.darkenColor(item.color, 35);
                ctx.beginPath();
                ctx.arc(centerX, centerY + this.depth3d, outerRadius, depthAngle, endAngle);
                ctx.arc(centerX, centerY + this.depth3d, innerRadius, endAngle, depthAngle, true);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                depthAngle = endAngle;
            });
        }
    }
    /**
   * Draws the labels inside the donut chart segments if enabled.
   * @param innerRadius - Inner radius of the donut
   * @param outerRadius - Outer radius of the donut
   * @param centerX - X coordinate of chart center
   * @param centerY - Y coordinate of chart center
   * @param ctx - The canvas rendering context
   * @private
   */
    drawLabels(innerRadius, outerRadius, centerX, centerY, ctx) {
        if (this.labelInChart) {
            let labelAngle = -Math.PI / 2;
            this.processedData.forEach(item => {
                if (!item.amount || item.amount <= 0 || !item.percentage || item.percentage < this.labelInChartThreshold) {
                    if (item.amount && item.amount > 0) {
                        const skippedAngle = (item.amount / this.totalAmount) * 2 * Math.PI;
                        labelAngle += skippedAngle;
                    }
                    return;
                }
                const segmentAngle = (item.amount / this.totalAmount) * 2 * Math.PI;
                const midAngle = labelAngle + segmentAngle / 2;
                const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.6;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                const labelLine1 = item.label;
                const labelLine2 = `(${item.percentage.toFixed(1)}%)`;
                ctx.save();
                ctx.fillStyle = item.labelColor ? item.labelColor : '#000000';
                ctx.font = `${this.labelInChartFontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const lineSpacing = this.labelInChartFontSize * 0.6;
                ctx.fillText(labelLine1, labelX, labelY - lineSpacing);
                ctx.fillText(labelLine2, labelX, labelY + lineSpacing);
                ctx.restore();
                labelAngle += segmentAngle;
            });
        }
    }
    /**
     * Displays or hides the no-data message in the chart.
     * @param msg - The message to display. If empty, hides the message.
     * @private
     */
    showNoData(msg) {
        const noDataMsg = this.shadow?.querySelector('.no-data-message');
        if (!noDataMsg)
            return;
        if (msg) {
            noDataMsg.textContent = msg;
            noDataMsg.style.display = '';
        }
        else {
            noDataMsg.textContent = '';
            noDataMsg.style.display = 'none';
        }
    }
    /**
     * Draws the legend for the donut chart.
     * @private
     */
    drawLegend() {
        const legend = this.shadow?.querySelector('.donut-legend');
        if (!legend)
            return;
        if (this.labelInChart || this.processedData.length === 0) {
            legend.innerHTML = '';
            return;
        }
        let html = '<ul>';
        this.processedData.forEach(item => {
            html += `<li><span class="legend-color-box" style="background:${item.color}"></span>` +
                `<span class="legend-label">${item.label}:</span>` +
                `<span class="legend-amount">${item.amount}</span>` +
                `<span class="legend-percentage">(${item.percentage?.toFixed(1)}%)</span></li>`;
        });
        html += '</ul>';
        if (this.totalAmount > 0) {
            html += `<div class="legend-total"><strong>Total: ${this.totalAmount}</strong></div>`;
        }
        legend.innerHTML = html;
    }
    /**
     * Returns a darker shade of the given color.
     * @param hex - The hex color string
     * @param intensity - The amount to darken (default: 30)
     * @returns The darkened hex color string
     * @private
     */
    darkenColor(hex, intensity = 30) {
        // Accepts #RRGGBB or #RGB
        let c = hex.replace('#', '');
        if (c.length === 3)
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        let r = parseInt(c.substring(0, 2), 16) - intensity;
        let g = parseInt(c.substring(2, 4), 16) - intensity;
        let b = parseInt(c.substring(4, 6), 16) - intensity;
        r = Math.max(0, r);
        g = Math.max(0, g);
        b = Math.max(0, b);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}
// Register the custom element
customElements.define('donut-chart', DonutChart);

var template = "<div class=\"timeline-wrapper\">\n${this.wrappedRows.map((row, rowIndex) => `\n  <div class=\"timeline-row${rowIndex % 2 === 1 ? ' reverse' : ''}\">\n    ${row.map((node, i, arr) => `\n      <div class=\"timeline-node-stack\">\n        <div class=\"timeline-node-container\">\n          ${rowIndex > 0 && i === arr.length - 1 ? `<div class=\"connector\"><span class=\"days-between\">${this.getPreviousNodeDays(node)} days</span></div>` : ''}\n          <div class=\"node\"><span class=\"check\">&#10003;</span></div>\n          ${i !== arr.length - 1 ? `<div class=\"connector\"><span class=\"days-between\">${node.daysTillNext} days</span></div>` : ''}\n        </div>\n        <div class=\"label\">${node.label}</div>\n        <div class=\"date\">${node.dateObj instanceof Date ? node.dateObj.toLocaleDateString() : ''}</div>\n      </div>\n    `).join('')}\n  </div>\n`).join('')}\n</div>";

var styles = ".timeline-row {\n    display: flex;\n    align-items: flex-start;\n    justify-content: center;\n    flex-wrap: wrap;\n    flex-direction: row;\n    gap: 0;\n    position: relative;\n}\n.timeline-row.reverse {\n    flex-direction: row-reverse;\n}\n\n/* New stack for EACH node and its info */\n.timeline-node-stack {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    width: 130px; /* Set a reasonable minimum width for alignment */\n}\n\n.timeline-node-container {\n    position: relative;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.node {\n    width: 48px;\n    height: 48px;\n    border-radius: 50%;\n    background: #d4aa47;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 2rem;\n    color: white;\n    z-index: 1;\n    margin-bottom: 8px;\n    margin-top: 4px;\n    box-shadow: 0 2px 4px #0002;\n    position: relative;\n}\n\n.connector {\n    position: absolute;\n    top: 24px;\n    left: 100%;\n    width: 74px;\n    height: 2px;\n    background: #bbb;\n    z-index: 0;\n    margin-left: 0;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.label {\n    margin-top: 7px;\n    font-weight: 600;\n    color: #222;\n    font-size: 1.04rem;\n    text-align: center;\n    white-space: normal;\n}\n\n.date {\n    font-size: .98rem;\n    color: #888;\n    margin-top: -2px;\n    text-align: center;\n}\n\n.days-between {\n    background: white;\n    padding: 2px 5px;\n    font-size: 0.8rem;\n    color: #666;\n    border-radius: 10px;\n    box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n    position: absolute;\n    top: -15px;\n}\n\n.timeline-row.reverse .connector {\n    left: auto;\n    right: 100%;\n}\n\n.timeline-row.reverse .days-between {\n    left: auto;\n    right: 0;\n}";

/**
 * TimelineChart web component for displaying a timeline of statuses.
 * Extends BaseComponent and renders timeline items in a responsive, wrapped row layout.
 */
class TimelineChart extends HTMLElement {
    items = [];
    displayNodes = [];
    wrappedRows = [];
    wc;
    /**
     * Returns the list of observed attributes for this component.
     * @returns {string[]} The attributes to observe for changes.
     */
    static get observedAttributes() {
        return ['items'];
    }
    /**
     * Called when the component is added to the DOM. Sets up the template, listeners, and triggers initial render.
     */
    connectedCallback() {
        this.wc = new LightWebComponent(this);
        this.wc.configureTemplate(template, styles);
        window.addEventListener('resize', this.onResize);
    }
    /**
     * Called when the component is removed from the DOM. Cleans up listeners.
     */
    disconnectedCallback() {
        window.removeEventListener('resize', this.onResize);
    }
    /**
     * Handles window resize events by triggering a re-render pipeline after a short delay.
     */
    onResize = () => {
        setTimeout(() => this.wc?.runRenderPipeline(), 0);
    };
    /**
     * Prepares the displayNodes array by converting item dates to Date objects and sorting them chronologically.
     */
    prepareDisplayNodes() {
        this.displayNodes = (this.items || [])
            .map(n => ({
            ...n,
            dateObj: typeof n.date === 'string' ? new Date(n.date) : n.date
        }))
            .sort((a, b) => +a.dateObj - +b.dateObj);
    }
    /**
     * Prepares and arranges timeline nodes for rendering.
     * Calculates how many nodes fit per row, wraps nodes, reverses alternate rows for zigzag effect,
     * and computes days till next node for each item.
     */
    preRender() {
        const shadow = this.wc?.shadow;
        if (!shadow)
            return;
        this.prepareDisplayNodes();
        const container = shadow.querySelector('.timeline-wrapper');
        if (!container)
            return;
        const containerWidth = container.offsetWidth;
        const columnWidth = 130;
        const nodesPerRow = Math.max(1, Math.floor(containerWidth / columnWidth));
        this.wrappedRows = [];
        for (let i = 0; i < this.displayNodes.length; i += nodesPerRow) {
            let row = this.displayNodes.slice(i, i + nodesPerRow);
            if ((this.wrappedRows.length % 2) === 1) {
                row = row.slice().reverse();
            }
            for (let j = 0; j < row.length - 1; j++) {
                row[j].daysTillNext = this.calculateDaysBetween(row[j].dateObj, row[j + 1].dateObj);
            }
            this.wrappedRows.push(row);
        }
    }
    /**
     * Calculates the number of days between two dates.
     * @param date1 - The start date.
     * @param date2 - The end date.
     * @returns {number} Number of days between date1 and date2 (rounded up).
     */
    calculateDaysBetween(date1, date2) {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Gets the number of days between the given node and the previous node in the displayNodes array.
     * @param node - The node to compare (must include dateObj).
     * @returns {number} Days between this node and the previous node, or 0 if no previous node.
     */
    getPreviousNodeDays(node) {
        const startIndex = this.displayNodes.indexOf(node);
        const endIndex = startIndex - 1;
        const startNode = this.displayNodes[startIndex];
        const endNode = this.displayNodes[endIndex];
        if (!endNode)
            return 0;
        return this.calculateDaysBetween(startNode.dateObj, endNode.dateObj);
    }
}
customElements.define('timeline-chart', TimelineChart);

export { DonutChart, TimelineChart };
//# sourceMappingURL=index.js.map
