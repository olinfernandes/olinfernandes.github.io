import explosionPng from "./effects/boom.png";
import explosionSfx from "./effects/boom.wav";

type TExplosion = {
  x: number;
  y: number;
  sprite_width: number;
  sprite_height: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  audio: HTMLAudioElement;
  frame: number;
  total_frames: number;
  angle: number;
  markedForDelete: boolean;
};

class Explosion implements TExplosion {
  x: number;
  y: number;
  sprite_width: number;
  sprite_height: number;
  width: number;
  height: number;
  image: HTMLImageElement = new Image();
  audio: HTMLAudioElement = new Audio();
  frame: number;
  total_frames: number;
  angle: number;
  markedForDelete: boolean = false;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.sprite_width = 200;
    this.sprite_height = 179;
    this.width = this.sprite_width * 0.5;
    this.height = this.sprite_height * 0.5;
    this.image.src = explosionPng.src;
    this.audio.src = explosionSfx;
    this.frame = 0;
    this.total_frames = 5;
    this.angle = Math.random() * 6.2;
  }

  update(game_frame: number) {
    if (this.frame === 0) this.audio.play();
    if (game_frame % 5 === 0) {
      this.frame++;
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(
      this.image,
      this.frame * this.sprite_width,
      0,
      this.sprite_width,
      this.sprite_height,
      this.width * -0.5,
      this.height * -0.5,
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

class TriggerCanvasTempate extends SignalElement {
  get template() {
    const t = document.createElement("template");
    t.innerHTML = `
    <div class="trigger-canvas-wrapper">
      <div class="canvas-container">
        <canvas id="trigger-canvas"></canvas>
      </div>
    </div>
    `;
    return t;
  }
  get styles() {
    const s = new CSSStyleSheet();
    s.replaceSync(
      `
      .canvas-container {
        background: black;
        position: absolute;
        width: 500px;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
      }
      #trigger-canvas {
        position: relative;
        aspect-ratio: 4/16;
      }
      `
    );
    return s;
  }
}

type TriggerCanvasProps = {
  ctx: CanvasRenderingContext2D | null;
  position: DOMRect | null;
  explosions: Explosion[];
  width: number;
  height: number;
  game_frame: number;
  stagger_frame: number;
};

class TriggerCanvas extends TriggerCanvasTempate {
  canvas: TriggerCanvasProps = {
    ctx: null,
    position: null,
    explosions: [],
    width: 500,
    height: 700,
    game_frame: 0,
    stagger_frame: 5,
  };
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.adoptedStyleSheets.push(this.styles);
    this.shadowRoot?.appendChild(this.template.content.cloneNode(true));

    let canvas = this.shadowRoot?.querySelector(
      "#trigger-canvas"
    ) as HTMLCanvasElement;

    this.canvas.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.canvas.position = canvas.getBoundingClientRect();
    this.canvas.width = canvas.width = 500;
    this.canvas.height = canvas.height = 700;
  }

  connectedCallback() {
    let instance = this;
    let canvasEl = instance.shadowRoot?.querySelector(
      "#trigger-canvas"
    ) as HTMLCanvasElement;
    canvasEl.addEventListener("click", e => instance.addExplosion(instance, e));
    instance.loop(instance);
  }

  loop(instance: TriggerCanvas) {
    if (instance.canvas.ctx) {
      instance.canvas.ctx.clearRect(
        0,
        0,
        instance.canvas.width,
        instance.canvas.height
      );
      instance.canvas.explosions.forEach(explosion => {
        if (instance.canvas.ctx) {
          explosion.start(instance.canvas.ctx, instance.canvas.game_frame);
        }
        if (explosion.frame > explosion.total_frames) {
          explosion.markedForDelete = true;
        }
      });
      instance.canvas.explosions = instance.canvas.explosions.filter(
        ({ markedForDelete }) => !markedForDelete
      );
      instance.canvas.game_frame++;
      requestAnimationFrame(() => instance.loop(instance));
    }
  }

  addExplosion(instance: TriggerCanvas, e: MouseEvent) {
    if (instance && instance.canvas.position) {
      let positionX = e.x - instance.canvas.position.left;
      let positionY = e.y - instance.canvas.position.top * 0.325;
      instance.canvas.explosions = [
        ...instance.canvas.explosions,
        new Explosion(positionX, positionY),
      ];
    }
  }
}

window.customElements.define("trigger-canvas", TriggerCanvas);
