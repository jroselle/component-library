import { LightWebComponent } from '../base-component/light-web-component';
import template from './timeline-chart.html';
import styles from './timeline-chart.css';


/**
 * Represents a status in the timeline chart.
 * @property label - The label for the timeline status.
 * @property date - The date associated with the timeline status (can be a Date object or an ISO string).
 * @property daysTillNext - (Optional) Number of days until the next status. Computed in the component.
 */
export interface TimelineStatus {
  label: string;
  date: Date | string;
  daysTillNext?: number; // computed in the component, calculates the number of days between the current node and the next one
}



/**
 * TimelineChart web component for displaying a timeline of statuses.
 * Extends BaseComponent and renders timeline items in a responsive, wrapped row layout.
 */
export class TimelineChart extends HTMLElement {
  items: TimelineStatus[] = [];
  displayNodes: (TimelineStatus & { dateObj: Date })[] = [];
  wrappedRows: any[][] = [];

  private wc?: LightWebComponent;

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
    if (!shadow) return;

    this.prepareDisplayNodes();

    const container = shadow.querySelector('.timeline-wrapper') as HTMLElement;
    if (!container) return;
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
        row[j].daysTillNext = this.calculateDaysBetween(
          row[j].dateObj,
          row[j + 1].dateObj
        );
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
  calculateDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Gets the number of days between the given node and the previous node in the displayNodes array.
   * @param node - The node to compare (must include dateObj).
   * @returns {number} Days between this node and the previous node, or 0 if no previous node.
   */
  getPreviousNodeDays(node: TimelineStatus & { dateObj: Date }): number {
    const startIndex = this.displayNodes.indexOf(node);
    const endIndex = startIndex - 1;
    const startNode = this.displayNodes[startIndex];
    const endNode = this.displayNodes[endIndex];
    if (!endNode) return 0;
    return this.calculateDaysBetween(startNode.dateObj, endNode.dateObj);
  }

}

customElements.define('timeline-chart', TimelineChart);

