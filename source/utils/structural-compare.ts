/**
 * Structural comparison utility using edge detection and SSIM
 * Provides layout-level comparison beyond pixel-level diff
 *
 * Uses Sobel edge detection (pure JS, no OpenCV dependency) and
 * a simplified SSIM implementation for structural similarity.
 */

import { StructuralCompareResult, DiffRegion } from '../types';

// Lazy-load jimp
let _jimp: any = null;
async function getJimp() {
  if (!_jimp) {
    _jimp = await import('jimp');
  }
  return _jimp.default || _jimp;
}

interface GrayImage {
  width: number;
  height: number;
  data: Float64Array;
}

/**
 * Convert RGBA buffer to grayscale
 */
function toGrayscale(rgba: Buffer, width: number, height: number): GrayImage {
  const data = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    // Luminosity method
    data[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return { width, height, data };
}

/**
 * Sobel edge detection
 * Returns edge magnitude image
 */
function sobelEdge(gray: GrayImage): GrayImage {
  const { width, height } = gray;
  const output = new Float64Array(width * height);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += gray.data[idx] * sobelX[ki];
          gy += gray.data[idx] * sobelY[ki];
        }
      }
      output[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return { width, height, data: output };
}

/**
 * Apply threshold to edge image (Canny-like binarization)
 */
function thresholdEdges(edge: GrayImage, threshold: number = 50): GrayImage {
  const output = new Float64Array(edge.width * edge.height);
  for (let i = 0; i < edge.data.length; i++) {
    output[i] = edge.data[i] > threshold ? 255 : 0;
  }
  return { width: edge.width, height: edge.height, data: output };
}

/**
 * Compute SSIM (Structural Similarity Index) between two grayscale images
 * Simplified implementation based on Wang et al. (2004)
 */
function computeSSIM(img1: GrayImage, img2: GrayImage): number {
  const { width, height } = img1;
  const n = width * height;

  // Constants
  const L = 255; // dynamic range
  const K1 = 0.01;
  const K2 = 0.03;
  const C1 = (K1 * L) ** 2;
  const C2 = (K2 * L) ** 2;

  // Window size for local statistics (8x8 blocks)
  const windowSize = 8;
  const numWindows = Math.floor(width / windowSize) * Math.floor(height / windowSize);

  if (numWindows === 0) return 0;

  let totalSSIM = 0;

  for (let wy = 0; wy < height - windowSize; wy += windowSize) {
    for (let wx = 0; wx < width - windowSize; wx += windowSize) {
      let sum1 = 0, sum2 = 0, sum11 = 0, sum22 = 0, sum12 = 0;

      for (let dy = 0; dy < windowSize; dy++) {
        for (let dx = 0; dx < windowSize; dx++) {
          const idx = (wy + dy) * width + (wx + dx);
          const v1 = img1.data[idx];
          const v2 = img2.data[idx];
          sum1 += v1;
          sum2 += v2;
          sum11 += v1 * v1;
          sum22 += v2 * v2;
          sum12 += v1 * v2;
        }
      }

      const N = windowSize * windowSize;
      const mu1 = sum1 / N;
      const mu2 = sum2 / N;
      const sigma11 = sum11 / N - mu1 * mu1;
      const sigma22 = sum22 / N - mu2 * mu2;
      const sigma12 = sum12 / N - mu1 * mu2;

      const ssim = ((2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)) /
        ((mu1 * mu1 + mu2 * mu2 + C1) * (sigma11 + sigma22 + C2));

      totalSSIM += ssim;
    }
  }

  return Math.max(0, Math.min(1, totalSSIM / numWindows));
}

/**
 * Compute edge similarity by comparing binary edge images
 * Uses IoU (Intersection over Union)
 */
function computeEdgeIoU(edge1: GrayImage, edge2: GrayImage): number {
  let intersection = 0;
  let union = 0;

  for (let i = 0; i < edge1.data.length; i++) {
    const e1 = edge1.data[i] > 0 ? 1 : 0;
    const e2 = edge2.data[i] > 0 ? 1 : 0;
    intersection += e1 & e2;
    union += e1 | e2;
  }

  return union > 0 ? intersection / union : 1;
}

/**
 * Find structural difference regions by comparing edge maps
 */
function findStructuralDiffRegions(
  edge1: GrayImage,
  edge2: GrayImage,
  minRegionSize: number = 100
): DiffRegion[] {
  const { width, height } = edge1;
  const diffMask = new Uint8Array(width * height);

  // Create diff mask where edges differ
  for (let i = 0; i < width * height; i++) {
    const e1 = edge1.data[i] > 0 ? 1 : 0;
    const e2 = edge2.data[i] > 0 ? 1 : 0;
    diffMask[i] = e1 !== e2 ? 1 : 0;
  }

  // Dilate the mask slightly to merge nearby diffs
  const dilated = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (
        diffMask[y * width + x] ||
        diffMask[(y - 1) * width + x] ||
        diffMask[(y + 1) * width + x] ||
        diffMask[y * width + x - 1] ||
        diffMask[y * width + x + 1]
      ) {
        dilated[y * width + x] = 1;
      }
    }
  }

  // Flood fill to find connected regions
  const visited = new Set<number>();
  const regions: DiffRegion[] = [];

  const floodFill = (startIdx: number): number[] => {
    const pixels: number[] = [];
    const stack = [startIdx];

    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited.has(idx) || !dilated[idx]) continue;
      if (idx % width === 0 || idx % width === width - 1) continue;
      if (idx < width || idx >= (height - 1) * width) continue;

      visited.add(idx);
      pixels.push(idx);

      stack.push(idx - 1);
      stack.push(idx + 1);
      stack.push(idx - width);
      stack.push(idx + width);
    }

    return pixels;
  };

  for (let i = 0; i < dilated.length; i++) {
    if (dilated[i] && !visited.has(i)) {
      const pixels = floodFill(i);
      if (pixels.length >= minRegionSize) {
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let sumX = 0, sumY = 0;

        for (const idx of pixels) {
          const x = idx % width;
          const y = Math.floor(idx / width);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          sumX += x;
          sumY += y;
        }

        const pixelCount = pixels.length;
        const totalPixels = width * height;
        const percentage = (pixelCount / totalPixels) * 100;

        let severity: 'low' | 'medium' | 'high';
        if (percentage > 5) severity = 'high';
        else if (percentage > 2) severity = 'medium';
        else severity = 'low';

        regions.push({
          id: regions.length + 1,
          boundingBox: {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
          },
          pixelCount,
          severity,
          center: {
            x: sumX / pixelCount,
            y: sumY / pixelCount
          },
          percentageOfImage: percentage
        });
      }
    }
  }

  return regions;
}

/**
 * Main structural comparison function
 * Compares two images using edge detection + SSIM
 */
export async function compareStructural(
  mockupPath: string,
  screenshotBase64: string,
  includeEdgeImage: boolean = false
): Promise<StructuralCompareResult> {
  const Jimp = await getJimp();

  // Load and resize images to same dimensions
  const mockup = await Jimp.read(mockupPath);
  const screenshotBuf = Buffer.from(screenshotBase64, 'base64');
  const screenshot = await Jimp.read(screenshotBuf);

  const targetWidth = Math.min(mockup.getWidth(), screenshot.getWidth());
  const targetHeight = Math.min(mockup.getHeight(), screenshot.getHeight());

  mockup.resize(targetWidth, targetHeight);
  screenshot.resize(targetWidth, targetHeight);

  // Convert to grayscale
  const gray1 = toGrayscale(Buffer.from(mockup.bitmap.data), targetWidth, targetHeight);
  const gray2 = toGrayscale(Buffer.from(screenshot.bitmap.data), targetWidth, targetHeight);

  // Compute SSIM on grayscale images
  const ssim = computeSSIM(gray1, gray2);

  // Extract edges
  const edge1 = sobelEdge(gray1);
  const edge2 = sobelEdge(gray2);

  // Binarize edges
  const binaryEdge1 = thresholdEdges(edge1);
  const binaryEdge2 = thresholdEdges(edge2);

  // Compute edge IoU
  const edgeSimilarity = computeEdgeIoU(binaryEdge1, binaryEdge2);

  // Find structural diff regions
  const structuralDiffRegions = findStructuralDiffRegions(binaryEdge1, binaryEdge2);

  // Optionally generate edge visualization
  let edgeImageBase64: string | undefined;
  if (includeEdgeImage) {
    // Create side-by-side edge comparison
    const visWidth = targetWidth * 2;
    const visImage = await Jimp.create(visWidth, targetHeight);
    const visData = Buffer.from(visImage.bitmap.data);

    // Left: mockup edges (green)
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      const v = binaryEdge1.data[i] > 0 ? 200 : 20;
      visData[i * 4] = 0;
      visData[i * 4 + 1] = v;
      visData[i * 4 + 2] = 0;
      visData[i * 4 + 3] = 255;
    }

    // Right: screenshot edges (blue)
    for (let i = 0; i < targetWidth * targetHeight; i++) {
      const v = binaryEdge2.data[i] > 0 ? 200 : 20;
      const offset = (visWidth * targetHeight + i) * 4;
      const row = Math.floor(i / targetWidth);
      const col = i % targetWidth;
      const visIdx = (row * visWidth + targetWidth + col) * 4;
      visData[visIdx] = 0;
      visData[visIdx + 1] = 0;
      visData[visIdx + 2] = v;
      visData[visIdx + 3] = 255;
    }

    visImage.bitmap.data = Buffer.from(visData);
    const pngBuf = await visImage.getBufferAsync(Jimp.MIME_PNG);
    edgeImageBase64 = pngBuf.toString('base64');
  }

  return {
    edgeSimilarity,
    ssim,
    structuralDiffRegions,
    edgeImageBase64
  };
}
