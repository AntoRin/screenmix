export type MainCtxErrorCode = keyof typeof ERROR_CODE_MAP;

export const ERROR_CODE_MAP = {
   MP_ENOENT_BASE_DIR: (baseDirectory: string) =>
      `The workspace ${baseDirectory} does not exist. Change or create a new workspace.`,
} as const;
