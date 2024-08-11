import type { AstroIntegration } from "astro";

export default function () {
  return {
    name: "Games",
    hooks: {
      "astro:config:setup": ({ injectRoute }) => {
        injectRoute({
          pattern: "/games",
          entrypoint: "./games/index.astro",
          prerender: true,
        });
      },
    },
  } as AstroIntegration;
}
