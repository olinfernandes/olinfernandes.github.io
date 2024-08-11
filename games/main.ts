window.addEventListener("load", () => {
  class SignalElement extends HTMLElement {
    subscriber: Function | null = null;
    signal = (value?: any) => {
      let subscriptions = new Set<Function>();
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
          subscriptions.forEach((fn) => fn());
        },
      };
    };
    effect = (fn: Function) => {
      this.subscriber = fn;
      fn();
      this.subscriber = null;
    };
    derived = (fn: Function) => {
      const derived = this.signal();
      this.effect(() => {
        derived.value = fn();
      });
      return derived;
    };
  }
  class GameSelectionTemplate extends SignalElement {
    get template() {
      let t = document.createElement("template");
      t.innerHTML = `<slot />`;
      return t;
    }
    get wrapper() {
      return this.shadowRoot?.querySelector(".game-wrapper");
    }
  }
  class GameSelection extends GameSelectionTemplate {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot?.appendChild(super.template.content.cloneNode(true));

      Object.assign(this.style, {
        display: "grid",
        height: "calc(100dvh - 8rem)",
        width: "calc(100dvw - 2rem)",
      });
    }
    connectedCallback() {}
    disconnectedCallback() {}
  }
  window.customElements.define("game-selection", GameSelection);
});
