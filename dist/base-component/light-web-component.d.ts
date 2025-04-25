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
export declare class LightWebComponent {
    /**
     * Shadow root of the component
     */
    get shadow(): ShadowRoot;
    /**
     * If true, the render pipeline is active.
     */
    get isRenderPipelineEnabled(): boolean;
    /**
     * Shadow root of the component
    */
    private _shadow;
    /**
     * Host element for the component
     */
    private el;
    /**
     * If true, the automatic render pipeline is active. Set to false to pause automatic rendering.
     */
    private renderPipelineEnabled;
    /**
     * Raw template string, set by configureTemplate
     */
    private rawTemplate;
    /**
     * Raw styles string, set by configureTemplate
     */
    private rawStyles;
    /**
     * Record of properties that are intercepted and managed by the component.
     * This is used to intercept property changes and trigger the render pipeline.
     */
    private shadowProperties;
    /**
     * The methods to run on render.
     */
    private customRenderPipeline;
    /**
     * Constructs a new LightWebComponent instance and attaches the shadow root.
     * @param el - The host HTMLElement
     */
    constructor(el: HTMLElement, template?: string, styles?: string);
    /**
     * Configures the template and styles for the component.
     * @param template - The HTML template string
     * @param styles - The CSS styles string
     * @param settings - Optional settings.  By default will watch for changes and perform an immediate render.
     */
    configureTemplate(template: string, styles: string, settings?: {
        watchForFieldChanges?: boolean;
        immediateRender?: boolean;
    }): void;
    /**
     * Watches simple properties from "observedAttributes" for changes.
     * When a property changes, it will automatically trigger a render.
     * This will not work for properties with getters/setters.
     */
    watchForFieldChanges(): void;
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
    runRenderPipeline(): void;
    /**
     * Pauses the automatic render pipeline.
     */
    pauseRenderPipeline(): void;
    /**
     * Resumes the automatic render pipeline.
     */
    resumeRenderPipeline(): void;
    /**
     * Updates the host element's properties and triggers a rerun of the render pipeline.
     * @param properties - Properties to update on the host element
     */
    updateProperties(properties: Record<string, unknown>): void;
    /**
     * Gets the value of an intercepted property from shadowProperties.
     * @param name - The name of the property
     * @returns The value of the intercepted property
     */
    private getInterceptedProperty;
    /**
     * Sets the value of an intercepted property in shadowProperties and triggers the render pipeline.
     * @param name - The name of the property
     * @param value - The new value to set
     */
    private setInterceptedProperty;
    /**
     * Evaluates a template string as an ES6 template literal in the context of this instance.
     * NOTE: This is not as feature rich as Angular, but it is sufficient for simple templates.
     * @returns The interpolated string
     */
    private evaluateTemplate;
    /**
     * Returns the styles string. Right now there isn't any additional processing of the string.
     * @returns The styles string
     */
    private evaluateStyles;
    /**
     * The default render pipeline that renders the template and styles into the shadow DOM.
     */
    private defaultRenderPipeline;
    /**
     * Renders the provided template and styles into the component's shadow DOM.
     * @param template - The HTML template string to render
     * @param styles - The CSS styles string to render
     */
    private renderTemplate;
}
