import shadowDog from "./character/shadow_dog.png";

type CanvasPropTypes = {
  ctx: CanvasRenderingContext2D | null;
  playerImage: HTMLImageElement;
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  SPRITE_WIDTH: number;
  SPRITE_HEIGHT: number;
  SPRITE_ANIMATIONS: Map<string, AnimationPropType>;
  activeAnimation: { value: string };
  gameFrame: number;
  staggerFrames: number;
};

type AnimationPropType = {
  loc: {
    x: number;
    y: number;
  }[];
};

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

class HeroCanvasTemplate extends SignalElement {
  get template() {
    let t = document.createElement("template");
    t.innerHTML = `
  <canvas id="primary-canvas"></canvas>
  <div class='button-wrapper'>
    <button id="cycle-anim">
      Cycle
    </button>
    <select id="select-anim" />
  </div>
  `;
    return t;
  }
  get styles() {
    let s = new CSSStyleSheet();
    s.replaceSync(
      `
    .button-wrapper{
      display: grid;
      place-content: center;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding: 0.5rem 1rem;
    }
    `
    );
    return s;
  }
}

class HeroCanvas extends HeroCanvasTemplate {
  props: CanvasPropTypes = {
    ctx: null,
    playerImage: new Image(),
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 600,
    SPRITE_WIDTH: 575,
    SPRITE_HEIGHT: 523,
    SPRITE_ANIMATIONS: new Map<string, AnimationPropType>(),
    activeAnimation: this.signal(this.animationSets[0].name),
    gameFrame: 0,
    staggerFrames: 5,
  };
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    let shadowDOM = this.shadowRoot;
    shadowDOM?.adoptedStyleSheets.push(this.styles);
    shadowDOM?.appendChild(this.template.content.cloneNode(true));
    this.props.playerImage.src = shadowDog.src;

    Object.assign(this.style, {
      display: "grid",
      placeSelf: "center",
      placeContent: "center",
      border: "0.25rem solid #f139dd",
      maxWidth: "800px",
      marginTop: "2rem",
      zIndex: "1024",
      position: "relative",
    });
  }

  connectedCallback() {
    let instance = this;
    let canvas = instance.shadowRoot?.querySelector(
      "#primary-canvas"
    ) as HTMLCanvasElement | null;
    if (canvas) {
      instance.props.CANVAS_WIDTH = canvas.width = 600;
      instance.props.CANVAS_HEIGHT = canvas.height = 600;
      instance.props.ctx = canvas.getContext("2d");
      instance.animateCanvas(instance);
    }

    let cycleAnimBtn = instance.shadowRoot?.querySelector("#cycle-anim");
    cycleAnimBtn?.addEventListener("click", () =>
      instance.cycleAnimations(instance)
    );

    let selectAnimBtn = instance.shadowRoot?.querySelector(
      "#select-anim"
    ) as HTMLSelectElement;
    let animationSets = instance.animationSets;
    animationSets.forEach((state, index) => {
      let frames = {
        loc: [] as { x: number; y: number }[],
      };
      for (let j = 0; j < state.frames; j++) {
        let positionX = j * instance.props.SPRITE_WIDTH;
        let positionY = index * instance.props.SPRITE_HEIGHT;
        frames.loc.push({ x: positionX, y: positionY });
      }
      instance.props.SPRITE_ANIMATIONS.set(state.name, frames);
      let option = document.createElement("option");
      option.setAttribute("value", state.name);
      option.innerText = state.name;
      selectAnimBtn?.appendChild(option);
    });
    selectAnimBtn.addEventListener("change", e => {
      const selected = (e.target as HTMLSelectElement).value;
      instance.selectAnimation(instance, selected);
    });

    instance.effect(() => {
      selectAnimBtn.selectedIndex = instance.animationSets.findIndex(
        ({ name }) => name === instance.props.activeAnimation.value
      );
    });
  }

  disconnectedCallback() {
    let instance = this;
    let cycleAnimBtn = instance.shadowRoot?.querySelector("#cycle-anim");
    cycleAnimBtn?.removeEventListener("click", () =>
      instance.cycleAnimations(instance)
    );
  }

  animateCanvas(instance: HeroCanvas) {
    instance.props.ctx?.clearRect(
      0,
      0,
      instance.props.CANVAS_WIDTH,
      instance.props.CANVAS_HEIGHT
    );

    let position =
      Math.floor(instance.props.gameFrame / instance.props.staggerFrames) %
      instance.totalAnimationFrames;
    let frameX = instance.props.SPRITE_WIDTH * position;
    let frameY =
      instance.props.SPRITE_ANIMATIONS.get(instance.props.activeAnimation.value)
        ?.loc[position].y || 0;

    instance.props.ctx?.drawImage(
      instance.props.playerImage,
      frameX,
      frameY,
      instance.props.SPRITE_WIDTH,
      instance.props.SPRITE_HEIGHT,
      0,
      0,
      instance.props.SPRITE_WIDTH,
      instance.props.SPRITE_HEIGHT
    );

    instance.props.gameFrame++;
    requestAnimationFrame(() => instance.animateCanvas(instance));
  }

  cycleAnimations(instance: HeroCanvas) {
    let currentAnimationIndex = instance.animationSets.findIndex(
      ({ name }) => name === instance.props.activeAnimation.value
    );
    let nextAnimation: string;
    if (currentAnimationIndex === 9) {
      nextAnimation = instance.animationSets[0].name;
    } else {
      nextAnimation = instance.animationSets[currentAnimationIndex + 1].name;
    }
    instance.props.activeAnimation.value = nextAnimation;
  }

  selectAnimation(instance: HeroCanvas, target?: string) {
    if (!target) {
      instance.props.activeAnimation.value = instance.animationSets[0].name;
      return;
    }

    let validAnimationName = instance.animationSets.find(
      ({ name }) => name === target
    );
    if (validAnimationName) {
      instance.props.activeAnimation.value = validAnimationName.name;
    } else {
      instance.props.activeAnimation.value = instance.animationSets[0].name;
    }
  }

  get totalAnimationFrames() {
    let currentAnimation = this.props.activeAnimation.value;
    let frames = this.props.SPRITE_ANIMATIONS.get(currentAnimation);
    return frames?.loc.length || 6;
  }

  get animationSets() {
    return [
      { name: "idle", frames: 7 },
      { name: "jump", frames: 7 },
      { name: "fall", frames: 7 },
      { name: "run", frames: 9 },
      { name: "dizzy", frames: 11 },
      { name: "sit", frames: 5 },
      { name: "roll", frames: 7 },
      { name: "bite", frames: 7 },
      { name: "ko", frames: 12 },
      { name: "gethit", frames: 4 },
    ];
  }
}
window.addEventListener("load", () => {
  window.customElements.define("hero-canvas", HeroCanvas);
});
