import { ToolDefinition, ToolResponse, ToolExecutor, ConsoleMessage, PerformanceStats, ValidationResult, ValidationIssue } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class DebugTools implements ToolExecutor {
    private consoleMessages: ConsoleMessage[] = [];
    private readonly maxMessages = 1000;

    constructor() {
        this.setupConsoleCapture();
    }

    private setupConsoleCapture(): void {
        // Intercept Editor console messages
        // Note: Editor.Message.addBroadcastListener may not be available in all versions
        // This is a placeholder for console capture implementation
        console.log('Console capture setup - implementation depends on Editor API availability');
    }

    private addConsoleMessage(message: any): void {
        this.consoleMessages.push({
            timestamp: new Date().toISOString(),
            ...message
        });

        // Keep only latest messages
        if (this.consoleMessages.length > this.maxMessages) {
            this.consoleMessages.shift();
        }
    }

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'debug_console',
                description: '编辑器控制台操作：获取控制台日志、清空控制台',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_logs', 'clear'],
                            description: '操作类型'
                        },
                        limit: {
                            type: 'number',
                            description: '获取的日志条数（get_logs 时使用）',
                            default: 100
                        },
                        filter: {
                            type: 'string',
                            description: '按类型过滤日志（get_logs 时使用）',
                            enum: ['all', 'log', 'warn', 'error', 'info'],
                            default: 'all'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'debug_logs',
                description: '项目日志操作：获取项目日志文件内容、获取日志文件信息、搜索日志',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_logs', 'get_file_info', 'search'],
                            description: '操作类型'
                        },
                        lines: {
                            type: 'number',
                            description: '读取日志文件末尾的行数（get_logs 时使用）',
                            default: 100,
                            minimum: 1,
                            maximum: 10000
                        },
                        filterKeyword: {
                            type: 'string',
                            description: '按关键词过滤日志（get_logs 时使用）'
                        },
                        logLevel: {
                            type: 'string',
                            description: '按日志级别过滤（get_logs 时使用）',
                            enum: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
                            default: 'ALL'
                        },
                        pattern: {
                            type: 'string',
                            description: '搜索模式，支持正则表达式（search 时使用）'
                        },
                        maxResults: {
                            type: 'number',
                            description: '最大匹配结果数（search 时使用）',
                            default: 20,
                            minimum: 1,
                            maximum: 100
                        },
                        contextLines: {
                            type: 'number',
                            description: '每个匹配结果周围的上下文行数（search 时使用）',
                            default: 2,
                            minimum: 0,
                            maximum: 10
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'debug_system',
                description: '调试系统操作：获取编辑器信息、获取性能统计、验证场景、获取节点树',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_editor_info', 'get_performance', 'validate_scene', 'get_node_tree'],
                            description: '操作类型'
                        },
                        rootUuid: {
                            type: 'string',
                            description: '根节点 UUID（get_node_tree 时使用，不提供则使用场景根节点）'
                        },
                        maxDepth: {
                            type: 'number',
                            description: '最大树深度（get_node_tree 时使用）',
                            default: 10
                        },
                        checkMissingAssets: {
                            type: 'boolean',
                            description: '是否检查缺失的资源引用（validate_scene 时使用）',
                            default: true
                        },
                        checkPerformance: {
                            type: 'boolean',
                            description: '是否检查性能问题（validate_scene 时使用）',
                            default: true
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'execute_script',
                description: 'Execute JavaScript in scene context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        script: {
                            type: 'string',
                            description: 'JavaScript code to execute'
                        }
                    },
                    required: ['script']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'debug_console':
                return await this.handleDebugConsole(args.action, args);
            case 'debug_logs':
                return await this.handleDebugLogs(args.action, args);
            case 'debug_system':
                return await this.handleDebugSystem(args.action, args);
            case 'execute_script':
                return await this.executeScript(args.script);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handleDebugConsole(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_logs': return await this.getConsoleLogs(args.limit, args.filter);
            case 'clear': return await this.clearConsole();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleDebugLogs(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_logs': return await this.getProjectLogs(args.lines, args.filterKeyword, args.logLevel);
            case 'get_file_info': return await this.getLogFileInfo();
            case 'search': return await this.searchProjectLogs(args.pattern, args.maxResults, args.contextLines);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleDebugSystem(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_editor_info': return await this.getEditorInfo();
            case 'get_performance': return await this.getPerformanceStats();
            case 'validate_scene': return await this.validateScene(args);
            case 'get_node_tree': return await this.getNodeTree(args.rootUuid, args.maxDepth);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async getConsoleLogs(limit: number = 100, filter: string = 'all'): Promise<ToolResponse> {
        let logs = this.consoleMessages;
        
        if (filter !== 'all') {
            logs = logs.filter(log => log.type === filter);
        }

        const recentLogs = logs.slice(-limit);
        
        return {
            success: true,
            data: {
                total: logs.length,
                returned: recentLogs.length,
                logs: recentLogs
            }
        };
    }

    private async clearConsole(): Promise<ToolResponse> {
        this.consoleMessages = [];
        
        try {
            // Note: Editor.Message.send may not return a promise in all versions
            Editor.Message.send('console', 'clear');
            return {
                success: true,
                message: 'Console cleared successfully'
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async executeScript(script: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // Cocos Creator 3.8.x: try multiple approaches for JS execution
            // First try execute-scene-script with eval method
            Editor.Message.request('scene', 'execute-scene-script', {
                name: '',
                method: 'eval',
                args: [script]
            }).then((result: any) => {
                resolve({
                    success: true,
                    data: { result }
                });
            }).catch(() => {
                // Fallback: try using 'scene:run-script' message
                Editor.Message.request('scene', 'run-script', { script }).then((result: any) => {
                    resolve({
                        success: true,
                        data: { result }
                    });
                }).catch((err2: Error) => {
                    // Last resort: eval in editor process context
                    try {
                        const fn = new Function(script);
                        const result = fn();
                        resolve({ success: true, data: { result } });
                    } catch (evalErr: any) {
                        resolve({ success: false, error: `Script execution failed: ${evalErr.message}` });
                    }
                });
            });
        });
    }

    private async getNodeTree(rootUuid?: string, maxDepth: number = 10): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const buildTree = async (nodeUuid: string, depth: number = 0): Promise<any> => {
                if (depth >= maxDepth) {
                    return { truncated: true };
                }

                try {
                    const nodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
                    
                    const tree = {
                        uuid: nodeData.uuid,
                        name: nodeData.name,
                        active: nodeData.active,
                        components: (nodeData as any).components ? (nodeData as any).components.map((c: any) => c.__type__) : [],
                        childCount: nodeData.children ? nodeData.children.length : 0,
                        children: [] as any[]
                    };

                    if (nodeData.children && nodeData.children.length > 0) {
                        for (const childId of nodeData.children) {
                            const childTree = await buildTree(childId, depth + 1);
                            tree.children.push(childTree);
                        }
                    }

                    return tree;
                } catch (err: any) {
                    return { error: err.message };
                }
            };

            if (rootUuid) {
                buildTree(rootUuid).then(tree => {
                    resolve({ success: true, data: tree });
                });
            } else {
                // Cocos Creator 3.8.x: use 'query-node-tree' instead of 'query-hierarchy'
                // Build tree directly from query-node-tree response (different format than query-node)
                const buildTreeFromNodeData = (nodeData: any, depth: number = 0, maxD: number = 10): any => {
                    if (depth >= maxD) return { truncated: true };

                    // Extract UUID - may be a string or {value: "..."} object
                    const uuid = typeof nodeData.uuid === 'string' ? nodeData.uuid : nodeData.uuid?.value;
                    // Extract name - may be a string or {value: "..."} object
                    const name = typeof nodeData.name === 'string' ? nodeData.name : nodeData.name?.value;
                    // Extract active - may be a boolean or {value: bool} object
                    const active = typeof nodeData.active === 'boolean' ? nodeData.active : nodeData.active?.value;

                    const tree: any = {
                        uuid,
                        name,
                        active,
                        childCount: 0,
                        children: [] as any[]
                    };

                    // Children may be objects in query-node-tree format or string UUIDs
                    const children = nodeData.children;
                    if (children && Array.isArray(children) && children.length > 0) {
                        tree.childCount = children.length;
                        for (const child of children) {
                            if (typeof child === 'string') {
                                // String UUID - need to query for details
                                tree.children.push({ uuid: child, name: '?', active: true, childCount: 0, children: [] });
                            } else if (child && typeof child === 'object') {
                                // Object in query-node-tree format - recurse
                                const childTree = buildTreeFromNodeData(child, depth + 1, maxD);
                                tree.children.push(childTree);
                            }
                        }
                    }
                    return tree;
                };

                Editor.Message.request('scene', 'query-node-tree').then((hierarchy: any) => {
                    const trees = [];
                    const rootNodes = Array.isArray(hierarchy) ? hierarchy : (hierarchy?.children || []);
                    for (const rootNode of rootNodes) {
                        trees.push(buildTreeFromNodeData(rootNode, 0, maxDepth));
                    }
                    resolve({ success: true, data: trees });
                }).catch((err: Error) => {
                    resolve({ success: false, error: err.message });
                });
            }
        });
    }

    private async getPerformanceStats(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-performance').then((stats: any) => {
                const perfStats: PerformanceStats = {
                    nodeCount: stats.nodeCount || 0,
                    componentCount: stats.componentCount || 0,
                    drawCalls: stats.drawCalls || 0,
                    triangles: stats.triangles || 0,
                    memory: stats.memory || {}
                };
                resolve({ success: true, data: perfStats });
            }).catch(() => {
                // Fallback to basic stats
                resolve({
                    success: true,
                    data: {
                        message: 'Performance stats not available in edit mode'
                    }
                });
            });
        });
    }

    private async validateScene(options: any): Promise<ToolResponse> {
        const issues: ValidationIssue[] = [];

        try {
            // Check for missing assets
            if (options.checkMissingAssets) {
                const assetCheck = await Editor.Message.request('scene', 'check-missing-assets');
                if (assetCheck && assetCheck.missing) {
                    issues.push({
                        type: 'error',
                        category: 'assets',
                        message: `Found ${assetCheck.missing.length} missing asset references`,
                        details: assetCheck.missing
                    });
                }
            }

            // Check for performance issues
            if (options.checkPerformance) {
                const hierarchy = await Editor.Message.request('scene', 'query-node-tree');
                const rootNodes = (hierarchy as any)?.children || hierarchy || [];
                const nodeCount = this.countNodes(rootNodes);
                
                if (nodeCount > 1000) {
                    issues.push({
                        type: 'warning',
                        category: 'performance',
                        message: `High node count: ${nodeCount} nodes (recommended < 1000)`,
                        suggestion: 'Consider using object pooling or scene optimization'
                    });
                }
            }

            const result: ValidationResult = {
                valid: issues.length === 0,
                issueCount: issues.length,
                issues: issues
            };

            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private countNodes(nodes: any[]): number {
        let count = nodes.length;
        for (const node of nodes) {
            if (node.children) {
                count += this.countNodes(node.children);
            }
        }
        return count;
    }

    private async getEditorInfo(): Promise<ToolResponse> {
        const info = {
            editor: {
                version: (Editor as any).versions?.editor || 'Unknown',
                cocosVersion: (Editor as any).versions?.cocos || 'Unknown',
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version
            },
            project: {
                name: Editor.Project.name,
                path: Editor.Project.path,
                uuid: Editor.Project.uuid
            },
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        return { success: true, data: info };
    }

    private async getProjectLogs(lines: number = 100, filterKeyword?: string, logLevel: string = 'ALL'): Promise<ToolResponse> {
        try {
            // Try multiple possible project paths
            let logFilePath = '';
            const possiblePaths = [
                Editor.Project ? Editor.Project.path : null,
                '/Users/lizhiyong/NewProject_3',
                process.cwd(),
            ].filter(p => p !== null);
            
            for (const basePath of possiblePaths) {
                const testPath = path.join(basePath, 'temp/logs/project.log');
                if (fs.existsSync(testPath)) {
                    logFilePath = testPath;
                    break;
                }
            }
            
            if (!logFilePath) {
                return {
                    success: false,
                    error: `Project log file not found. Tried paths: ${possiblePaths.map(p => path.join(p, 'temp/logs/project.log')).join(', ')}`
                };
            }

            // Read the file content
            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const logLines = logContent.split('\n').filter(line => line.trim() !== '');
            
            // Get the last N lines
            const recentLines = logLines.slice(-lines);
            
            // Apply filters
            let filteredLines = recentLines;
            
            // Filter by log level if not 'ALL'
            if (logLevel !== 'ALL') {
                filteredLines = filteredLines.filter(line => 
                    line.includes(`[${logLevel}]`) || line.includes(logLevel.toLowerCase())
                );
            }
            
            // Filter by keyword if provided
            if (filterKeyword) {
                filteredLines = filteredLines.filter(line => 
                    line.toLowerCase().includes(filterKeyword.toLowerCase())
                );
            }
            
            return {
                success: true,
                data: {
                    totalLines: logLines.length,
                    requestedLines: lines,
                    filteredLines: filteredLines.length,
                    logLevel: logLevel,
                    filterKeyword: filterKeyword || null,
                    logs: filteredLines,
                    logFilePath: logFilePath
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to read project logs: ${error.message}`
            };
        }
    }

    private async getLogFileInfo(): Promise<ToolResponse> {
        try {
            // Try multiple possible project paths
            let logFilePath = '';
            const possiblePaths = [
                Editor.Project ? Editor.Project.path : null,
                '/Users/lizhiyong/NewProject_3',
                process.cwd(),
            ].filter(p => p !== null);
            
            for (const basePath of possiblePaths) {
                const testPath = path.join(basePath, 'temp/logs/project.log');
                if (fs.existsSync(testPath)) {
                    logFilePath = testPath;
                    break;
                }
            }
            
            if (!logFilePath) {
                return {
                    success: false,
                    error: `Project log file not found. Tried paths: ${possiblePaths.map(p => path.join(p, 'temp/logs/project.log')).join(', ')}`
                };
            }

            const stats = fs.statSync(logFilePath);
            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const lineCount = logContent.split('\n').filter(line => line.trim() !== '').length;
            
            return {
                success: true,
                data: {
                    filePath: logFilePath,
                    fileSize: stats.size,
                    fileSizeFormatted: this.formatFileSize(stats.size),
                    lastModified: stats.mtime.toISOString(),
                    lineCount: lineCount,
                    created: stats.birthtime.toISOString(),
                    accessible: fs.constants.R_OK
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to get log file info: ${error.message}`
            };
        }
    }

    private async searchProjectLogs(pattern: string, maxResults: number = 20, contextLines: number = 2): Promise<ToolResponse> {
        try {
            // Try multiple possible project paths
            let logFilePath = '';
            const possiblePaths = [
                Editor.Project ? Editor.Project.path : null,
                '/Users/lizhiyong/NewProject_3',
                process.cwd(),
            ].filter(p => p !== null);
            
            for (const basePath of possiblePaths) {
                const testPath = path.join(basePath, 'temp/logs/project.log');
                if (fs.existsSync(testPath)) {
                    logFilePath = testPath;
                    break;
                }
            }
            
            if (!logFilePath) {
                return {
                    success: false,
                    error: `Project log file not found. Tried paths: ${possiblePaths.map(p => path.join(p, 'temp/logs/project.log')).join(', ')}`
                };
            }

            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const logLines = logContent.split('\n');
            
            // Create regex pattern (support both string and regex patterns)
            let regex: RegExp;
            try {
                regex = new RegExp(pattern, 'gi');
            } catch {
                // If pattern is not valid regex, treat as literal string
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            }
            
            const matches: any[] = [];
            let resultCount = 0;
            
            for (let i = 0; i < logLines.length && resultCount < maxResults; i++) {
                const line = logLines[i];
                if (regex.test(line)) {
                    // Get context lines
                    const contextStart = Math.max(0, i - contextLines);
                    const contextEnd = Math.min(logLines.length - 1, i + contextLines);
                    
                    const contextLinesArray = [];
                    for (let j = contextStart; j <= contextEnd; j++) {
                        contextLinesArray.push({
                            lineNumber: j + 1,
                            content: logLines[j],
                            isMatch: j === i
                        });
                    }
                    
                    matches.push({
                        lineNumber: i + 1,
                        matchedLine: line,
                        context: contextLinesArray
                    });
                    
                    resultCount++;
                    
                    // Reset regex lastIndex for global search
                    regex.lastIndex = 0;
                }
            }
            
            return {
                success: true,
                data: {
                    pattern: pattern,
                    totalMatches: matches.length,
                    maxResults: maxResults,
                    contextLines: contextLines,
                    logFilePath: logFilePath,
                    matches: matches
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to search project logs: ${error.message}`
            };
        }
    }

    private formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}