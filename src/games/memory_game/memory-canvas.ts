type CanvasConfig = {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

window.addEventListener("load", () => {
  class Game {
    constructor() { }

    update() { }

    draw() { }

    start() {
      this.update();
      this.draw();
    }
  }

  class MemoryCanvasTemplate extends HTMLElement {
    get template() {
      const t = document.createElement("template");
      t.innerHTML = `
          <div class='wrapper'>
            <canvas id='memory-canvas'></canvas>
          </div>
      `;
      return t;
    }
    get styles() {
      const s = new CSSStyleSheet();
      s.replaceSync(`
        .wrapper {
          display: grid;
          height: calc(100dvh - 8rem);
        }
        canvas {
          background: black;
          border-radius: 0.5rem;
        }
      `);
      return s;
    }
  }

  class MemoryCanvas extends MemoryCanvasTemplate {
    config: CanvasConfig;

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot?.appendChild(super.template.content.cloneNode(true));
      this.shadowRoot?.adoptedStyleSheets.push(super.styles);
      const canvas = this.shadowRoot?.querySelector(
        "#memory-canvas",
      ) as HTMLCanvasElement;

      this.config = {
        element: canvas,
        ctx: canvas.getContext("2d") as CanvasRenderingContext2D,
        width: canvas.width = window.innerWidth - 16 * 2,
        height: canvas.height = window.innerHeight - 16 * 8,
      }

      this.drawGrid();
    }

    connectedCallback() { }

    disconnectedCallback() { }

    loop() {
      const { ctx, width, height } = this.config
      ctx.clearRect(0, 0, width, height);
      requestAnimationFrame(this.loop);
    }

    private drawGrid() {
      const { ctx, width, height } = this.config;
      const canvasGrid = [
        ['red', 'red', 'red'],
        ['green', 'green', 'green'],
        ['blue', 'blue', 'blue']
      ];
      const columns = 1 / canvasGrid[0].length;
      const rows = 1 / canvasGrid.length;
      const gridCell = {
        width: width * columns,
        height: height * rows,
        border_size: 4,
      }
      ctx.fillStyle = 'white';
      canvasGrid.forEach((colums, row_index) => {
        colums.forEach((column, col_index) => {
          ctx.save()
          ctx.fillStyle = `${column}`
          ctx.fillRect(
            col_index * (gridCell.width + gridCell.border_size),
            row_index * (gridCell.height + gridCell.border_size),
            gridCell.width,
            gridCell.height
          );
          ctx.restore();
        })
      })
    }
  }

  window.customElements.define("memory-canvas", MemoryCanvas);
});
