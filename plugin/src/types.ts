export interface PluginSettings {
  name?: string;
  unityExportDir?: string;
  quest?: QuestSettings;
}

export interface QuestSettings {
  enabled?: boolean;
  panel?: {
    freeResizing?: {
      enabled?: boolean;
      lockAspectRatio?: boolean;
      limits?: {
        minWidth: number;
        maxWidth: number;
        minHeight: number;
        maxHeight: number;
      };
    };
    // orientation?: 'landscape' | 'portrait'; // TODO: Add support for orientation updated on main activity tag
    layout?: {
      defaultHeight: string;
      defaultWidth: string;
    };
  };
}