/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly XATA_API_KEY: string;
  readonly XATA_BRANCH?: string;
  readonly XATA_DB_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
