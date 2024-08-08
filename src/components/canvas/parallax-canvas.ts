import bgLayer1 from "./backgrounds/city_background/layer-1.png";
import bgLayer2 from "./backgrounds/city_background/layer-2.png";
import bgLayer3 from "./backgrounds/city_background/layer-3.png";
import bgLayer4 from "./backgrounds/city_background/layer-4.png";
import bgLayer5 from "./backgrounds/city_background/layer-5.png";

let backgroundLayer1 = new Image();
backgroundLayer1.src = bgLayer1.src;
let backgroundLayer2 = new Image();
backgroundLayer2.src = bgLayer2.src;
let backgroundLayer3 = new Image();
backgroundLayer3.src = bgLayer3.src;
let backgroundLayer4 = new Image();
backgroundLayer4.src = bgLayer4.src;
let backgroundLayer5 = new Image();
backgroundLayer5.src = bgLayer5.src;

type TBackgroundLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  speedModifier: number;
  speed: number;
};

class BackgroundLayer implements TBackgroundLayer {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  speedModifier: number;
  speed: number;

  constructor(
    image: HTMLImageElement,
    speedModifier: number,
    gameSpeed: number = 5
  ) {
    this.x = 0;
    this.y = 0;
    this.width = 2400;
    this.height = 700;
    this.image = image;
    this.speedModifier = speedModifier;
    this.speed = gameSpeed * this.speedModifier;
  }
  update(gameFrame: number, gameSpeed: number) {
    this.speed = gameSpeed * this.speedModifier;
    this.x = (gameFrame * this.speed) % this.width;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.x + this.width,
      this.y,
      this.width,
      this.height
    );
  }
  start(ctx: CanvasRenderingContext2D, gameFrame: number, gameSpeed: number) {
    this.update(gameFrame, gameSpeed);
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

class ParallaxCanvasTempate extends SignalElement {
  get template() {
    const t = document.createElement('template');
    t.innerHTML = `
    <div class="bg-wrapper">
      <div class="bg-wrapper__container">
        <p>Game Speed: <span id="show_game_speed"></span></p>
        <input type="range" min="0" max="20" value="5" class="slider" id="slider" />
        <canvas id="parallax-canvas"></canvas>
      </div>
    </div>
    `;
    return t;
  }
  get styles() {
    const s = new CSSStyleSheet();
    s.replaceSync(
      `
      .bg-wrapper {
        background: black;
      }
      .bg-wrapper__container {
        position: absolute;
        width: 800px;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        font-size: 25px;
      }
      #parallax-canvas {
        position: relative;
        aspect-ratio: 4/16;
      }
      #slider {
        width: 100%;
      }
      p {
        color: white;
      }
      `
    );
    return s;
  }
}

type ParallaxCanvasProps = {
  ctx: CanvasRenderingContext2D | null;
  background_layers: BackgroundLayer[];
  width: number;
  height: number;
  game_speed: { value: number };
  game_frame: number;
  stagger_frame: number;
};

class ParallaxCanvas extends ParallaxCanvasTempate {
  canvas: ParallaxCanvasProps = {
    ctx: null,
    background_layers: [],
    width: 800,
    height: 700,
    game_speed: this.signal(5),
    game_frame: 0,
    stagger_frame: 5,
  };
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot?.adoptedStyleSheets.push(this.styles);
    this.shadowRoot?.appendChild(this.template.content.cloneNode(true));

    const layer1 = new BackgroundLayer(
      backgroundLayer1,
      0.2,
      this.canvas.game_speed.value
    );
    const layer2 = new BackgroundLayer(
      backgroundLayer2,
      0.4,
      this.canvas.game_speed.value
    );
    const layer3 = new BackgroundLayer(
      backgroundLayer3,
      0.6,
      this.canvas.game_speed.value
    );
    const layer4 = new BackgroundLayer(
      backgroundLayer4,
      0.8,
      this.canvas.game_speed.value
    );
    const layer5 = new BackgroundLayer(
      backgroundLayer5,
      1,
      this.canvas.game_speed.value
    );

    this.canvas.background_layers = [layer1, layer2, layer3, layer4, layer5];
  }

  connectedCallback() {
    let instance = this;
    let canvas = instance.shadowRoot?.querySelector(
      "#parallax-canvas"
    ) as HTMLCanvasElement;
    let slider = instance.shadowRoot?.querySelector(
      "#slider"
    ) as HTMLSelectElement;
    let showSpeed = instance.shadowRoot?.querySelector(
      "#show_game_speed"
    ) as HTMLSpanElement;

    instance.canvas.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    canvas.width = instance.canvas.width;
    canvas.height = instance.canvas.height;

    instance.effect(() => {
      slider.value = instance.canvas.game_speed.value.toString();
      showSpeed.innerText = instance.canvas.game_speed.value.toString();
    });

    slider.addEventListener("change", e => {
      instance.canvas.game_speed.value = +(e.target as HTMLSelectElement).value;
    });

    instance.loop(instance);
  }

  disconnectedCallback() {
    let instance = this;
    let slider = instance.shadowRoot?.querySelector('#slider') as HTMLSelectElement;
    slider.removeEventListener('change', e => {
      instance.canvas.game_speed.value = +(e.target as HTMLSelectElement).value;
    })
  }

  loop(instance: ParallaxCanvas) {
    if(instance.canvas.ctx){
      instance.canvas.ctx.clearRect(
        0,
        0,
        instance.canvas.width,
        instance.canvas.height
      );
      instance.canvas.background_layers.forEach(layer => {
        if(instance.canvas.ctx){
          layer.start(
            instance.canvas.ctx,
            instance.canvas.game_frame,
            instance.canvas.game_speed.value,
          );
        }
      });
    }
    instance.canvas.game_frame--;
    requestAnimationFrame(() => instance.loop(instance));
  }
}

window.customElements.define('parallax-canvas', ParallaxCanvas);
