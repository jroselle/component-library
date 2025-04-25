/**
 * Represents a status in the timeline chart.
 * @property label - The label for the timeline status.
 * @property date - The date associated with the timeline status (can be a Date object or an ISO string).
 * @property daysTillNext - (Optional) Number of days until the next status. Computed in the component.
 */
export interface TimelineStatus {
    label: string;
    date: Date | string;
    daysTillNext?: number;
}
/**
 * TimelineChart web component for displaying a timeline of statuses.
 * Extends BaseComponent and renders timeline items in a responsive, wrapped row layout.
 */
export declare class TimelineChart extends HTMLElement {
    items: TimelineStatus[];
    displayNodes: (TimelineStatus & {
        dateObj: Date;
    })[];
    wrappedRows: any[][];
    private wc?;
    /**
     * Returns the list of observed attributes for this component.
     * @returns {string[]} The attributes to observe for changes.
     */
    static get observedAttributes(): string[];
    /**
     * Called when the component is added to the DOM. Sets up the template, listeners, and triggers initial render.
     */
    connectedCallback(): void;
    /**
     * Called when the component is removed from the DOM. Cleans up listeners.
     */
    disconnectedCallback(): void;
    /**
     * Handles window resize events by triggering a re-render pipeline after a short delay.
     */
    onResize: () => void;
    /**
     * Prepares the displayNodes array by converting item dates to Date objects and sorting them chronologically.
     */
    prepareDisplayNodes(): void;
    /**
     * Prepares and arranges timeline nodes for rendering.
     * Calculates how many nodes fit per row, wraps nodes, reverses alternate rows for zigzag effect,
     * and computes days till next node for each item.
     */
    preRender(): void;
    /**
     * Calculates the number of days between two dates.
     * @param date1 - The start date.
     * @param date2 - The end date.
     * @returns {number} Number of days between date1 and date2 (rounded up).
     */
    calculateDaysBetween(date1: Date, date2: Date): number;
    /**
     * Gets the number of days between the given node and the previous node in the displayNodes array.
     * @param node - The node to compare (must include dateObj).
     * @returns {number} Days between this node and the previous node, or 0 if no previous node.
     */
    getPreviousNodeDays(node: TimelineStatus & {
        dateObj: Date;
    }): number;
}
