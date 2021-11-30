declare global {
  interface Window {
    rendererProcessctrl: RendererProcessCtx;
  }
}

export interface DirectorySelectResponse {
  canceled: boolean;
  filePaths: string[];
}

export interface RendererProcessCtx {
  selectDirectory: () => Promise<DirectorySelectResponse>;
}
