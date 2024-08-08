import enemy1Png from "./enemies/enemy1.png";
import enemy2Png from "./enemies/enemy2.png";
import enemy3Png from "./enemies/enemy3.png";
import enemy4Png from "./enemies/enemy4.png";

const getRandomItem = (list: any[]): any => {
  return list[Math.floor(Math.random() * list.length)];
};

const enemyType1 = new Image();
enemyType1.src = enemy1Png.src;
enemyType1.height = 157;
enemyType1.width = 293;
enemyType1.dataset.frames = "6";

const enemyType2 = new Image();
enemyType2.src = enemy2Png.src;
enemyType2.height = 188;
enemyType2.width = 267;
enemyType2.dataset.frames = "6";

const enemyType3 = new Image();
enemyType3.src = enemy3Png.src;
enemyType3.height = 183;
enemyType3.width = 218;
enemyType3.dataset.frames = "6";

const enemyType4 = new Image();
enemyType4.src = enemy4Png.src;
enemyType4.height = 207;
enemyType4.width = 212;
enemyType4.dataset.frames = "9";

const enemyTypes = [enemyType1, enemyType2, enemyType3, enemyType4];

type TEnemy = {
  x: number;
  y: number;
  canvas_width: number;
  canvas_height: number;
  width: number;
  height: number;
  sprite_width: number;
  sprite_height: number;
  frames: number;
  frame: number;
  type: HTMLImageElement;
  flap_speed: number;
  angle: number;
  angle_speed: number;
};

class Enemy implements TEnemy {
  x: number;
  y: number;
  canvas_width: number;
  canvas_height: number;
  width: number;
  height: number;
  sprite_width: number;
  sprite_height: number;
  frames: number;
  frame: number;
  type: HTMLImageElement;
  flap_speed: number;
  angle: number;
  angle_speed: number;
  direction_x: number = 1;

  constructor(
    type: HTMLImageElement,
    canvas_width: number,
    canvas_height: number
  ) {
    this.sprite_width = type.width;
    this.sprite_height = type.height;
    this.canvas_width = canvas_width;
    this.canvas_height = canvas_height;
    this.width = this.sprite_width * 0.25;
    this.height = this.sprite_height * 0.25;
    this.x = Math.random() * (canvas_width - this.width);
    this.y = Math.random() * (canvas_height - this.height);
    this.frames = +(type.dataset.frames || "6");
    this.frame = 0;
    this.type = type;
    this.flap_speed = Math.floor(Math.random() * 0.25 + 5.5);
    this.angle = 0;
    this.angle_speed = Math.random() * 0.15 + 0.15;
  }
  update(game_frame: number) {
    let prevX = this.x;
    // animation motion
    this.x =
      this.canvas_width * 0.5 * Math.sin((this.angle * Math.PI) / 90) +
      (this.canvas_width - this.width) * 0.5;
    this.y =
      this.canvas_height * 0.25 * Math.cos((this.angle * Math.PI) / 360) +
      (this.canvas_height - this.height) * 0.5;
    this.angle += this.angle_speed;

    // animation speed
    if (game_frame % this.flap_speed === 0) {
      this.frame == this.frames - 1 ? (this.frame = 0) : this.frame++;
    }

    // animation direction
    if (prevX > this.x) {
      // to the left
      this.direction_x = 1;
    } else if (prevX < this.x) {
      // to the right
      this.direction_x = -1;
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.translate(this.x, 0);
    ctx.scale(this.direction_x, 1);
    ctx.drawImage(
      this.type,
      this.frame * this.sprite_width,
      0,
      this.sprite_width,
      this.sprite_height,
      0,
      0,
      this.width,
      this.height
    );
    ctx.restore();
  }
  start(ctx: CanvasRenderingContext2D, game_frame: number) {
    this.update(game_frame);
    this.draw(ctx);
  }
}

class SignalElement extends HTMLElement {
  subscriber: Function | null = null;

  signal(value?: any) {
    const subscriptions = new Set<Function>();
    let instance = this;
    return {
      get value() {
        if (instance.subscriber) {
          subscriptions.add(instance.subscriber);
        }
        return value;
      },
      set value(updated) {
        value = updated;
        subscriptions.forEach(fn => fn());
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

class EnemyCanvasTemplate extends SignalElement {
  get template() {
    let t = document.createElement("template");
    t.innerHTML = `
      <div class="enemy-canvas-wrapper">
        <div class="canvas-container">
          <canvas id="enemy-canvas"></canvas>
        </div>
      </div>
    `;
    return t;
  }
  get styles() {
    let s = new CSSStyleSheet();
    s.replaceSync(
      `
      .enemy-canvas-wrapper {
        background: grey;
      }
      .canvas-container {
        border: 2px solid black;
        position: absolute;
        width: 500px;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
      }
      #enemy-canvas {
        position: relative;
        aspect-ratio: 4/16;
      }
      `
    );
    return s;
  }
}

type EnemyCanvasProps = {
  ctx: CanvasRenderingContext2D | null;
  position: DOMRect | null;
  width: number;
  height: number;
  number_of_enemies: number;
  enemy_types: HTMLImageElement[];
  enemy_objects: Enemy[];
  game_frame: number;
};

class EnemyCanvas extends EnemyCanvasTemplate {
  canvas: EnemyCanvasProps = {
    ctx: null,
    position: null,
    width: 500,
    height: 700,
    number_of_enemies: 5,
    enemy_types: enemyTypes,
    enemy_objects: [],
    game_frame: 0,
  };
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.adoptedStyleSheets.push(this.styles);
    this.shadowRoot?.appendChild(this.template.content.cloneNode(true));

    let canvas = this.shadowRoot?.querySelector(
      "#enemy-canvas"
    ) as HTMLCanvasElement;

    this.canvas.ctx = canvas.getContext("2d");
    this.canvas.position = canvas.getBoundingClientRect();
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
  }

  connectedCallback() {
    let instance = this;
    for (let i = 0; i < instance.canvas.number_of_enemies; i++) {
      if (instance.canvas.game_frame % 30 === 0) {
        instance.canvas.enemy_objects = [
          ...instance.canvas.enemy_objects,
          new Enemy(
            getRandomItem(instance.canvas.enemy_types),
            instance.canvas.width,
            instance.canvas.height
          ),
        ];
      }
    }
    instance.loop(instance);
  }

  disconnectedCallback() {}

  loop(instance: EnemyCanvas) {
    if (instance.canvas.ctx) {
      instance.canvas.ctx.clearRect(
        0,
        0,
        instance.canvas.width,
        instance.canvas.height
      );
      instance.canvas.enemy_objects.forEach(object => {
        if (instance.canvas.ctx) {
          object.start(instance.canvas.ctx, instance.canvas.game_frame);
        }
      });
    }
    instance.canvas.game_frame++;
    requestAnimationFrame(() => instance.loop(instance));
  }
}

window.customElements.define("enemy-canvas", EnemyCanvas);
