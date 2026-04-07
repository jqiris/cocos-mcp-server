/**
 * Visual Verification Tools for MCP Server
 * Provides screenshot capture, image comparison, structural analysis, and fix suggestions
 */

import { ToolExecutor, ToolDefinition, ToolResponse, VerificationTolerance, VerificationResult, EnhancedVerificationResult, BatchVerifyTask, BatchVerifyResult } from '../types';
import { readVerificationSettings } from '../settings';
import { captureSceneScreenshot, captureSceneScreenshotWithResolution } from '../utils/screenshot';
import { compareImages, evaluateVerification } from '../utils/image-compare';
import { compareStructural } from '../utils/structural-compare';
import { analyzeDiffs, computeColorConsistency } from '../utils/diff-analyzer';
import * as path from 'path';
import * as fs from 'fs';

export class VisualVerificationTools implements ToolExecutor {

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'visual_verification',
                category: 'validation',
                description: '视觉校验工具：捕获场景截图并与设计效果图对比，返回结构化差异报告。支持六种模式：capture(仅截图)、compare(仅对比)、verify(截图+对比)、structural_compare(结构对比)、suggest_fixes(差异分析+修复建议)、batch_verify(批量并行验证)。',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['capture', 'compare', 'verify', 'structural_compare', 'suggest_fixes', 'batch_verify'],
                            description: '操作类型: capture=仅截图, compare=仅对比已有图片, verify=截图+对比(含结构分析和修复建议), structural_compare=结构对比(Canny边缘+SSIM), suggest_fixes=差异分析+修复建议, batch_verify=批量并行验证多个场景'
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
                        },
                        includeEdgeImage: {
                            type: 'boolean',
                            description: '是否返回边缘对比可视化图（base64，仅structural_compare模式）'
                        },
                        designWidth: {
                            type: 'number',
                            description: '设计分辨率宽度（用于坐标映射，默认720）'
                        },
                        designHeight: {
                            type: 'number',
                            description: '设计分辨率高度（用于坐标映射，默认1280）'
                        },
                        tasks: {
                            type: 'array',
                            description: '批量验证任务列表（仅batch_verify模式）',
                            items: {
                                type: 'object',
                                properties: {
                                    sceneName: { type: 'string', description: '场景名称' },
                                    mockupPath: { type: 'string', description: '效果图路径' },
                                    cameraName: { type: 'string', description: '可选相机名称' }
                                },
                                required: ['mockupPath']
                            }
                        },
                        maxConcurrent: {
                            type: 'number',
                            description: '批量验证最大并行数（默认3）'
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
            case 'structural_compare':
                return this.handleStructuralCompare(args);
            case 'suggest_fixes':
                return this.handleSuggestFixes(args);
            case 'batch_verify':
                return this.handleBatchVerify(args);
            default:
                return {
                    success: false,
                    error: `Unknown action: ${action}. Valid actions are: capture, compare, verify, structural_compare, suggest_fixes, batch_verify`
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
            const resolvedPath = this.resolveMockupPath(mockupPath);
            if (!fs.existsSync(resolvedPath)) {
                return { success: false, error: `效果图不存在: ${resolvedPath}` };
            }

            const tolerance = this.getTolerance(args);
            const compareResult = await compareImages(
                resolvedPath,
                screenshotBase64,
                tolerance,
                includeDiffImage || false
            );
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
     * Capture and verify in one step (enhanced with structural analysis + fix suggestions)
     */
    private async handleVerify(args: any): Promise<ToolResponse> {
        const { mockupPath, cameraName, width, height, includeDiffImage, designWidth, designHeight } = args;

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

            // Step 2: Pixel-level comparison
            const resolvedPath = this.resolveMockupPath(mockupPath);
            if (!fs.existsSync(resolvedPath)) {
                return { success: false, error: `效果图不存在: ${resolvedPath}` };
            }

            const tolerance = this.getTolerance(args);
            const compareResult = await compareImages(
                resolvedPath,
                screenshotResult.base64!,
                tolerance,
                includeDiffImage || false
            );
            const evaluation = evaluateVerification(compareResult, tolerance);

            // Step 3: Structural comparison (SSIM + edge)
            let structuralResult;
            try {
                structuralResult = await compareStructural(
                    resolvedPath,
                    screenshotResult.base64!,
                    false
                );
            } catch {
                // Structural comparison is optional, don't fail the whole verify
            }

            // Step 4: Color consistency
            let colorConsistency: number | undefined;
            try {
                colorConsistency = await computeColorConsistency(
                    resolvedPath,
                    screenshotResult.base64!,
                    screenshotResult.width!,
                    screenshotResult.height!
                );
            } catch {
                // Optional
            }

            // Step 5: Diff analysis and fix suggestions
            let categorizedDiffs, fixSuggestions;
            try {
                const analysis = await analyzeDiffs(
                    resolvedPath,
                    screenshotResult.base64!,
                    compareResult.diffRegions,
                    screenshotResult.width!,
                    screenshotResult.height!,
                    designWidth || 720,
                    designHeight || 1280
                );
                categorizedDiffs = analysis.categorizedDiffs;
                fixSuggestions = analysis.fixSuggestions;
            } catch {
                // Optional
            }

            // Build enhanced result
            const result: EnhancedVerificationResult = {
                passed: evaluation.passed,
                similarity: compareResult.similarity,
                overallVerdict: evaluation.verdict,
                differences: compareResult.diffRegions,
                diffImageBase64: compareResult.diffImageBase64,
                mockupPath: resolvedPath,
                screenshotSize: {
                    width: screenshotResult.width!,
                    height: screenshotResult.height!
                },
                timestamp: new Date().toISOString(),
                toleranceUsed: tolerance,
                analysis: structuralResult ? {
                    structuralSimilarity: structuralResult.edgeSimilarity,
                    colorConsistency,
                    layoutMatch: structuralResult.ssim
                } : undefined,
                categorizedDiffs,
                fixSuggestions
            };

            // Save report
            const reportPath = this.saveReport(result);

            return {
                success: true,
                data: { ...result, reportPath },
                message: evaluation.verdict
            };
        } catch (error: any) {
            return {
                success: false,
                error: `校验异常: ${error.message}`
            };
        }
    }

    /**
     * Structural comparison using edge detection + SSIM
     */
    private async handleStructuralCompare(args: any): Promise<ToolResponse> {
        const { mockupPath, screenshotBase64, cameraName, width, height, includeEdgeImage } = args;

        if (!mockupPath) {
            return { success: false, error: '缺少 mockupPath 参数' };
        }

        try {
            // Get screenshot if not provided
            let screenshot = screenshotBase64;
            let screenshotWidth = width;
            let screenshotHeight = height;

            if (!screenshot) {
                let captureResult;
                if (width && height) {
                    captureResult = await captureSceneScreenshotWithResolution(width, height, cameraName);
                } else {
                    captureResult = await captureSceneScreenshot(cameraName);
                }

                if (!captureResult.success) {
                    return { success: false, error: `截图失败: ${captureResult.error}` };
                }
                screenshot = captureResult.base64;
                screenshotWidth = captureResult.width;
                screenshotHeight = captureResult.height;
            }

            const resolvedPath = this.resolveMockupPath(mockupPath);
            if (!fs.existsSync(resolvedPath)) {
                return { success: false, error: `效果图不存在: ${resolvedPath}` };
            }

            const result = await compareStructural(
                resolvedPath,
                screenshot!,
                includeEdgeImage || false
            );

            return {
                success: true,
                data: {
                    edgeSimilarity: result.edgeSimilarity,
                    ssim: result.ssim,
                    structuralDiffRegions: result.structuralDiffRegions,
                    edgeImageBase64: result.edgeImageBase64,
                    interpretation: this.interpretStructuralResult(result.edgeSimilarity, result.ssim)
                },
                message: `结构对比完成: 边缘相似度 ${(result.edgeSimilarity * 100).toFixed(1)}%, SSIM ${(result.ssim * 100).toFixed(1)}%`
            };
        } catch (error: any) {
            return {
                success: false,
                error: `结构对比异常: ${error.message}`
            };
        }
    }

    /**
     * Analyze diffs and generate fix suggestions
     */
    private async handleSuggestFixes(args: any): Promise<ToolResponse> {
        const { mockupPath, screenshotBase64, cameraName, width, height, designWidth, designHeight } = args;

        if (!mockupPath) {
            return { success: false, error: '缺少 mockupPath 参数' };
        }

        try {
            // Get screenshot if not provided
            let screenshot = screenshotBase64;
            let imgWidth = width;
            let imgHeight = height;

            if (!screenshot) {
                let captureResult;
                if (width && height) {
                    captureResult = await captureSceneScreenshotWithResolution(width, height, cameraName);
                } else {
                    captureResult = await captureSceneScreenshot(cameraName);
                }

                if (!captureResult.success) {
                    return { success: false, error: `截图失败: ${captureResult.error}` };
                }
                screenshot = captureResult.base64;
                imgWidth = captureResult.width;
                imgHeight = captureResult.height;
            }

            const resolvedPath = this.resolveMockupPath(mockupPath);
            if (!fs.existsSync(resolvedPath)) {
                return { success: false, error: `效果图不存在: ${resolvedPath}` };
            }

            // First do pixel comparison to get diff regions
            const tolerance = this.getTolerance(args);
            const compareResult = await compareImages(resolvedPath, screenshot!, tolerance, false);

            // Then analyze diffs
            const { categorizedDiffs, fixSuggestions } = await analyzeDiffs(
                resolvedPath,
                screenshot!,
                compareResult.diffRegions,
                imgWidth!,
                imgHeight!,
                designWidth || 720,
                designHeight || 1280
            );

            return {
                success: true,
                data: {
                    similarity: compareResult.similarity,
                    categorizedDiffs,
                    fixSuggestions,
                    summary: this.generateDiffSummary(categorizedDiffs, fixSuggestions)
                },
                message: `分析完成: 发现 ${categorizedDiffs.length} 处差异，已生成 ${fixSuggestions.length} 条修复建议`
            };
        } catch (error: any) {
            return {
                success: false,
                error: `差异分析异常: ${error.message}`
            };
        }
    }

    /**
     * Batch verify multiple scenes
     */
    private async handleBatchVerify(args: any): Promise<ToolResponse> {
        const { tasks, maxConcurrent = 3 } = args;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return { success: false, error: '缺少 tasks 参数或任务列表为空' };
        }

        const batchTasks: BatchVerifyTask[] = tasks;
        const results: BatchVerifyResult['details'] = [];

        // Process in batches with limited concurrency
        for (let i = 0; i < batchTasks.length; i += maxConcurrent) {
            const batch = batchTasks.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(async (task) => {
                try {
                    // Open scene if sceneName specified
                    if (task.sceneName) {
                        await Editor.Message.request('scene', 'open-scene', task.sceneName);
                    }

                    // Capture screenshot
                    const screenshotResult = await captureSceneScreenshot(task.cameraName);
                    if (!screenshotResult.success) {
                        return {
                            task,
                            passed: false,
                            similarity: 0,
                            verdict: `截图失败: ${screenshotResult.error}`,
                            error: screenshotResult.error
                        };
                    }

                    // Compare
                    const resolvedPath = this.resolveMockupPath(task.mockupPath);
                    if (!fs.existsSync(resolvedPath)) {
                        return {
                            task,
                            passed: false,
                            similarity: 0,
                            verdict: `效果图不存在: ${resolvedPath}`,
                            error: `效果图不存在: ${resolvedPath}`
                        };
                    }

                    const tolerance = this.getTolerance(args);
                    const compareResult = await compareImages(
                        resolvedPath,
                        screenshotResult.base64!,
                        tolerance,
                        false
                    );
                    const evaluation = evaluateVerification(compareResult, tolerance);

                    return {
                        task,
                        passed: evaluation.passed,
                        similarity: compareResult.similarity,
                        verdict: evaluation.verdict
                    };
                } catch (error: any) {
                    return {
                        task,
                        passed: false,
                        similarity: 0,
                        verdict: `验证异常: ${error.message}`,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);
            for (const r of batchResults) {
                if (r.status === 'fulfilled') {
                    results.push(r.value);
                } else {
                    results.push({
                        task: batchTasks[results.length],
                        passed: false,
                        similarity: 0,
                        verdict: `任务失败: ${r.reason}`,
                        error: String(r.reason)
                    });
                }
            }
        }

        const passed = results.filter(r => r.passed).length;
        const batchResult: BatchVerifyResult = {
            total: results.length,
            passed,
            failed: results.length - passed,
            details: results
        };

        return {
            success: true,
            data: batchResult,
            message: `批量验证完成: ${passed}/${results.length} 通过`
        };
    }

    /**
     * Interpret structural comparison results
     */
    private interpretStructuralResult(edgeSimilarity: number, ssim: number): string {
        const parts: string[] = [];

        if (edgeSimilarity > 0.8) {
            parts.push('边缘结构高度匹配，布局一致性好');
        } else if (edgeSimilarity > 0.5) {
            parts.push('边缘结构基本匹配，存在部分布局差异');
        } else {
            parts.push('边缘结构差异较大，布局可能不一致');
        }

        if (ssim > 0.9) {
            parts.push('SSIM 评分优秀，整体视觉质量高');
        } else if (ssim > 0.7) {
            parts.push('SSIM 评分良好，存在可接受的视觉差异');
        } else {
            parts.push('SSIM 评分偏低，视觉差异明显');
        }

        return parts.join('；');
    }

    /**
     * Generate a summary of diff analysis
     */
    private generateDiffSummary(categorizedDiffs: any[], fixSuggestions: any[]): string {
        const counts: Record<string, number> = {};
        for (const diff of categorizedDiffs) {
            counts[diff.category] = (counts[diff.category] || 0) + 1;
        }

        const parts: string[] = [];
        if (counts.color) parts.push(`${counts.color}处颜色差异`);
        if (counts.position) parts.push(`${counts.position}处位置偏移`);
        if (counts.missing) parts.push(`${counts.missing}处缺失元素`);
        if (counts.extra) parts.push(`${counts.extra}处多余元素`);
        if (counts.size) parts.push(`${counts.size}处尺寸差异`);

        return parts.length > 0 ? `发现：${parts.join('，')}` : '未发现显著差异';
    }

    /**
     * Save verification report to disk
     */
    private saveReport(result: EnhancedVerificationResult): string {
        try {
            const projectRoot = Editor.Project.path;
            const reportDir = path.join(projectRoot, '.omc', 'verification');
            if (!fs.existsSync(reportDir)) {
                fs.mkdirSync(reportDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportFileName = `verification-${timestamp}.json`;
            const reportPath = path.join(reportDir, reportFileName);

            // Don't save base64 data to keep report small
            const reportData = {
                ...result,
                diffImageBase64: undefined,
                screenshotBase64: undefined
            };

            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
            return reportPath;
        } catch {
            return '';
        }
    }

    /**
     * Resolve mockup path (relative to project or absolute)
     */
    private resolveMockupPath(mockupPath: string): string {
        if (path.isAbsolute(mockupPath)) {
            return mockupPath;
        }

        const projectRoot = Editor.Project.path;
        const projectPath = path.join(projectRoot, mockupPath);
        if (fs.existsSync(projectPath)) {
            return projectPath;
        }

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
