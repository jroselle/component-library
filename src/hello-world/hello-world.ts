import { LightWebComponent } from '../base-component/light-web-component';

import template from './hello-world.html';
import style from './hello-world.css';
/**
 * HelloWorld is a Web Component that renders a simple greeting message.
 * It supports dynamic name updates and uses a custom template and styles.
 * 
 * This is a demostration of using the light component to separate the 
 * template and styles from the component logic.
 */
class HelloWorld extends HTMLElement {
  /**
   * Returns an array of attribute names to watch for changes.
   * @returns An array of attribute names to watch for changes
   */
  static get observedAttributes() {
    return ['name'];
  }

  public name: string = 'World';

  private lightComponent?: LightWebComponent;

  /**
   * Called when the component is first connected to the DOM.
   * Initializes the light component and configures the template and styles.
   */
  connectedCallback() {
    this.lightComponent = new LightWebComponent(this);
    this.lightComponent.configureTemplate(template, style);
  }

}

customElements.define('hello-world', HelloWorld);

