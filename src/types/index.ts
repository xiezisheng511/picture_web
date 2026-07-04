export type ToolId = 'bg-color' | 'remove-watermark' | 'edit' | 'ai-cutout';

export interface Tool {
  id: ToolId;
  icon: string;
  zhTitle: string;
  enTitle: string;
  zhDesc: string;
  enDesc: string;
  path: string;
  premium?: boolean;
}

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageFile {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}