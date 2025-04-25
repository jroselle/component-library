/**
 * Represents a single data item for the donut chart.
 * @property label - The label for the segment
 * @property amount - The numeric value for the segment
 * @property color - The color of the segment (optional)
 * @property percentage - The percentage value (calculated, optional)
 * @property labelColor - The color of the label (optional)
 */
interface DonutDataItem {
    label: string;
    amount: number;
    color?: string;
    percentage?: number;
    labelColor?: string;
}
import { LightWebComponent } from '../base-component/light-web-component';
/**
 * DonutChart is a Web Component that renders an interactive and customizable donut chart.
 * It supports 3D effects, legends, labels, and dynamic data updates.
 */
export declare class DonutChart extends HTMLElement {
    /**
     * Returns the list of attributes to observe for changes.
     * @returns {string[]}
     */
    static get observedAttributes(): string[];
    /**
     * The data items to display in the donut chart.
     */
    items: DonutDataItem[];
    /**
     * The width of the chart in pixels.
     */
    width: number;
    /**
     * The height of the chart in pixels.
     */
    height: number;
    /**
     * The ratio of the donut's thickness (0 to 1).
     */
    donutThicknessRatio: number;
    /**
     * Whether to show labels inside the chart segments.
     */
    labelInChart: boolean;
    /**
     * Font size for labels inside the chart.
     */
    labelInChartFontSize: number;
    /**
     * Minimum percentage threshold for showing a label inside a segment.
     */
    labelInChartThreshold: number;
    /**
     * Enables or disables the 3D effect for the donut chart.
     */
    enable3dEffect: boolean;
    /**
     * The depth (in pixels) of the 3D effect.
     */
    depth3d: number;
    /**
     * Enables or disables drop shadow for chart segments.
     */
    enableShadow: boolean;
    /**
     * The color of the drop shadow.
     */
    shadowColor: string;
    /**
     * The blur radius of the drop shadow.
     */
    shadowBlur: number;
    /**
     * The horizontal offset of the drop shadow.
     */
    shadowOffsetX: number;
    /**
     * The vertical offset of the drop shadow.
     */
    shadowOffsetY: number;
    /**
     * The processed data items with calculated color and percentage.
     * @internal
     */
    private processedData;
    /**
     * The sum of all segment values.
     * @internal
     */
    private totalAmount;
    /**
     * Animation frame ID for managing chart updates.
     * @internal
     */
    private animationFrameId?;
    /**
     * Default color palette for chart segments.
     * @internal
     */
    private colors;
    lightComponent?: LightWebComponent;
    private get shadow();
    /**
     * Lifecycle callback: Invoked when the component is added to the DOM.
     */
    connectedCallback(): void;
    /**
     * Lifecycle callback: Invoked when the component is removed from the DOM.
     */
    disconnectedCallback(): void;
    /**
     * Handles window resize events and triggers a re-render.
     * @private
     */
    private onResize;
    /**
     * Processes the input data and calculates colors and percentages for each segment.
     *
     * Called by the render pipeline.
     *
     */
    preRender(): void;
    /**
     * Called after the main template is rendered. Handles drawing the chart on the canvas.
     */
    postRender(): void;
    /**
   * Draws the main donut segments on the canvas.
   * @param ctx - The canvas rendering context
   * @param centerX - X coordinate of chart center
   * @param centerY - Y coordinate of chart center
   * @param outerRadius - Outer radius of the donut
   * @param innerRadius - Inner radius of the donut
   * @private
   */
    private drawMainSegments;
    /**
   * Draws the 3D effect for the donut chart if enabled.
   * @param ctx - The canvas rendering context
   * @param centerX - X coordinate of chart center
   * @param centerY - Y coordinate of chart center
   * @param outerRadius - Outer radius of the donut
   * @param innerRadius - Inner radius of the donut
   * @private
   */
    private draw3dEffect;
    /**
   * Draws the labels inside the donut chart segments if enabled.
   * @param innerRadius - Inner radius of the donut
   * @param outerRadius - Outer radius of the donut
   * @param centerX - X coordinate of chart center
   * @param centerY - Y coordinate of chart center
   * @param ctx - The canvas rendering context
   * @private
   */
    private drawLabels;
    /**
     * Displays or hides the no-data message in the chart.
     * @param msg - The message to display. If empty, hides the message.
     * @private
     */
    private showNoData;
    /**
     * Draws the legend for the donut chart.
     * @private
     */
    private drawLegend;
    /**
     * Returns a darker shade of the given color.
     * @param hex - The hex color string
     * @param intensity - The amount to darken (default: 30)
     * @returns The darkened hex color string
     * @private
     */
    private darkenColor;
}
export {};
