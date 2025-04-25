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
export class LightWebComponent {
  /**
   * Shadow root of the component
   */
  public get shadow(): ShadowRoot {
    return this._shadow;
  }

  /**
   * If true, the render pipeline is active.
   */
  public get isRenderPipelineEnabled(): boolean {
    return this.renderPipelineEnabled;
  }

  /**
   * Shadow root of the component
  */
  private _shadow: ShadowRoot;

  /**
   * Host element for the component
   */
  private el: HTMLElement;
  /**
   * If true, the automatic render pipeline is active. Set to false to pause automatic rendering.
   */
  private renderPipelineEnabled: boolean = true;
  /**
   * Raw template string, set by configureTemplate
   */
  private rawTemplate: string | null = null;
  /**
   * Raw styles string, set by configureTemplate
   */
  private rawStyles: string | null = null;
  /**
   * Record of properties that are intercepted and managed by the component.
   * This is used to intercept property changes and trigger the render pipeline.
   */
  private shadowProperties: Record<string, unknown> = {};

  /**
   * The methods to run on render.
   */
  private customRenderPipeline: Array<() => void> = [];

  /**
   * Constructs a new LightWebComponent instance and attaches the shadow root.
   * @param el - The host HTMLElement
   */
  constructor(el: HTMLElement, template?: string, styles?: string) {
    this.el = el;
    this._shadow = this.el.attachShadow({ mode: 'open' });
    this.rawTemplate = template || null;
    this.rawStyles = styles || null;

    const tmp : any = el;

    // set a default render pipeline.
    if (tmp.preRender) this.customRenderPipeline.push( () => tmp.preRender.call(this.el));
    if (tmp.render) {
      this.customRenderPipeline.push( () => tmp.render.call(this.el));
    } else {
      this.customRenderPipeline.push( () => this.defaultRenderPipeline());
    }
    if (tmp.postRender) this.customRenderPipeline.push( () => tmp.postRender.call(this.el));
  }

  /**
   * Configures the template and styles for the component.
   * @param template - The HTML template string
   * @param styles - The CSS styles string
   * @param settings - Optional settings.  By default will watch for changes and perform an immediate render.
   */
  public configureTemplate(template: string, styles: string, settings?: { watchForFieldChanges?: boolean, immediateRender?: boolean}) {
    this.rawTemplate = template;
    this.rawStyles = styles;

    const defaults = { watchForFieldChanges: true, immediateRender: true};
    const mergedDefaults = {...defaults, ...settings};

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
  public watchForFieldChanges() {
    interface ObservedAttributesConstructor {
      observedAttributes?: string[];
    }
    const el = this.el;
    const ctor = el.constructor as ObservedAttributesConstructor;
    const observedAttributes = ctor.observedAttributes;
    if (observedAttributes) {
      for (const attr of observedAttributes) {
        const descriptor = Object.getOwnPropertyDescriptor(el, attr);
        if (descriptor?.configurable && descriptor?.writable && descriptor?.enumerable) {
          this.shadowProperties[attr] = (el as any)[attr];
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
  public runRenderPipeline() {
    if (!this.renderPipelineEnabled) return;
    if (!this.rawTemplate || !this.rawStyles) {
      console.error('Template or styles not configured - please run configureTemplate first');
      return;
    }
    this.customRenderPipeline.forEach((step) => step());
  }

  /**
   * Pauses the automatic render pipeline.
   */
  public pauseRenderPipeline() {
    this.renderPipelineEnabled = false;
  }

  /**
   * Resumes the automatic render pipeline.
   */
  public resumeRenderPipeline() {
    this.renderPipelineEnabled = true;
  }

  /**
   * Updates the host element's properties and triggers a rerun of the render pipeline.
   * @param properties - Properties to update on the host element
   */
  public updateProperties(properties: Record<string, unknown>) {
    this.pauseRenderPipeline();
    try {
      Object.assign(this.el, properties);
    } finally {
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
  private getInterceptedProperty(name: string) {
    return this.shadowProperties[name];
  }

  /**
   * Sets the value of an intercepted property in shadowProperties and triggers the render pipeline.
   * @param name - The name of the property
   * @param value - The new value to set
   */
  private setInterceptedProperty(name: string, value: unknown) {
    this.shadowProperties[name] = value;
    this.runRenderPipeline();
  }

  /**
   * Evaluates a template string as an ES6 template literal in the context of this instance.
   * NOTE: This is not as feature rich as Angular, but it is sufficient for simple templates.
   * @returns The interpolated string
   */
  private evaluateTemplate(): string {
    try {
      const template = this.rawTemplate;
      return new Function(`return \`${template}\`;`).call(this.el);
    } catch (e) {
      console.error('Error evaluating template:', e);
      return '';
    }
  }

  /**
   * Returns the styles string. Right now there isn't any additional processing of the string.
   * @returns The styles string
   */
  private evaluateStyles() {
    return this.rawStyles;
  }

  /**
   * The default render pipeline that renders the template and styles into the shadow DOM.
   */
  private defaultRenderPipeline() {
    const renderedTemplate = this.evaluateTemplate();
    const renderedStyles = this.evaluateStyles();
    this.renderTemplate(renderedTemplate, renderedStyles);
  }

  /**
   * Renders the provided template and styles into the component's shadow DOM.
   * @param template - The HTML template string to render
   * @param styles - The CSS styles string to render
   */
  private renderTemplate(template: string | null, styles: string | null) {
    if (!this.shadow) return;
    this.shadow.innerHTML = `<style>${styles || ''}</style>${template}`;
  }
}