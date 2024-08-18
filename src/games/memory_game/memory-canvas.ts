type CanvasConfig = {
  element: HTMLCanvasElement;
  position: DOMRect;
  ctx: CanvasRenderingContext2D;
  col_ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  matched: { value: Set<string> };
  selected: {
    coordinate: { value: { row: number; col: number } | null };
    color: { value: string | null };
  };
};

const shuffleSort = () => 0.5 - Math.random();

const rgbToHex = (rgb: string): string => {
  const rgbValues = rgb.match(/\d+/g);
  if (!rgbValues || rgbValues.length < 3) return "";
  const hex = rgbValues.slice(0, 3).map(v => {
    return parseInt(v).toString(16).padEnd(2, "0");
  });
  return `#${hex.join("")}`.toUpperCase();
};

const random_colors = () => {
  const color_set = new Set<string>();
  const gen_ran_col = () => Math.floor(Math.random() * 255);

  while (Array.from(color_set).length < 6) {
    const color = rgbToHex(
      `rgb(${gen_ran_col()}, ${gen_ran_col()}, ${gen_ran_col()})`
    );
    color_set.add(color);
  }

  return Array.from(color_set);
};

class Game {
  config: CanvasConfig;
  color_matrix: string[][];
  constructor(config: CanvasConfig) {
    this.config = config;
    this.color_matrix = this.random_colors_matrix;
  }

  update(d_time: number) {}

  draw() {
    const {
      config: { ctx, width, height },
    } = this;
    ctx.clearRect(0, 0, width, height);
    this.drawCollisionGrid(this.color_matrix);
  }

  render(d_time: number) {
    this.update(d_time);
    this.draw();
  }

  private drawCollisionGrid = (color_matrix: string[][]) => {
    const columns = 4;
    const rows = 3;
    const {
      config: { col_ctx, width, height, matched },
    } = this;
    col_ctx.clearRect(0, 0, width, height);
    const gridCell = {
      width: width / columns,
      height: height / rows,
      border_size: 4,
    };
    col_ctx.fillStyle = "#FFFFFF";
    color_matrix.forEach((colums, row_index) => {
      colums.forEach((column, col_index) => {
        col_ctx.save();
        col_ctx.fillStyle = matched.value.has(column) ? "#FFFFFF" : `${column}`;
        col_ctx.fillRect(
          col_index * (gridCell.width + gridCell.border_size),
          row_index * (gridCell.height + gridCell.border_size),
          gridCell.width,
          gridCell.height
        );
        col_ctx.restore();
      });
    });
  };

  private get random_colors_matrix() {
    const rows = 3;
    const columns = 4;
    const _colors_ = random_colors().sort(shuffleSort);
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
  game: Game;
  constructor(game: Game) {
    this.game = game;
    window.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick = (e: MouseEvent) => {
    const {
      game: {
        config: { position, col_ctx, width, height, selected, matched },
      },
    } = this;
    const x = e.clientX - position.left;
    const y = e.clientY - position.top;
    const rows = 3;
    const columns = 4;
    const coordinate = {
      col: Math.floor((x * columns) / width),
      row: Math.floor((y * rows) / height),
    };
    if (
      coordinate.row >= 0 &&
      coordinate.row < rows &&
      coordinate.col >= 0 &&
      coordinate.col < columns
    ) {
      const detectedColor = col_ctx.getImageData(x, y, 1, 1).data;
      const detectedColorRgb = `rgb${detectedColor.join(", ")}`;
      const detectedColorHex = rgbToHex(detectedColorRgb);

      const resetSelected = () => {
        selected.color.value = null;
        selected.coordinate.value = null;
      };

      if (!selected.color.value) {
        selected.color.value = detectedColorHex;
        selected.coordinate.value = coordinate;
      } else if (
        selected.color.value === detectedColorHex &&
        selected.coordinate.value
      ) {
        if (
          coordinate.col === selected.coordinate.value.col &&
          coordinate.row === selected.coordinate.value.row
        ) {
          // clicked on same coordinate
          resetSelected();
          return;
        } else if (
          coordinate.col !== selected.coordinate.value.col ||
          coordinate.row !== selected.coordinate.value.row
        ) {
          // matched
          matched.value.add(selected.color.value);
          resetSelected();
        } else {
          // catch all
          resetSelected();
        }
      } else {
        // catch all
        resetSelected();
      }
    } else {
      // clicked out of bounds
    }
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
    this.shadowRoot!.appendChild(super.template.content.cloneNode(true));
    this.shadowRoot!.adoptedStyleSheets.push(super.styles);
    const canvas = this.shadowRoot!.querySelector(
      "#memory-canvas"
    ) as HTMLCanvasElement;
    const collision_canvas = this.shadowRoot!.querySelector(
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
        (canvas.height = collision_canvas.height = window.innerHeight - 16 * 8),
      matched: super.signal(new Set()),
      selected: {
        coordinate: super.signal(null),
        color: super.signal(null),
      },
    };
  }

  connectedCallback() {
    const game = new Game(this.config);
    new InputHandler(game);

    let prevTimestamp = 0;
    const loop = (timestamp: number) => {
      const d_time = timestamp - prevTimestamp;
      prevTimestamp = timestamp;
      game.render(d_time);
      requestAnimationFrame(loop);
    };
    loop(prevTimestamp);
  }

  disconnectedCallback() {}
}

window.addEventListener("load", () => {
  window.customElements.define("memory-canvas", MemoryCanvas);
});
