declare global {
  interface Window {
    rendererProcessctrl: RendererProcessCtx;
  }
}

export interface RendererProcessCtx {
  selectBaseDirectory(...args: any[]): Promise<string | undefined>;
  getBaseDirectory(...args: any[]): Promise<string | undefined>;
  getPreferencesSetStatus(...args: any[]): Promise<boolean>;
  listScreenshotPaths(...args: any[]): Promise<string[]>;
}

export type UserDataFields = "baseDirectory" | "preferencesSetStatus";

type UserDataStore = Partial<Record<UserDataFields, any>>;
