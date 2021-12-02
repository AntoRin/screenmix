declare global {
  interface Window {
    rendererProcessctrl: RendererProcessCtx;
  }
}

export interface RendererProcessCtx {
  selectBaseDirectory: (...args: any[]) => Promise<string | undefined>;
  getBaseDirectory: (...args: any[]) => Promise<string | undefined>;
  getPreferencesSetStatus: (...args: any[]) => Promise<boolean>;
}

export type UserDataFields = "baseDirectory" | "preferencesSetStatus";

// export interface UserDataStore {
//   [key: UserDataFields]: any;
// }

type UserDataStore = Partial<Record<UserDataFields, any>>;
