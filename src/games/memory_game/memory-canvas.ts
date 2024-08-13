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

  class Enemy {
    game: Game
    constructor(game: Game) {
      this.game = game;
    }

    update() { }
    draw() { }
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
      `);
      return s;
    }
  }

  class MemoryCanvas extends MemoryCanvasTemplate {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot?.appendChild(super.template.content.cloneNode(true));
      this.shadowRoot?.adoptedStyleSheets.push(super.styles);
      const canvas = this.shadowRoot?.querySelector(
        "#memory-canvas",
      ) as HTMLCanvasElement;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      canvas.width = window.innerWidth - 16 * 2;
      canvas.height = window.innerHeight - 16 * 8;
    }

    connectedCallback() { }
    disconnectedCallback() { }
    loop() { }
  }

  window.customElements.define("memory-canvas", MemoryCanvas);
});
