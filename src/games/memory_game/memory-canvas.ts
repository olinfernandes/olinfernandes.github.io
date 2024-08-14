type CanvasConfig = {
  element: HTMLCanvasElement;
  position: DOMRect;
  ctx: CanvasRenderingContext2D;
  col_ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};

const shuffleSort = () => 0.5 - Math.random();

window.addEventListener("load", () => {
  class Game {
    config: CanvasConfig;
    color_matrix: string[][];
    constructor(config: CanvasConfig) {
      this.config = config;
      this.color_matrix = this.random_colors_matrix;
      this.drawCollisionGrid(this.color_matrix);
    }

    update() {}

    draw() {
      const { ctx, width, height } = this.config;
      ctx.clearRect(0, 0, width, height);
    }

    render() {
      this.update();
      this.draw();
    }

    private drawCollisionGrid(color_matrix: string[][]) {
      const { col_ctx, width, height } = this.config;
      col_ctx.clearRect(0, 0, width, height);
      const gridCell = {
        width: width / color_matrix[0].length,
        height: height / color_matrix.length,
        border_size: 4,
      };
      col_ctx.fillStyle = "white";
      color_matrix.forEach((colums, row_index) => {
        colums.forEach((column, col_index) => {
          col_ctx.save();
          col_ctx.fillStyle = `${column}`;
          col_ctx.fillRect(
            col_index * (gridCell.width + gridCell.border_size),
            row_index * (gridCell.height + gridCell.border_size),
            gridCell.width,
            gridCell.height
          );
          col_ctx.restore();
        });
      });
    }

    private get random_colors_matrix() {
      const _colors_ = [
        "#FF0000",
        "#008000",
        "#800080",
        "#000000",
        "#0000FF",
        "#FFFF00",
      ].sort(shuffleSort);
      const duplicatedColorArray = _colors_.concat(_colors_);
      let index = 0;
      const colorMatrix: string[][] = [];
      for (let i = 0; i < 3; i++) {
        const gridRow = [];
        for (let j = 0; j < 4; j++) {
          gridRow.push(duplicatedColorArray[index]);
          index++;
        }
        colorMatrix.push(gridRow);
      }
      return colorMatrix;
    }
  }

  class InputHandler {
    config: CanvasConfig;
    constructor(config: CanvasConfig) {
      this.config = config;
      window.addEventListener("click", this.handleClick.bind(this));
    }

    handleClick = (e: MouseEvent) => {
      const { position, ctx } = this.config;
      const detectedColor = ctx.getImageData(
        e.clientX - position.left,
        e.clientY - position.top,
        1,
        1
      );
      console.log({
        coordinate: {
          x: e.clientX - position.left,
          y: e.clientY - position.top,
        },
        detectedColor,
      });
    };
  }

  class SignalElement extends HTMLElement {
    subscriber: Function | null = null;
    signal(value?: any) {
      const subscribers = new Set<Function>();
      const { subscriber } = this;
      return {
        get value() {
          if (subscriber) {
            subscribers.add(subscriber);
          }
          return value;
        },
        set value(updated) {
          value = updated;
          subscribers.forEach(fn => fn());
        },
      };
    }
    effect(fn: Function) {
      this.subscriber = fn;
      fn();
      this.subscriber = null;
    }
    derived(fn: Function) {
      const derived = this.signal();
      this.effect(() => {
        derived.value = fn();
      });
      return derived;
    }
  }

  class MemoryCanvasTemplate extends SignalElement {
    get template() {
      const t = document.createElement("template");
      t.innerHTML = `
          <div class='wrapper'>
            <canvas id='memory-canvas'></canvas>
            <canvas id='collision-canvas'></canvas>
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
          position: relative;
        }
        canvas {
          position: absolute;
          aspect-ratio: 16/9;
          border-radius: 0.5rem;
        }
        #collision-canvas {
          opacity: 1;
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
        "#memory-canvas"
      ) as HTMLCanvasElement;
      const collision_canvas = this.shadowRoot?.querySelector(
        "#collision-canvas"
      ) as HTMLCanvasElement;

      this.config = {
        element: canvas,
        position: canvas.getBoundingClientRect(),
        ctx: canvas.getContext("2d") as CanvasRenderingContext2D,
        col_ctx: collision_canvas.getContext("2d") as CanvasRenderingContext2D,
        width:
          (canvas.width = collision_canvas.width = window.innerWidth - 16 * 2),
        height:
          (canvas.height = collision_canvas.height =
            window.innerHeight - 16 * 8),
      };
    }

    connectedCallback() {
      const { ctx, width, height } = this.config;
      const game = new Game(this.config);
      new InputHandler(this.config);

      const loop = () => {
        ctx.clearRect(0, 0, width, height);
        game.render();
        requestAnimationFrame(loop);
      };
      loop();
    }

    disconnectedCallback() {}
  }

  window.customElements.define("memory-canvas", MemoryCanvas);
});
