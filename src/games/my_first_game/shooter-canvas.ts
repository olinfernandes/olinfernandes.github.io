import ravenPng from "./assets/raven.png";
import explosionPng from "./assets/boom.png";

import explosionSfx from "./assets/boom.wav";
import game_musicSfx from "./assets/game_music.mp3";
import marsMusicSfx from "./assets/Mars.wav";
import mercuryMusicSfx from "./assets/Mercury.wav";
import venusMusicSfx from "./assets/Venus.wav";

window.addEventListener("load", () => {
  interface CanvasContext {
    ctx: CanvasRenderingContext2D;
  }
  interface CanvasWithCollision extends CanvasContext {
    col_ctx: CanvasRenderingContext2D;
  }

  class Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    radius: number;
    max_radius: number;
    speed_x: number;
    marked_for_deletion: boolean;

    constructor(x: number, y: number, size: number, color: string) {
      this.size = size;
      this.x = x + this.size * 0.5 + Math.random() * 50 - 25;
      this.y = y + this.size * 0.3 + Math.random() * 50 - 25;
      this.color = color;
      this.radius = Math.random() * this.size * 0.1;
      this.max_radius = Math.random() * 20 + 35;
      this.marked_for_deletion = false;
      this.speed_x = Math.random() + 0.5;
    }

    update() {
      this.x += this.speed_x;
      this.radius += 0.3;
      if (this.radius > this.max_radius - 5) this.marked_for_deletion = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = 1 - this.radius / this.max_radius;
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    start({ ctx }: CanvasContext) {
      this.update();
      this.draw(ctx);
    }
  }

  class Explosion {
    x: number;
    y: number;
    sprite_width: number;
    sprite_height: number;
    width: number;
    height: number;
    image: HTMLImageElement;
    audio: HTMLAudioElement;
    last_frame_played_at: number;
    frame_interval: number;
    frame: number;
    frames: number;
    angle: number;
    marked_for_deletion: boolean;
    constructor(x: number, y: number, size: number) {
      this.x = x;
      this.y = y;
      this.width = size;
      this.height = size;
      this.sprite_width = 200;
      this.sprite_height = 179;
      this.last_frame_played_at = 0;
      this.frame_interval = 200;
      this.frame = 0;
      this.frames = 5;
      this.angle = Math.random() * 6.2;
      this.marked_for_deletion = false;
      this.image = new Image();
      this.image.src = explosionPng.src;
      this.audio = new Audio();
      this.audio.src = explosionSfx;
    }

    update(dTime: number) {
      if (this.frame === 0) this.audio.play();
      this.last_frame_played_at += dTime;
      if (this.last_frame_played_at > this.frame_interval) {
        if (this.frame > this.frames) this.marked_for_deletion = true;
        else this.frame++;
        this.last_frame_played_at = 0;
      }
    }

    draw({ ctx }: CanvasContext) {
      ctx.drawImage(
        this.image,
        this.frame * this.sprite_width,
        0,
        this.sprite_width,
        this.sprite_height,
        this.x,
        this.y,
        this.width,
        this.height,
      );
    }

    start({ ctx }: CanvasContext, dTime: number) {
      this.update(dTime);
      this.draw({ ctx });
    }
  }

  class Raven {
    image: HTMLImageElement;
    width: number;
    height: number;
    sprite_width: number;
    sprite_height: number;
    size: number;
    canvas: { width: number; height: number };
    frame: number;
    frames: number;
    x: number;
    y: number;
    directionX: number;
    directionY: number;
    marked_for_deletion: boolean;
    last_flap: number;
    flap_interval: number;
    random_colors: number[];
    color: string;
    has_particle: boolean;
    angle: number;

    constructor(canvas: {
      width: number;
      height: number;
      game_speed: { value: number };
    }) {
      this.image = new Image();
      this.image.src = ravenPng.src;
      this.sprite_width = 271;
      this.sprite_height = 194;
      this.size = Math.random() * 0.6 + 0.4;
      this.width = this.sprite_width * this.size;
      this.height = this.sprite_height * this.size;
      this.canvas = { width: canvas.width, height: canvas.height };
      this.frame = 0;
      this.frames = 4;
      this.x = this.canvas.width;
      this.y = Math.random() * (this.canvas.height - this.height);
      this.directionX = Math.random() * 5 + 5;
      this.directionY = Math.random() * 5 - 2.5;
      this.marked_for_deletion = false;
      this.last_flap = 0;
      this.flap_interval = 100 * this.size;
      this.random_colors = [
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
      ];
      this.color = `rgb(${this.random_colors.join(", ")})`;
      this.has_particle = Math.random() > 0.3;
      this.angle = Math.random() * 0.3;
    }

    update(
      dTime: number,
      game_over: { value: boolean },
      particle_objects: { value: Particle[] },
    ) {
      if (this.y < 0 || this.y > this.canvas.height - this.height) {
        this.directionY *= -1;
      }

      this.x -= this.directionX;
      this.y += this.directionY + Math.sin(this.angle);
      this.angle++;

      if (this.x < -this.width) {
        this.marked_for_deletion = true;
        game_over.value = true;
      }

      this.last_flap += dTime;
      if (this.last_flap > this.flap_interval) {
        if (this.frame > this.frames) this.frame = 0;
        else this.frame++;
        this.last_flap = 0;
        if (this.has_particle) {
          for (let i = 0; i < 3; i++) {
            particle_objects.value.push(
              new Particle(this.x, this.y, this.width, this.color),
            );
          }
        }
      }
    }

    draw({ ctx, col_ctx }: CanvasWithCollision) {
      col_ctx.beginPath();
      col_ctx.arc(
        this.x + this.width * 0.5,
        this.y + this.height * 0.5,
        this.width * 0.5,
        0,
        Math.PI * 2,
      );
      col_ctx.fillStyle = this.color;
      col_ctx.fill();
      ctx.drawImage(
        this.image,
        this.frame * this.sprite_width,
        0,
        this.sprite_width,
        this.sprite_height,
        this.x,
        this.y,
        this.width,
        this.height,
      );
    }

    start(
      contexts: CanvasWithCollision,
      dTime: number,
      game_over: { value: boolean },
      particle_objects: { value: Particle[] },
    ) {
      this.update(dTime, game_over, particle_objects);
      this.draw(contexts);
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
          subscriptions.forEach((fn) => fn());
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

  class ShooterCanvasTemplate extends SignalElement {
    get template() {
      let t = document.createElement("template");
      t.innerHTML = `
    <div class="wrapper">
      <canvas id="collision-canvas"></canvas>
      <canvas id="shooter-canvas"></canvas>
    </div>
    `;
      return t;
    }
    get styles() {
      let s = new CSSStyleSheet();
      s.replaceSync(
        `
      .wrapper {
        position: relative;
        background: linear-gradient(120deg, red, blue, green);
        height: 100%;
        width: 100%;
      }
      canvas {
        position: absolute;
        top:0;
        left: 0;
        aspect-ratio: 16/9;
      }
      #collision-canvas {
        opacity: 0;
      }
      `,
      );
      return s;
    }
  }

  type ShooterCanvasProps = {
    ctx: CanvasRenderingContext2D;
    col_ctx: CanvasRenderingContext2D;
    position: DOMRect;
    width: number;
    height: number;
    particle_objects: { value: Particle[] };
    enemy_objects: { value: Raven[] };
    explosion_objects: { value: Explosion[] };
    enemy_number: { value: number };
    game_speed: { value: number };
    game_frame: { value: number };
    stagger_frame: number;
    time_to_spawn: { value: number };
    spawn_interval: { value: number };
    prev_timestamp: { value: number };
    player_score: { value: number };
    game_over: { value: boolean };
    game_music: HTMLAudioElement;
    current_track: { value: number };
    music_playing: { value: boolean };
    music_playlist: string[];
  };

  class ShooterCanvas extends ShooterCanvasTemplate {
    private getCanvasContext(c: HTMLCanvasElement) {
      const contextOption = { willReadFrequently: true };
      const context = c.getContext(
        "2d",
        contextOption,
      ) as CanvasRenderingContext2D;
      return context;
    }

    canvas: ShooterCanvasProps;

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot?.adoptedStyleSheets.push(this.styles);
      this.shadowRoot?.appendChild(this.template.content.cloneNode(true));

      const canvas = this.shadowRoot?.querySelector(
        "#shooter-canvas",
      ) as HTMLCanvasElement;
      const collision_canvas = this.shadowRoot?.querySelector(
        "#collision-canvas",
      ) as HTMLCanvasElement;

      this.canvas = {
        ctx: this.getCanvasContext(canvas),
        col_ctx: this.getCanvasContext(collision_canvas),
        position: canvas.getBoundingClientRect(),
        width: 500,
        height: 700,
        particle_objects: super.signal([]),
        enemy_objects: super.signal([]),
        explosion_objects: super.signal([]),
        enemy_number: super.signal(1),
        game_speed: super.signal(5),
        game_frame: super.signal(0),
        stagger_frame: 5,
        time_to_spawn: super.signal(0),
        spawn_interval: super.signal(2e3),
        prev_timestamp: super.signal(0),
        player_score: super.signal(0),
        game_over: super.signal(false),
        game_music: new Audio(),
        current_track: super.signal(0),
        music_playing: super.signal(false),
        music_playlist: [mercuryMusicSfx, venusMusicSfx, marsMusicSfx],
      };

      this.canvas.width =
        canvas.width =
        collision_canvas.width =
          window.innerWidth - 16 * 2;
      this.canvas.height =
        canvas.height =
        collision_canvas.height =
          window.innerHeight - 16 * 8;
      this.canvas.ctx.font = "50px Impact";
      this.canvas.game_music.volume = 0.15;
    }

    connectedCallback() {
      const {
        canvas: { current_track, game_music, music_playlist },
      } = this;

      super.effect(() => {
        this.game_difficulty();
      });
      super.effect(() => {
        this.game_music();
      });

      this.addEventListener("click", this.handleClick);
      game_music.addEventListener("ended", () => {
        current_track.value + 1 < music_playlist.length
          ? current_track.value++
          : (current_track.value = 0);
      });

      this.drawGameStart();
    }

    disconnectedCallback() {
      this.removeEventListener("click", this.handleClick);
      this.canvas.game_music.removeEventListener("ended", () => {});
    }

    loop(timestamp: number, instance: ShooterCanvas = this) {
      const {
        canvas: {
          ctx,
          col_ctx,
          width,
          height,
          prev_timestamp,
          enemy_number,
          time_to_spawn,
          spawn_interval,
          particle_objects,
          enemy_objects,
          explosion_objects,
          game_over,
          game_speed,
          game_frame,
        },
      } = instance;

      {
        ctx.clearRect(0, 0, width, height);
        col_ctx.clearRect(0, 0, width, height);
        instance.drawPlayerScore();
      }

      {
        particle_objects.value = particle_objects.value.filter(
          ({ marked_for_deletion }) => !marked_for_deletion,
        );
        enemy_objects.value = enemy_objects.value.filter(
          ({ marked_for_deletion }) => !marked_for_deletion,
        );
        explosion_objects.value = explosion_objects.value.filter(
          ({ marked_for_deletion }) => !marked_for_deletion,
        );
      }

      {
        let dTime = timestamp - prev_timestamp.value;
        prev_timestamp.value = timestamp;
        time_to_spawn.value += dTime;

        if (time_to_spawn.value > spawn_interval.value) {
          for (let i = 0; i < enemy_number.value; i++) {
            enemy_objects.value.push(new Raven({ width, height, game_speed }));
          }
          time_to_spawn.value = 0;
        }

        enemy_objects.value.sort((a, b) => a.size - b.size);

        [
          ...particle_objects.value,
          ...enemy_objects.value,
          ...explosion_objects.value,
        ].forEach((object) => {
          object.start({ ctx, col_ctx }, dTime, game_over, particle_objects);
        });
      }

      {
        if (!game_over.value) {
          game_frame.value += game_speed.value;
          requestAnimationFrame((t) => instance.loop(t));
        } else {
          instance.drawGameOver();
        }
      }
    }

    drawPlayerScore() {
      const {
        canvas: { ctx, player_score, game_speed, music_playing },
      } = this;
      ctx.fillStyle = "#333";
      ctx.fillText("Score: " + player_score.value, 50, 75);
      ctx.fillText("Game Speed: " + game_speed.value, 50, 139);
      ctx.fillStyle = "#fff";
      ctx.fillText("Score: " + player_score.value, 55, 80);
      ctx.fillText("Game Speed: " + game_speed.value, 55, 144);
      music_playing.value = true;
    }

    drawGameStart() {
      const {
        canvas: { ctx, width, height, music_playing, game_music },
      } = this;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#333";
      ctx.fillText("Click to Start!!", width * 0.5 + 6, height * 0.5 + 6);
      ctx.fillStyle = "#fff";
      ctx.fillText("Click to Start!!", width * 0.5, height * 0.5);
      ctx.restore();
      music_playing.value = false;
      game_music.pause();
    }

    drawGameOver() {
      const {
        canvas: {
          ctx,
          col_ctx,
          width,
          height,
          player_score,
          music_playing,
          game_music,
        },
      } = this;
      ctx.clearRect(0, 0, width, height);
      col_ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#333";
      ctx.fillText(
        "GAME OVER!! Your Score is: " + player_score.value,
        width * 0.5 + 6,
        height * 0.5 + 6,
      );
      ctx.fillStyle = "#fff";
      ctx.fillText(
        "GAME OVER!! Your Score is: " + player_score.value,
        width * 0.5,
        height * 0.5,
      );
      ctx.restore();
      music_playing.value = false;
      game_music.pause();
      music_playing.value = true;
    }

    resetGame() {
      const {
        canvas: {
          game_music,
          game_frame,
          game_over,
          game_speed,
          player_score,
          enemy_objects,
          explosion_objects,
          time_to_spawn,
          prev_timestamp,
          enemy_number,
          music_playing,
        },
      } = this;

      {
        game_over.value = false;
        game_frame.value = 0;
        game_speed.value = 5;
        player_score.value = 0;
        enemy_objects.value = [];
        explosion_objects.value = [];
        time_to_spawn.value = 0;
        prev_timestamp.value = 0;
        enemy_number.value = 1;
        music_playing.value = false;
      }
      {
        game_music.pause();
        this.loop(game_frame.value);
      }
    }

    game_difficulty() {
      const {
        canvas: { player_score, game_speed, enemy_number },
      } = this;

      if (player_score.value > 200) {
        game_speed.value = 300;
        enemy_number.value = 4;
      } else if (player_score.value > 150) {
        game_speed.value = 250;
      } else if (player_score.value > 125) {
        game_speed.value = 200;
      } else if (player_score.value > 100) {
        game_speed.value = 160;
        enemy_number.value = 3;
      } else if (player_score.value > 80) {
        game_speed.value = 80;
      } else if (player_score.value > 50) {
        game_speed.value = 40;
      } else if (player_score.value > 25) {
        game_speed.value = 20;
      } else if (player_score.value > 10) {
        game_speed.value = 10;
        enemy_number.value = 2;
      } else {
        game_speed.value = 5;
        enemy_number.value = 1;
      }
    }

    game_music() {
      const {
        canvas: {
          game_over,
          game_music,
          current_track,
          music_playing,
          music_playlist,
        },
      } = this;
      if (music_playing.value && !game_music.paused) {
        return;
      } else if (music_playing.value) {
        if (game_over.value) {
          if (!game_music.paused) game_music.pause();
          game_music.src = game_musicSfx;
          game_music.loop = true;
        } else {
          if (!game_music.paused) game_music.pause();
          game_music.src = music_playlist[current_track.value];
          game_music.loop = false;
        }
        game_music.play();
      } else if (!music_playing.value && !game_music.paused) {
        game_music.pause();
      }
    }

    handleClick(e: MouseEvent) {
      const {
        canvas: {
          position,
          game_frame,
          game_over,
          col_ctx,
          enemy_objects,
          player_score,
          explosion_objects,
        },
      } = this;

      if (game_frame.value === 0) {
        this.loop(game_frame.value);
      } else if (game_over.value) {
        this.resetGame();
      } else {
        const detectedPixelColor = col_ctx.getImageData(
          e.clientX - position.left,
          e.clientY - position.top,
          1,
          1,
        ).data;

        enemy_objects.value.forEach((object) => {
          let isMatch = detectedPixelColor.reduce((result, current, i) => {
            if (result === false) return result;
            if (i > 2) return result;
            return current === object.random_colors[i];
          }, true);

          if (isMatch) {
            object.has_particle
              ? (player_score.value += 10)
              : (player_score.value += 5);
            object.marked_for_deletion = true;
            explosion_objects.value.push(
              new Explosion(object.x, object.y, object.width),
            );
          }
        });
      }
    }
  }

  window.customElements.define("shooter-canvas", ShooterCanvas);
});
