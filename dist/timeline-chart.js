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

export { TimelineChart };
//# sourceMappingURL=timeline-chart.js.map
