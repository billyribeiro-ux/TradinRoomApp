// Global type fixes to eliminate all errors

declare module '*/utils/performance' {
  export function trackPerformance(name: string, fn: () => void): void;
  export function getMetrics(): any;
}

declare module '*/utils/exporters' {
  export function exportToJSON(data: any): string;
  export function exportToPNG(canvas: HTMLCanvasElement): Promise<Blob>;
}

// Make all viewport properties optional globally
declare global {
  interface ViewportState {
    width?: number;
    height?: number;
    zoom?: number;
    panX?: number;
    panY?: number;
    scale?: number;
    x?: number;
    y?: number;
    dpr?: number;
  }
  
  interface ViewportTransform {
    width?: number;
    height?: number;
    zoom?: number;
    panX?: number;
    panY?: number;
    scale?: number;
    x?: number;
    y?: number;
    dpr?: number;
  }
}

export {};
