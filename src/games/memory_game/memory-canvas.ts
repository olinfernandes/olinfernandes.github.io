type CanvasConfig = {
  element: HTMLCanvasElement;
  position: DOMRect;
  ctx: CanvasRenderingContext2D;
  col_ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  locked: { value: boolean };
  matched: { value: Set<string> };
  flipped: { value: Set<string> };
  flipping: { value: Map<string, number> };
  selected: {
    coordinate: { value: { row: number; col: number } | null };
    color: { value: string | null };
  };
};

const tileKey = (row: number, col: number) => `${row}-${col}`;
const shuffleSort = () => 0.5 - Math.random();

const rgbToHex = (rgb: string): string => {
  const rgbValues = rgb.match(/\d+/g);
  if (!rgbValues || rgbValues.length < 3) return "";
  const hex = rgbValues.slice(0, 3).map(v => {
    return parseInt(v).toString(16).padStart(2, "0");
  });
  return `#${hex.join("")}`.toUpperCase();
};

const random_colors = () => {
  const color_set = new Set<string>();
  const gen_ran_col = () => Math.floor(Math.random() * 255);

  while (color_set.size < 6) {
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

  update(d_time: number) {
    const flipSpeed = 0.01 * d_time;
    const newFlipping = new Map(this.config.flipping.value);
    let updated = false;

    for (const [key, progress] of newFlipping.entries()) {
      const newProgress = Math.min(progress + flipSpeed, 1);
      newFlipping.set(key, newProgress);
      if (newProgress < 1) updated = true;
    }

    this.config.flipping.value = newFlipping;
  }

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
      config: { col_ctx, width, height, matched, flipped },
    } = this;
    col_ctx.clearRect(0, 0, width, height);
    const gridCell = {
      width: width / columns,
      height: height / rows,
      border_size: 4,
    };
    col_ctx.fillStyle = "#FFFFFF";
    color_matrix.forEach((row, row_index) => {
      row.forEach((color, col_index) => {
        const key = tileKey(row_index, col_index);
        const isFlipped = flipped.value.has(key);
        const isMatched = matched.value.has(color);
        const flipProgress =
          this.config.flipping.value.get(key) ?? (isFlipped ? 1 : 0);

        col_ctx.save();

        const centerX =
          col_index * (gridCell.width + gridCell.border_size) +
          gridCell.width / 2;
        const centerY =
          row_index * (gridCell.height + gridCell.border_size) +
          gridCell.height / 2;

        col_ctx.translate(centerX, centerY);
        const scaleX = Math.abs(Math.cos(flipProgress * Math.PI)); // 1 to 0 to 1
        col_ctx.scale(scaleX, 1);
        col_ctx.translate(-centerX, -centerY);

        col_ctx.fillStyle = isMatched
          ? "#FFFFFF"
          : flipProgress > 0.5
          ? color
          : "#CCCCCC";

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

  get random_colors_matrix() {
    const rows = 3;
    const columns = 4;
    const duplicatedColorArray = random_colors()
      .flatMap(c => [c, c])
      .sort(shuffleSort);
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
  }

  connectedCallback() {
    window.addEventListener("click", this.handleClick.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener("click", this.handleClick.bind(this));
  }

  handleClick = (e: MouseEvent) => {
    const {
      game: {
        config: {
          position,
          width,
          height,
          selected,
          matched,
          flipped,
          flipping,
          locked,
        },
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
    const key = tileKey(coordinate.row, coordinate.col);

    if (locked.value) return;

    if (
      coordinate.row >= 0 &&
      coordinate.row < rows &&
      coordinate.col >= 0 &&
      coordinate.col < columns
    ) {
      const detectedColorHex =
        this.game.color_matrix[coordinate.row][coordinate.col];

      if (matched.value.has(detectedColorHex) || flipped.value.has(key)) return;

      // Flip current tile
      flipped.value.add(key);
      flipping.value.set(key, 0);

      if (!selected.color.value) {
        selected.color.value = detectedColorHex;
        selected.coordinate.value = coordinate;
      } else {
        const prevKey = tileKey(
          selected.coordinate.value!.row,
          selected.coordinate.value!.col
        );
        if (selected.color.value === detectedColorHex) {
          matched.value.add(detectedColorHex);
        } else {
          locked.value = true;
          setTimeout(() => {
            flipped.value.delete(key);
            flipped.value.delete(prevKey);
            flipping.value.delete(key);
            flipping.value.delete(prevKey);
            locked.value = false;
          }, 800);
        }
        // Reset selection
        selected.color.value = null;
        selected.coordinate.value = null;
      }
    } else {
      // clicked out of bounds
    }
  };
}

class SignalElement extends HTMLElement {
  subscriber: Function | null = null;
  subscribers = new Set<Function>();
  signal(value?: any) {
    const { subscriber, subscribers } = this;
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

    canvas.addEventListener("game-won", () => {
      alert(`🎉 You've won the game`);
      setTimeout(() => this.resetGame(), 1e3)
    });

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
      locked: super.signal(false),
      matched: super.signal(new Set()),
      flipped: super.signal(new Set()),
      flipping: super.signal(new Map()),
      selected: {
        coordinate: super.signal(null),
        color: super.signal(null),
      },
    };
  }

  connectedCallback() {
    const game = new Game(this.config);
    const inputHandler = new InputHandler(game);
    inputHandler.connectedCallback();

    let prevTimestamp = 0;
    const loop = (timestamp: number) => {
      const d_time = timestamp - prevTimestamp;
      prevTimestamp = timestamp;
      game.render(d_time);
      requestAnimationFrame(loop);
    };
    loop(prevTimestamp);

    super.effect(() => {
      if (this.config.matched.value.size === 6) {
        this.dispatchEvent(new CustomEvent("game-won"));
      }
    });
  }

  disconnectedCallback() {}

  resetGame() {
    const game = new Game(this.config);
    const newMatrix = game.random_colors_matrix;
    this.config.matched.value = new Set();
    this.config.flipped.value = new Set();
    this.config.flipping.value = new Map();
    this.config.selected.coordinate.value = null;
    this.config.selected.color.value = null;
    game.color_matrix = newMatrix;
  }
}

window.addEventListener("load", () => {
  window.customElements.define("memory-canvas", MemoryCanvas);
});
