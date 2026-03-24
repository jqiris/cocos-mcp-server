/**
 * Visual Verification Tools for MCP Server
 * Provides screenshot capture and image comparison capabilities
 */

import { ToolExecutor, ToolDefinition, ToolResponse, VerificationTolerance, VerificationResult } from '../types';
import { readVerificationSettings } from '../settings';
import { captureSceneScreenshot, captureSceneScreenshotWithResolution } from '../utils/screenshot';
import { compareImages, evaluateVerification } from '../utils/image-compare';
import * as path from 'path';
import * as fs from 'fs';

export class VisualVerificationTools implements ToolExecutor {

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'visual_verification',
                category: 'validation',
                description: '视觉校验工具：捕获场景截图并与设计效果图对比，返回结构化差异报告。支持三种模式：capture(仅截图)、compare(仅对比)、verify(截图+对比)。',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['capture', 'compare', 'verify'],
                            description: '操作类型: capture=仅截图, compare=仅对比已有图片, verify=截图+对比'
                        },
                        mockupPath: {
                            type: 'string',
                            description: '设计效果图路径（相对于项目根目录或绝对路径）'
                        },
                        screenshotBase64: {
                            type: 'string',
                            description: '已有截图的base64编码（仅用于compare模式）'
                        },
                        cameraName: {
                            type: 'string',
                            description: '可选，指定相机名称'
                        },
                        width: {
                            type: 'number',
                            description: '截图宽度（可选）'
                        },
                        height: {
                            type: 'number',
                            description: '截图高度（可选）'
                        },
                        pixelThreshold: {
                            type: 'number',
                            description: '像素差异阈值 (0-1)，默认使用面板配置'
                        },
                        similarityThreshold: {
                            type: 'number',
                            description: '相似度通过阈值 (0-1)，默认使用面板配置'
                        },
                        minRegionSize: {
                            type: 'number',
                            description: '最小差异区域像素数，默认使用面板配置'
                        },
                        minRegionPercent: {
                            type: 'number',
                            description: '最小差异区域百分比，默认使用面板配置'
                        },
                        positionTolerance: {
                            type: 'number',
                            description: '位置容差像素数，默认使用面板配置'
                        },
                        strictMode: {
                            type: 'boolean',
                            description: '是否启用严格模式，默认使用面板配置'
                        },
                        includeDiffImage: {
                            type: 'boolean',
                            description: '是否返回差异可视化图（base64）'
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        const action = args.action;

        switch (action) {
            case 'capture':
                return this.handleCapture(args);
            case 'compare':
                return this.handleCompare(args);
            case 'verify':
                return this.handleVerify(args);
            default:
                return {
                    success: false,
                    error: `Unknown action: ${action}. Valid actions are: capture, compare, verify`
                };
        }
    }

    /**
     * Capture screenshot only
     */
    private async handleCapture(args: any): Promise<ToolResponse> {
        const { cameraName, width, height } = args;

        try {
            let result;
            if (width && height) {
                result = await captureSceneScreenshotWithResolution(width, height, cameraName);
            } else {
                result = await captureSceneScreenshot(cameraName);
            }

            if (result.success) {
                return {
                    success: true,
                    data: {
                        screenshotBase64: result.base64,
                        width: result.width,
                        height: result.height
                    },
                    message: `截图成功: ${result.width}x${result.height}`
                };
            } else {
                return {
                    success: false,
                    error: result.error || '截图失败'
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: `截图异常: ${error.message}`
            };
        }
    }

    /**
     * Compare existing images
     */
    private async handleCompare(args: any): Promise<ToolResponse> {
        const { mockupPath, screenshotBase64, includeDiffImage } = args;

        if (!mockupPath) {
            return { success: false, error: '缺少 mockupPath 参数' };
        }
        if (!screenshotBase64) {
            return { success: false, error: '缺少 screenshotBase64 参数' };
        }

        try {
            // Resolve mockup path
            const resolvedPath = this.resolveMockupPath(mockupPath);
            if (!fs.existsSync(resolvedPath)) {
                return { success: false, error: `效果图不存在: ${resolvedPath}` };
            }

            // Get tolerance settings
            const tolerance = this.getTolerance(args);

            // Compare images
            const compareResult = await compareImages(
                resolvedPath,
                screenshotBase64,
                tolerance,
                includeDiffImage || false
            );

            // Evaluate result
            const evaluation = evaluateVerification(compareResult, tolerance);

            const result: VerificationResult = {
                passed: evaluation.passed,
                similarity: compareResult.similarity,
                overallVerdict: evaluation.verdict,
                differences: compareResult.diffRegions,
                diffImageBase64: compareResult.diffImageBase64,
                mockupPath: resolvedPath,
                screenshotSize: {
                    width: Math.round(Math.sqrt(compareResult.totalPixels * (compareResult.diffRegions[0]?.boundingBox.width || 1) / (compareResult.diffRegions[0]?.boundingBox.height || 1))),
                    height: Math.round(Math.sqrt(compareResult.totalPixels))
                },
                timestamp: new Date().toISOString(),
                toleranceUsed: tolerance
            };

            return {
                success: true,
                data: result,
                message: evaluation.verdict
            };
        } catch (error: any) {
            return {
                success: false,
                error: `对比异常: ${error.message}`
            };
        }
    }

    /**
     * Capture and verify in one step
     */
    private async handleVerify(args: any): Promise<ToolResponse> {
        const { mockupPath, cameraName, width, height, includeDiffImage } = args;

        if (!mockupPath) {
            return { success: false, error: '缺少 mockupPath 参数' };
        }

        try {
            // Step 1: Capture screenshot
            let screenshotResult;
            if (width && height) {
                screenshotResult = await captureSceneScreenshotWithResolution(width, height, cameraName);
            } else {
                screenshotResult = await captureSceneScreenshot(cameraName);
            }

            if (!screenshotResult.success) {
                return {
                    success: false,
                    error: `截图失败: ${screenshotResult.error}`
                };
            }

            // Step 2: Compare with mockup
            const compareArgs = {
                ...args,
                screenshotBase64: screenshotResult.base64
            };

            const compareResponse = await this.handleCompare(compareArgs);

            // Add screenshot info to result
            if (compareResponse.success && compareResponse.data) {
                compareResponse.data.screenshotBase64 = screenshotResult.base64;
                compareResponse.data.screenshotSize = {
                    width: screenshotResult.width,
                    height: screenshotResult.height
                };
            }

            return compareResponse;
        } catch (error: any) {
            return {
                success: false,
                error: `校验异常: ${error.message}`
            };
        }
    }

    /**
     * Resolve mockup path (relative to project or absolute)
     */
    private resolveMockupPath(mockupPath: string): string {
        if (path.isAbsolute(mockupPath)) {
            return mockupPath;
        }

        // Try relative to project root
        const projectRoot = Editor.Project.path;
        const projectPath = path.join(projectRoot, mockupPath);
        if (fs.existsSync(projectPath)) {
            return projectPath;
        }

        // Try relative to mockups directory
        const mockupsPath = path.join(projectRoot, 'mockups', mockupPath);
        if (fs.existsSync(mockupsPath)) {
            return mockupsPath;
        }

        return projectPath;
    }

    /**
     * Get tolerance settings, merging args with panel defaults
     */
    private getTolerance(args: any): VerificationTolerance {
        const settings = readVerificationSettings();
        const defaults = settings.defaultTolerance;

        return {
            pixelThreshold: args.pixelThreshold ?? defaults.pixelThreshold,
            similarityThreshold: args.similarityThreshold ?? defaults.similarityThreshold,
            minRegionSize: args.minRegionSize ?? defaults.minRegionSize,
            minRegionPercent: args.minRegionPercent ?? defaults.minRegionPercent,
            positionTolerance: args.positionTolerance ?? defaults.positionTolerance,
            strictMode: args.strictMode ?? defaults.strictMode
        };
    }
}
