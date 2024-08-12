import type { AstroIntegration } from "astro";

export default function () {
  return {
    name: "Games",
    hooks: {
      "astro:config:setup": ({ injectRoute }) => {
        injectRoute({
          pattern: "/games",
          entrypoint: "./src/games/index.astro",
          prerender: true,
        });
        injectRoute({
          pattern: "/games/shooter",
          entrypoint: "./src/games/my_first_game/shooter.astro",
          prerender: true,
        });
        injectRoute({
          pattern: "/games/memory",
          entrypoint: "./src/games/memory_game/memory.astro",
          prerender: true,
        });
      },
    },
  } as AstroIntegration;
}
