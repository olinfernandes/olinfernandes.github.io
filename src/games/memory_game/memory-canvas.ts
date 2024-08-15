type CanvasConfig = {
  element: HTMLCanvasElement;
  position: DOMRect;
  ctx: CanvasRenderingContext2D;
  col_ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  matched: { value: string };
  selected: {
    coordinate: { value: { row: number; col: number } | null };
    color: { value: string | null };
  };
};

const shuffleSort = () => 0.5 - Math.random();

const rgbToHex = (rgb: string): string => {
  const rgbValues = rgb.match(/\d+/g);
  if (!rgbValues || rgbValues.length < 3) return "";
  const hex = rgbValues.splice(0, 3).map(v => {
    return parseInt(v).toString(16).padEnd(2, "0");
  });
  return `#${hex.join("")}`.toUpperCase();
};

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
      const rows = 3;
      const columns = 4;
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
      for (let i = 0; i < rows; i++) {
        const gridRow = [];
        for (let j = 0; j < columns; j++) {
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
      const { position, col_ctx, width, height, selected, matched } = this.config;
      const x = e.clientX - position.left;
      const y = e.clientY - position.top;
      const rows = 3;
      const columns = 4;
      const coordinate = {
        col: Math.floor((x * columns) / width),
        row: Math.floor((y * rows) / height),
      };
      const detectedColor = col_ctx.getImageData(x, y, 1, 1).data;
      const detectedColorRgb = `rgb${detectedColor.join(", ")}`;
      const detectedColorHex = rgbToHex(detectedColorRgb);
      console.log({
        coordinate,
        detectedColorHex,
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
        ctx: canvas.getContext("2d", {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D,
        col_ctx: collision_canvas.getContext("2d", {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D,
        width:
          (canvas.width = collision_canvas.width = window.innerWidth - 16 * 2),
        height:
          (canvas.height = collision_canvas.height =
            window.innerHeight - 16 * 8),
        matched: super.signal(),
        selected: {
          coordinate: super.signal(null),
          color: super.signal(null),
        },
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
