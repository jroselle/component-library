// donut-chart.ts - HTML5 Web Component version
// This file implements the DonutChart custom element using TypeScript.
// It loads its template and CSS from external files and renders a donut chart to a canvas.

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

import template from './donut-chart.html';
import styles from './donut-chart.css';
import { LightWebComponent } from '../base-component/light-web-component';

/**
 * DonutChart is a Web Component that renders an interactive and customizable donut chart.
 * It supports 3D effects, legends, labels, and dynamic data updates.
 */
export class DonutChart extends HTMLElement {

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
  public items: DonutDataItem[] = [];
  /**
   * The width of the chart in pixels.
   */
  public width: number = 300;
  /**
   * The height of the chart in pixels.
   */
  public height: number = 300;
  /**
   * The ratio of the donut's thickness (0 to 1).
   */
  public donutThicknessRatio: number = 0.4;
  /**
   * Whether to show labels inside the chart segments.
   */
  public labelInChart: boolean = false;
  /**
   * Font size for labels inside the chart.
   */
  public labelInChartFontSize: number = 12;
  /**
   * Minimum percentage threshold for showing a label inside a segment.
   */
  public labelInChartThreshold: number = 5;
  /**
   * Enables or disables the 3D effect for the donut chart.
   */
  public enable3dEffect: boolean = true;
  /**
   * The depth (in pixels) of the 3D effect.
   */
  public depth3d: number = 8;
  /**
   * Enables or disables drop shadow for chart segments.
   */
  public enableShadow: boolean = true;
  /**
   * The color of the drop shadow.
   */
  public shadowColor: string = 'rgba(0, 0, 0, 0.3)';
  /**
   * The blur radius of the drop shadow.
   */
  public shadowBlur: number = 6;
  /**
   * The horizontal offset of the drop shadow.
   */
  public shadowOffsetX: number = 3;
  /**
   * The vertical offset of the drop shadow.
   */
  public shadowOffsetY: number = 5;

  /**
   * The processed data items with calculated color and percentage.
   * @internal
   */
  private processedData: DonutDataItem[] = [];
  /**
   * The sum of all segment values.
   * @internal
   */
  private totalAmount: number = 0;
  /**
   * Animation frame ID for managing chart updates.
   * @internal
   */
  private animationFrameId?: number;
  /**
   * Default color palette for chart segments.
   * @internal
   */
  private colors: string[] = [
    '#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#bdc3c7'
  ];

  public lightComponent?: LightWebComponent;

  private get shadow() {
    return this.lightComponent?.shadow;
  }

  /**
   * Lifecycle callback: Invoked when the component is added to the DOM.
   */
  connectedCallback() {
    this.lightComponent = new LightWebComponent(this);
    this.lightComponent.configureTemplate(template, styles);


    window.addEventListener('resize', this.onResize);
  }

  /**
   * Lifecycle callback: Invoked when the component is removed from the DOM.
   */
  disconnectedCallback() {
    window.removeEventListener('resize', this.onResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Handles window resize events and triggers a re-render.
   * @private
   */
  private onResize = () => {
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
    if (!this.shadow) return;

    // Get references
    const canvas = this.shadow.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = this.width;
    canvas.height = this.height;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.totalAmount <= 0) {
      this.showNoData('Only zero or negative values provided.');
      return;
    } else {
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
  private drawMainSegments(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, outerRadius: number, innerRadius: number) {
    let currentAngle = -Math.PI / 2;
    this.processedData.forEach(item => {
      if (!item.amount || item.amount <= 0) return;
      const segmentAngle = (item.amount / this.totalAmount) * 2 * Math.PI;
      const endAngle = currentAngle + segmentAngle;
      ctx.save();
      if (this.enableShadow) {
        ctx.shadowColor = this.shadowColor;
        ctx.shadowBlur = this.shadowBlur;
        ctx.shadowOffsetX = this.shadowOffsetX;
        ctx.shadowOffsetY = this.shadowOffsetY;
      }
      ctx.fillStyle = item.color!;
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
  private draw3dEffect(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, outerRadius: number, innerRadius: number) {
    if (this.enable3dEffect && this.depth3d > 0) {
      let depthAngle = -Math.PI / 2;
      this.processedData.forEach(item => {
        if (!item.amount || item.amount <= 0) return;
        const segmentAngle = (item.amount / this.totalAmount) * 2 * Math.PI;
        const endAngle = depthAngle + segmentAngle;
        ctx.save();
        ctx.fillStyle = this.darkenColor(item.color!, 35);
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
  private drawLabels(innerRadius: number, outerRadius: number, centerX: number, centerY: number, ctx: CanvasRenderingContext2D) {
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
  private showNoData(msg: string) {
    const noDataMsg: HTMLElement | null | undefined = this.shadow?.querySelector('.no-data-message');
    if (!noDataMsg) return;
    if (msg) {
      noDataMsg.textContent = msg;
      noDataMsg.style.display = '';
    } else {
      noDataMsg.textContent = '';
      noDataMsg.style.display = 'none';
    }
  }

  /**
   * Draws the legend for the donut chart.
   * @private
   */
  private drawLegend() {
    const legend = this.shadow?.querySelector('.donut-legend');

    if (!legend) return;
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
  private darkenColor(hex: string, intensity: number = 30): string {
    // Accepts #RRGGBB or #RGB
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    let r = parseInt(c.substring(0, 2), 16) - intensity;
    let g = parseInt(c.substring(2, 4), 16) - intensity;
    let b = parseInt(c.substring(4, 6), 16) - intensity;
    r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

// Register the custom element
customElements.define('donut-chart', DonutChart);
