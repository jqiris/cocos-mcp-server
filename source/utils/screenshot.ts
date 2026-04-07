/**
 * Screenshot capture utility for visual verification
 * Primary: Uses Cocos Creator's Camera + RenderTexture via scene script
 * Fallback: Uses Electron webContents.capturePage() to capture the scene panel
 */

import { ScreenshotResult } from '../types';

/**
 * Try to capture screenshot using Electron's webContents API (main process fallback)
 * In Cocos Creator, panels are <webview> elements inside the main BrowserWindow,
 * so BrowserWindow.getAllWindows() only returns the main window. We capture
 * the main window and try to locate the scene panel's webContents.
 */
async function captureViaElectron(rect?: { x: number; y: number; width: number; height: number }): Promise<ScreenshotResult> {
  try {
    const { BrowserWindow } = require('electron');
    if (!BrowserWindow) {
      return { success: false, error: 'Electron BrowserWindow not available' };
    }

    const windows = BrowserWindow.getAllWindows();

    // Strategy 1: Look for a window whose title/URL contains "scene" or "Scene"
    let targetWindow = windows.find((w: any) => {
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

    // Strategy 2: Fall back to the main Cocos Creator window
    // (the only window in most cases, since panels are webviews)
    if (!targetWindow && windows.length > 0) {
      targetWindow = windows.find((w: any) => {
        try {
          const title = w.getTitle ? w.getTitle() : '';
          return (
            title.includes('Cocos') ||
            title.includes('cocos')
          );
        } catch {
          return false;
        }
      }) || windows[0];
    }

    if (!targetWindow) {
      return { success: false, error: `Could not find any Electron window` };
    }

    // In Cocos Creator, the main window's webContents renders the editor frame.
    // Individual panels are <webview> elements with their own webContents.
    // Try to access panel webContents via the main window.
    const mainWebContents = targetWindow.webContents;
    if (!mainWebContents) {
      return { success: false, error: 'Window has no webContents' };
    }

    // Try to find the scene panel's webContents among all webContents
    // In Electron, webContents.getAllWebContents() returns all webContents including webviews
    const { webContents } = require('electron');
    const allWebContents = webContents.getAllWebContents();
    const sceneWebContents = allWebContents.find((wc: any) => {
      try {
        const url = wc.getURL ? wc.getURL() : '';
        return (
          url.includes('panel/scene') ||
          url.includes('scene-panel') ||
          url.includes('scene.html')
        );
      } catch {
        return false;
      }
    });

    // Capture from scene panel if found, otherwise from main window
    const captureTarget = sceneWebContents || mainWebContents;
    const image = await (rect
      ? captureTarget.capturePage(rect)
      : captureTarget.capturePage());

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
