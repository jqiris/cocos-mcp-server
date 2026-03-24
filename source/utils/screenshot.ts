/**
 * Screenshot capture utility for visual verification
 * Primary: Uses Cocos Creator's Camera + RenderTexture via scene script
 * Fallback: Uses Electron webContents.capturePage() to capture the scene panel
 */

import { ScreenshotResult } from '../types';

/**
 * Try to capture screenshot using Electron's webContents API (main process fallback)
 * This captures the scene panel window directly without needing scene script
 */
async function captureViaElectron(rect?: { x: number; y: number; width: number; height: number }): Promise<ScreenshotResult> {
  try {
    const { BrowserWindow } = require('electron');
    if (!BrowserWindow) {
      return { success: false, error: 'Electron BrowserWindow not available' };
    }

    const windows = BrowserWindow.getAllWindows();

    // Find the scene panel window - look for scene-related title or URL
    const sceneWindow = windows.find((w: any) => {
      try {
        const url = w.getURL ? w.getURL() : '';
        const title = w.getTitle ? w.getTitle() : '';
        return (
          url.includes('scene') ||
          title.includes('Scene') ||
          title.includes('场景') ||
          url.includes('panel/scene')
        );
      } catch {
        return false;
      }
    });

    if (!sceneWindow) {
      return { success: false, error: `Could not find scene panel window. Found ${windows.length} windows: ${windows.map((w: any) => w.getTitle ? w.getTitle() : 'unknown').join(', ')}` };
    }

    const webContents = sceneWindow.webContents;
    if (!webContents) {
      return { success: false, error: 'Scene panel has no webContents' };
    }

    // Capture the page - capturePage returns a Promise<NativeImage> in modern Electron
    const image = await (rect
      ? webContents.capturePage(rect)
      : webContents.capturePage());

    const size = image.getSize();
    const dataUrl = image.toDataURL('image/png');
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

    return {
      success: true,
      base64,
      width: size.width,
      height: size.height
    };
  } catch (error: any) {
    return { success: false, error: `Electron capture failed: ${error.message}` };
  }
}

/**
 * Capture screenshot from the scene via execute-scene-script
 * Falls back to Electron webContents.capturePage() if scene script fails
 */
export async function captureSceneScreenshot(cameraName?: string): Promise<ScreenshotResult> {
  // Try scene script approach first
  try {
    const result = await Editor.Message.request(
      'scene',
      'execute-scene-script',
      {
        name: 'cocos-mcp-server',
        method: 'captureCameraScreenshot',
        args: [cameraName]
      }
    );

    if (result && result.success) {
      return {
        success: true,
        base64: result.data?.base64,
        width: result.data?.width,
        height: result.data?.height
      };
    }
  } catch {
    // Scene script failed, try fallback
  }

  // Fallback: capture via Electron
  return captureViaElectron();
}

/**
 * Capture screenshot with specific resolution
 */
export async function captureSceneScreenshotWithResolution(
  width: number,
  height: number,
  cameraName?: string
): Promise<ScreenshotResult> {
  // Try scene script approach first
  try {
    const result = await Editor.Message.request(
      'scene',
      'execute-scene-script',
      {
        name: 'cocos-mcp-server',
        method: 'captureCameraScreenshotWithResolution',
        args: [width, height, cameraName]
      }
    );

    if (result && result.success) {
      return {
        success: true,
        base64: result.data?.base64,
        width: result.data?.width,
        height: result.data?.height
      };
    }
  } catch {
    // Scene script failed, try fallback
  }

  // Fallback: capture via Electron with specified rect
  return captureViaElectron({ x: 0, y: 0, width, height });
}

/**
 * Capture a specific region of the screen
 */
export async function captureRegion(
  x: number,
  y: number,
  width: number,
  height: number,
  cameraName?: string
): Promise<ScreenshotResult> {
  // Try scene script approach first
  try {
    const result = await Editor.Message.request(
      'scene',
      'execute-scene-script',
      {
        name: 'cocos-mcp-server',
        method: 'captureRegion',
        args: [x, y, width, height, cameraName]
      }
    );

    if (result && result.success) {
      return {
        success: true,
        base64: result.data?.base64,
        width: result.data?.width,
        height: result.data?.height
      };
    }
  } catch {
    // Scene script failed, try fallback
  }

  // Fallback: capture via Electron with specified rect
  return captureViaElectron({ x, y, width, height });
}
