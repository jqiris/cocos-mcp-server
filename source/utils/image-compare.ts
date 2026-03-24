/**
 * Image comparison utility for visual verification
 * Uses jimp for image processing and pixelmatch for comparison
 */

import pixelmatch from 'pixelmatch';
import { CompareResult, DiffRegion, VerificationTolerance } from '../types';

// Lazy-load jimp to avoid issues during extension initialization
let _jimp: any = null;
async function getJimp() {
  if (!_jimp) {
    _jimp = await import('jimp');
  }
  return _jimp.default || _jimp;
}

/**
 * Compare two images and return structured difference report
 */
export async function compareImages(
  mockupPath: string,
  screenshotBase64: string,
  tolerance: VerificationTolerance,
  includeDiffImage: boolean = false
): Promise<CompareResult> {
  try {
    // Lazy-load jimp
    const Jimp = await getJimp();

    // Load images
    const mockupImage = await Jimp.read(mockupPath);
    const screenshotBuffer = Buffer.from(screenshotBase64, 'base64');
    const screenshotImage = await Jimp.read(screenshotBuffer);

    // Get dimensions
    const mockupWidth = mockupImage.getWidth();
    const mockupHeight = mockupImage.getHeight();
    const screenshotWidth = screenshotImage.getWidth();
    const screenshotHeight = screenshotImage.getHeight();

    // Use the smaller dimensions
    const targetWidth = Math.min(mockupWidth, screenshotWidth);
    const targetHeight = Math.min(mockupHeight, screenshotHeight);

    // Resize images to match dimensions
    const mockupResized = mockupImage.resize(targetWidth, targetHeight);
    const screenshotResized = screenshotImage.resize(targetWidth, targetHeight);

    // Get raw RGBA pixel data
    const mockupData = Buffer.from(mockupResized.bitmap.data);
    const screenshotData = Buffer.from(screenshotResized.bitmap.data);

    const totalPixels = targetWidth * targetHeight;

    // Create diff output buffer
    const diffData = Buffer.alloc(totalPixels * 4);

    // Run pixelmatch
    const mismatchedPixels = pixelmatch(
      mockupData,
      screenshotData,
      diffData,
      targetWidth,
      targetHeight,
      {
        threshold: tolerance.pixelThreshold,
        alpha: 0.5,
        diffColor: [255, 0, 0],  // Red for differences
        diffColorAlt: [255, 100, 100]
      }
    );

    // Calculate similarity
    const similarity = 1 - (mismatchedPixels / totalPixels);

    // Cluster diff pixels into regions
    const diffRegions = clusterDiffRegions(
      diffData,
      targetWidth,
      targetHeight,
      tolerance.minRegionSize,
      tolerance.minRegionPercent
    );

    // Optionally generate diff image
    let diffImageBase64: string | undefined;
    if (includeDiffImage) {
      // Create a new Jimp image from the diff data
      const diffImage = await Jimp.create(targetWidth, targetHeight);
      diffImage.bitmap.data = Buffer.from(diffData);

      // Get PNG buffer and convert to base64
      const diffPng = await diffImage.getBufferAsync(Jimp.MIME_PNG);
      diffImageBase64 = diffPng.toString('base64');
    }

    return {
      similarity,
      mismatchedPixels,
      totalPixels,
      diffRegions,
      diffImageBase64
    };
  } catch (error: any) {
    throw new Error(`Image comparison failed: ${error.message}`);
  }
}

/**
 * Cluster diff pixels into continuous regions
 */
function clusterDiffRegions(
  diffData: Buffer,
  width: number,
  height: number,
  minRegionSize: number,
  minRegionPercent: number
): DiffRegion[] {
  const totalPixels = width * height;
  const minSize = Math.max(minRegionSize, totalPixels * minRegionPercent / 100);

  // Create binary mask (1 = diff, 0 = no diff)
  const mask: boolean[] = [];
  for (let i = 0; i < diffData.length; i += 4) {
    // Check if pixel has any red component (indicates diff)
    mask.push(diffData[i] > 100);
  }

  // Find connected components using flood fill
  const visited = new Set<number>();
  const regions: Array<{ pixels: number[]; bounds: { minX: number; minY: number; maxX: number; maxY: number } }> = [];

  const getIndex = (x: number, y: number) => y * width + x;
  const getCoords = (idx: number) => ({ x: idx % width, y: Math.floor(idx / width) });

  const floodFill = (startIdx: number): number[] => {
    const regionPixels: number[] = [];
    const stack = [startIdx];

    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited.has(idx) || !mask[idx]) continue;

      visited.add(idx);
      regionPixels.push(idx);

      const { x, y } = getCoords(idx);

      // Check 4-connected neighbors
      if (x > 0) stack.push(getIndex(x - 1, y));
      if (x < width - 1) stack.push(getIndex(x + 1, y));
      if (y > 0) stack.push(getIndex(x, y - 1));
      if (y < height - 1) stack.push(getIndex(x, y + 1));
    }

    return regionPixels;
  };

  // Find all regions
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && !visited.has(i)) {
      const pixels = floodFill(i);
      if (pixels.length >= minSize) {
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let sumX = 0, sumY = 0;

        for (const idx of pixels) {
          const { x, y } = getCoords(idx);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          sumX += x;
          sumY += y;
        }

        regions.push({
          pixels,
          bounds: { minX, minY, maxX, maxY }
        });
      }
    }
  }

  // Convert to DiffRegion format
  return regions.map((region, index) => {
    const { bounds, pixels } = region;
    const pixelCount = pixels.length;
    const percentageOfImage = (pixelCount / totalPixels) * 100;

    // Determine severity
    let severity: 'low' | 'medium' | 'high';
    if (percentageOfImage > 5) {
      severity = 'high';
    } else if (percentageOfImage > 2) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    return {
      id: index + 1,
      boundingBox: {
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.maxX - bounds.minX + 1,
        height: bounds.maxY - bounds.minY + 1
      },
      pixelCount,
      severity,
      center: {
        x: bounds.minX + (bounds.maxX - bounds.minX) / 2,
        y: bounds.minY + (bounds.maxY - bounds.minY) / 2
      },
      percentageOfImage
    };
  });
}

/**
 * Evaluate verification result against tolerance settings
 */
export function evaluateVerification(
  compareResult: CompareResult,
  tolerance: VerificationTolerance
): { passed: boolean; verdict: string } {
  // 1. Check overall similarity
  if (compareResult.similarity < tolerance.similarityThreshold) {
    return {
      passed: false,
      verdict: `相似度 ${(compareResult.similarity * 100).toFixed(1)}% 低于阈值 ${(tolerance.similarityThreshold * 100).toFixed(1)}%`
    };
  }

  // 2. Filter significant regions
  const significantRegions = compareResult.diffRegions.filter(r =>
    r.severity !== 'low' || !tolerance.strictMode
  );

  const highSeverity = significantRegions.filter(r => r.severity === 'high');
  const mediumSeverity = significantRegions.filter(r => r.severity === 'medium');

  // 3. Apply mode logic
  if (tolerance.strictMode) {
    return {
      passed: significantRegions.length === 0,
      verdict: significantRegions.length === 0
        ? '校验通过，无显著差异'
        : `检测到 ${significantRegions.length} 处差异`
    };
  } else {
    const passed = highSeverity.length === 0 && mediumSeverity.length <= 2;
    return {
      passed,
      verdict: highSeverity.length > 0
        ? `检测到 ${highSeverity.length} 处严重差异`
        : mediumSeverity.length > 2
          ? `检测到 ${mediumSeverity.length} 处中等差异，超出容许范围`
          : '布局基本一致，差异在容差范围内'
    };
  }
}
