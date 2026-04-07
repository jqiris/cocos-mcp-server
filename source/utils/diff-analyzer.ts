/**
 * Diff analyzer for visual verification
 * Classifies differences and generates fix suggestions
 *
 * Maps pixel-level diff regions to scene nodes and categorizes:
 * - color_mismatch: colors don't match
 * - position_mismatch: element shifted
 * - missing_element: element present in mockup but not in screenshot
 * - extra_element: element present in screenshot but not in mockup
 */

import { DiffRegion, FixSuggestion, CategorizedDiff, VerificationTolerance } from '../types';

// Lazy-load jimp
let _jimp: any = null;
async function getJimp() {
  if (!_jimp) {
    _jimp = await import('jimp');
  }
  return _jimp.default || _jimp;
}

interface RegionColorInfo {
  avgR: number;
  avgG: number;
  avgB: number;
  avgBrightness: number;
  dominantChannel: 'r' | 'g' | 'b';
  variance: number;
}

/**
 * Extract color statistics from a region of an image
 */
function getRegionColor(
  imageData: Buffer,
  region: DiffRegion,
  imgWidth: number
): RegionColorInfo {
  const { boundingBox } = region;
  let sumR = 0, sumG = 0, sumB = 0;
  let count = 0;

  for (let y = boundingBox.y; y < boundingBox.y + boundingBox.height; y++) {
    for (let x = boundingBox.x; x < boundingBox.x + boundingBox.width; x++) {
      const idx = (y * imgWidth + x) * 4;
      sumR += imageData[idx];
      sumG += imageData[idx + 1];
      sumB += imageData[idx + 2];
      count++;
    }
  }

  if (count === 0) {
    return { avgR: 0, avgG: 0, avgB: 0, avgBrightness: 0, dominantChannel: 'r', variance: 0 };
  }

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const avgBrightness = (avgR + avgG + avgB) / 3;

  const dominantChannel: 'r' | 'g' | 'b' =
    avgR >= avgG && avgR >= avgB ? 'r' :
    avgG >= avgR && avgG >= avgB ? 'g' : 'b';

  // Compute variance as a proxy for texture complexity
  let sumVariance = 0;
  for (let y = boundingBox.y; y < boundingBox.y + boundingBox.height; y++) {
    for (let x = boundingBox.x; x < boundingBox.x + boundingBox.width; x++) {
      const idx = (y * imgWidth + x) * 4;
      const brightness = (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
      sumVariance += (brightness - avgBrightness) ** 2;
    }
  }
  const variance = count > 0 ? sumVariance / count : 0;

  return { avgR, avgG, avgB, avgBrightness, dominantChannel, variance };
}

/**
 * Classify a diff region into a category
 */
function classifyRegion(
  region: DiffRegion,
  mockupColor: RegionColorInfo,
  screenshotColor: RegionColorInfo,
  imgWidth: number,
  imgHeight: number
): CategorizedDiff {
  const { boundingBox, percentageOfImage } = region;
  const colorDiff = Math.sqrt(
    (mockupColor.avgR - screenshotColor.avgR) ** 2 +
    (mockupColor.avgG - screenshotColor.avgG) ** 2 +
    (mockupColor.avgB - screenshotColor.avgB) ** 2
  );

  // Position: region is at an edge/corner and small
  const isAtEdge =
    boundingBox.x < imgWidth * 0.1 ||
    boundingBox.y < imgHeight * 0.1 ||
    boundingBox.x + boundingBox.width > imgWidth * 0.9 ||
    boundingBox.y + boundingBox.height > imgHeight * 0.9;

  const isSmall = percentageOfImage < 1;

  // Missing/extra: mockup has content here but screenshot is blank (or vice versa)
  const mockupBlank = mockupColor.variance < 100 && mockupColor.avgBrightness < 20;
  const screenshotBlank = screenshotColor.variance < 100 && screenshotColor.avgBrightness < 20;

  let category: CategorizedDiff['category'];
  let description: string;

  if (mockupBlank && !screenshotBlank) {
    category = 'extra';
    description = `位置 (${boundingBox.x}, ${boundingBox.y}) 附近存在多余元素，效果图中无此内容`;
  } else if (!mockupBlank && screenshotBlank) {
    category = 'missing';
    description = `位置 (${boundingBox.x}, ${boundingBox.y}) 附近缺少元素，效果图中应有内容`;
  } else if (isAtEdge && isSmall) {
    category = 'position';
    description = `位置 (${boundingBox.x}, ${boundingBox.y}) 附近元素位置偏移`;
  } else if (colorDiff > 50) {
    category = 'color';
    const mockupHex = rgbToHex(mockupColor.avgR, mockupColor.avgG, mockupColor.avgB);
    const screenshotHex = rgbToHex(screenshotColor.avgR, screenshotColor.avgG, screenshotColor.avgB);
    description = `位置 (${boundingBox.x}, ${boundingBox.y}) 附近颜色不匹配：效果图 ${mockupHex} vs 截图 ${screenshotHex}`;
  } else if (isSmall) {
    category = 'position';
    description = `位置 (${boundingBox.x}, ${boundingBox.y}) 附近存在小幅位置偏移`;
  } else {
    category = 'size';
    description = `位置 (${boundingBox.x}, ${boundingBox.y}) 区域存在尺寸或内容差异`;
  }

  return {
    category,
    description,
    region,
    severity: region.severity
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Analyze diff regions and generate categorized diffs + fix suggestions
 */
export async function analyzeDiffs(
  mockupPath: string,
  screenshotBase64: string,
  diffRegions: DiffRegion[],
  imgWidth: number,
  imgHeight: number,
  designWidth: number = 720,
  designHeight: number = 1280
): Promise<{ categorizedDiffs: CategorizedDiff[]; fixSuggestions: FixSuggestion[] }> {
  if (diffRegions.length === 0) {
    return { categorizedDiffs: [], fixSuggestions: [] };
  }

  const Jimp = await getJimp();

  // Load images
  const mockup = await Jimp.read(mockupPath);
  const screenshotBuf = Buffer.from(screenshotBase64, 'base64');
  const screenshot = await Jimp.read(screenshotBuf);

  // Resize to match comparison dimensions
  mockup.resize(imgWidth, imgHeight);
  screenshot.resize(imgWidth, imgHeight);

  const mockupData = Buffer.from(mockup.bitmap.data);
  const screenshotData = Buffer.from(screenshot.bitmap.data);

  const categorizedDiffs: CategorizedDiff[] = [];
  const fixSuggestions: FixSuggestion[] = [];

  for (const region of diffRegions) {
    // Get color info from both images
    const mockupColor = getRegionColor(mockupData, region, imgWidth);
    const screenshotColor = getRegionColor(screenshotData, region, imgWidth);

    // Classify
    const categorized = classifyRegion(region, mockupColor, screenshotColor, imgWidth, imgHeight);
    categorizedDiffs.push(categorized);

    // Map pixel coordinates to scene coordinates
    const scaleX = designWidth / imgWidth;
    const scaleY = designHeight / imgHeight;
    const sceneX = Math.round(region.center.x * scaleX);
    const sceneY = Math.round(region.center.y * scaleY);

    // Generate fix suggestion
    const suggestion = generateFixSuggestion(
      categorized,
      sceneX,
      sceneY,
      mockupColor,
      screenshotColor
    );
    fixSuggestions.push(suggestion);
  }

  return { categorizedDiffs, fixSuggestions };
}

/**
 * Generate a fix suggestion from a categorized diff
 */
function generateFixSuggestion(
  diff: CategorizedDiff,
  sceneX: number,
  sceneY: number,
  mockupColor: RegionColorInfo,
  screenshotColor: RegionColorInfo
): FixSuggestion {
  const { category, region } = diff;
  let type: FixSuggestion['type'];
  let description: string;
  let suggestedAction: string;
  let confidence: number;

  switch (category) {
    case 'color': {
      type = 'color_mismatch';
      const targetHex = rgbToHex(mockupColor.avgR, mockupColor.avgG, mockupColor.avgB);
      const channelDiff = Math.abs(mockupColor.avgR - screenshotColor.avgR) +
        Math.abs(mockupColor.avgG - screenshotColor.avgG) +
        Math.abs(mockupColor.avgB - screenshotColor.avgB);
      confidence = Math.min(0.9, channelDiff / 300);

      description = `场景坐标 (${sceneX}, ${sceneY}) 附近颜色与效果图不一致`;
      suggestedAction = `检查该区域的 Sprite/Label 节点颜色，建议调整为 ${targetHex}`;
      break;
    }
    case 'position': {
      type = 'position_mismatch';
      confidence = 0.6;
      description = `场景坐标 (${sceneX}, ${sceneY}) 附近元素可能存在位置偏移`;
      suggestedAction = `检查该区域附近的节点 position 属性，与效果图对比调整位置`;
      break;
    }
    case 'missing': {
      type = 'missing_element';
      confidence = 0.7;
      description = `场景坐标 (${sceneX}, ${sceneY}) 附近缺少元素，效果图中应有内容`;
      suggestedAction = `在该位置检查是否有节点被隐藏(active=false)或缺失，需添加对应节点`;
      break;
    }
    case 'extra': {
      type = 'extra_element';
      confidence = 0.7;
      description = `场景坐标 (${sceneX}, ${sceneY}) 附近存在多余元素，效果图中无此内容`;
      suggestedAction = `检查该位置的节点是否应隐藏或删除，效果图中无对应元素`;
      break;
    }
    case 'size': {
      type = 'position_mismatch';
      confidence = 0.5;
      description = `场景坐标 (${sceneX}, ${sceneY}) 附近元素尺寸与效果图不一致`;
      suggestedAction = `检查该区域节点的 UITransform.contentSize 和 scale 属性`;
      break;
    }
    default: {
      type = 'color_mismatch';
      confidence = 0.3;
      description = `场景坐标 (${sceneX}, ${sceneY}) 附近存在差异`;
      suggestedAction = `人工检查该区域的视觉效果`;
    }
  }

  return {
    regionId: region.id,
    type,
    description,
    suggestedAction,
    confidence
  };
}

/**
 * Compute color consistency score
 * Measures how well the color palette matches between mockup and screenshot
 */
export async function computeColorConsistency(
  mockupPath: string,
  screenshotBase64: string,
  width: number,
  height: number
): Promise<number> {
  const Jimp = await getJimp();

  const mockup = await Jimp.read(mockupPath);
  const screenshotBuf = Buffer.from(screenshotBase64, 'base64');
  const screenshot = await Jimp.read(screenshotBuf);

  mockup.resize(width, height);
  screenshot.resize(width, height);

  const mockupData = Buffer.from(mockup.bitmap.data);
  const screenshotData = Buffer.from(screenshot.bitmap.data);

  // Sample blocks and compare average colors
  const blockSize = 16;
  let totalDiff = 0;
  let blockCount = 0;

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      let mR = 0, mG = 0, mB = 0, sR = 0, sG = 0, sB = 0, count = 0;

      for (let y = by; y < Math.min(by + blockSize, height); y++) {
        for (let x = bx; x < Math.min(bx + blockSize, width); x++) {
          const idx = (y * width + x) * 4;
          mR += mockupData[idx]; mG += mockupData[idx + 1]; mB += mockupData[idx + 2];
          sR += screenshotData[idx]; sG += screenshotData[idx + 1]; sB += screenshotData[idx + 2];
          count++;
        }
      }

      if (count > 0) {
        const diff = Math.sqrt(
          ((mR / count) - (sR / count)) ** 2 +
          ((mG / count) - (sG / count)) ** 2 +
          ((mB / count) - (sB / count)) ** 2
        );
        totalDiff += diff;
        blockCount++;
      }
    }
  }

  // Normalize to 0-1 score (max possible diff per block is ~441 = sqrt(3)*255)
  const avgDiff = blockCount > 0 ? totalDiff / blockCount : 0;
  return Math.max(0, 1 - avgDiff / 441);
}
