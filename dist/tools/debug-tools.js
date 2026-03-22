"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugTools = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DebugTools {
    constructor() {
        this.consoleMessages = [];
        this.maxMessages = 1000;
        this.setupConsoleCapture();
    }
    setupConsoleCapture() {
        // Override console methods to capture messages
        const self = this;
        const origLog = console.log;
        const origWarn = console.warn;
        const origError = console.error;
        const origInfo = console.info;
        console.log = (...args) => {
            origLog.apply(console, args);
            self.addConsoleMessage({ type: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        console.warn = (...args) => {
            origWarn.apply(console, args);
            self.addConsoleMessage({ type: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        console.error = (...args) => {
            origError.apply(console, args);
            self.addConsoleMessage({ type: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        console.info = (...args) => {
            origInfo.apply(console, args);
            self.addConsoleMessage({ type: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        };
        origLog('Console capture setup complete');
    }
    addConsoleMessage(message) {
        this.consoleMessages.push(Object.assign({ timestamp: new Date().toISOString() }, message));
        // Keep only latest messages
        if (this.consoleMessages.length > this.maxMessages) {
            this.consoleMessages.shift();
        }
    }
    getTools() {
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
    async execute(toolName, args) {
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
    async handleDebugConsole(action, args) {
        switch (action) {
            case 'get_logs': return await this.getConsoleLogs(args.limit, args.filter);
            case 'clear': return await this.clearConsole();
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handleDebugLogs(action, args) {
        switch (action) {
            case 'get_logs': return await this.getProjectLogs(args.lines, args.filterKeyword, args.logLevel);
            case 'get_file_info': return await this.getLogFileInfo();
            case 'search': return await this.searchProjectLogs(args.pattern, args.maxResults, args.contextLines);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handleDebugSystem(action, args) {
        switch (action) {
            case 'get_editor_info': return await this.getEditorInfo();
            case 'get_performance': return await this.getPerformanceStats();
            case 'validate_scene': return await this.validateScene(args);
            case 'get_node_tree': return await this.getNodeTree(args.rootUuid, args.maxDepth);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async getConsoleLogs(limit = 100, filter = 'all') {
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
    async clearConsole() {
        this.consoleMessages = [];
        try {
            // Note: Editor.Message.send may not return a promise in all versions
            Editor.Message.send('console', 'clear');
            return {
                success: true,
                message: 'Console cleared successfully'
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async executeScript(script) {
        return new Promise((resolve) => {
            // Cocos Creator 3.8.x: try multiple approaches for JS execution
            // First try execute-scene-script with eval method
            Editor.Message.request('scene', 'execute-scene-script', {
                name: '',
                method: 'eval',
                args: [script]
            }).then((result) => {
                resolve({
                    success: true,
                    data: { result }
                });
            }).catch(() => {
                // Fallback: try using 'scene:run-script' message
                Editor.Message.request('scene', 'run-script', { script }).then((result) => {
                    resolve({
                        success: true,
                        data: { result }
                    });
                }).catch((err2) => {
                    // Last resort: eval in editor process context
                    try {
                        const fn = new Function(script);
                        const result = fn();
                        resolve({ success: true, data: { result } });
                    }
                    catch (evalErr) {
                        resolve({ success: false, error: `Script execution failed: ${evalErr.message}` });
                    }
                });
            });
        });
    }
    async getNodeTree(rootUuid, maxDepth = 10) {
        return new Promise((resolve) => {
            const buildTree = async (nodeUuid, depth = 0) => {
                if (depth >= maxDepth) {
                    return { truncated: true };
                }
                try {
                    const nodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
                    const tree = {
                        uuid: nodeData.uuid,
                        name: nodeData.name,
                        active: nodeData.active,
                        components: nodeData.components ? nodeData.components.map((c) => c.__type__) : [],
                        childCount: nodeData.children ? nodeData.children.length : 0,
                        children: []
                    };
                    if (nodeData.children && nodeData.children.length > 0) {
                        for (const childId of nodeData.children) {
                            const childTree = await buildTree(childId, depth + 1);
                            tree.children.push(childTree);
                        }
                    }
                    return tree;
                }
                catch (err) {
                    return { error: err.message };
                }
            };
            if (rootUuid) {
                buildTree(rootUuid).then(tree => {
                    resolve({ success: true, data: tree });
                });
            }
            else {
                // Cocos Creator 3.8.x: use 'query-node-tree' instead of 'query-hierarchy'
                // Build tree directly from query-node-tree response (different format than query-node)
                const buildTreeFromNodeData = (nodeData, depth = 0, maxD = 10) => {
                    var _a, _b, _c;
                    if (depth >= maxD)
                        return { truncated: true };
                    // Extract UUID - may be a string or {value: "..."} object
                    const uuid = typeof nodeData.uuid === 'string' ? nodeData.uuid : (_a = nodeData.uuid) === null || _a === void 0 ? void 0 : _a.value;
                    // Extract name - may be a string or {value: "..."} object
                    const name = typeof nodeData.name === 'string' ? nodeData.name : (_b = nodeData.name) === null || _b === void 0 ? void 0 : _b.value;
                    // Extract active - may be a boolean or {value: bool} object
                    const active = typeof nodeData.active === 'boolean' ? nodeData.active : (_c = nodeData.active) === null || _c === void 0 ? void 0 : _c.value;
                    const tree = {
                        uuid,
                        name,
                        active,
                        childCount: 0,
                        children: []
                    };
                    // Children may be objects in query-node-tree format or string UUIDs
                    const children = nodeData.children;
                    if (children && Array.isArray(children) && children.length > 0) {
                        tree.childCount = children.length;
                        for (const child of children) {
                            if (typeof child === 'string') {
                                // String UUID - need to query for details
                                tree.children.push({ uuid: child, name: '?', active: true, childCount: 0, children: [] });
                            }
                            else if (child && typeof child === 'object') {
                                // Object in query-node-tree format - recurse
                                const childTree = buildTreeFromNodeData(child, depth + 1, maxD);
                                tree.children.push(childTree);
                            }
                        }
                    }
                    return tree;
                };
                Editor.Message.request('scene', 'query-node-tree').then((hierarchy) => {
                    const trees = [];
                    const rootNodes = Array.isArray(hierarchy) ? hierarchy : ((hierarchy === null || hierarchy === void 0 ? void 0 : hierarchy.children) || []);
                    for (const rootNode of rootNodes) {
                        trees.push(buildTreeFromNodeData(rootNode, 0, maxDepth));
                    }
                    resolve({ success: true, data: trees });
                }).catch((err) => {
                    resolve({ success: false, error: err.message });
                });
            }
        });
    }
    async getPerformanceStats() {
        return new Promise((resolve) => {
            Editor.Message.request('scene', 'query-performance').then((stats) => {
                const perfStats = {
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
    async validateScene(options) {
        const issues = [];
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
                const rootNodes = (hierarchy === null || hierarchy === void 0 ? void 0 : hierarchy.children) || hierarchy || [];
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
            const result = {
                valid: issues.length === 0,
                issueCount: issues.length,
                issues: issues
            };
            return { success: true, data: result };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    countNodes(nodes) {
        let count = nodes.length;
        for (const node of nodes) {
            if (node.children) {
                count += this.countNodes(node.children);
            }
        }
        return count;
    }
    async getEditorInfo() {
        var _a, _b;
        const info = {
            editor: {
                version: ((_a = Editor.versions) === null || _a === void 0 ? void 0 : _a.editor) || 'Unknown',
                cocosVersion: ((_b = Editor.versions) === null || _b === void 0 ? void 0 : _b.cocos) || 'Unknown',
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
    async getProjectLogs(lines = 100, filterKeyword, logLevel = 'ALL') {
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
                filteredLines = filteredLines.filter(line => line.includes(`[${logLevel}]`) || line.includes(logLevel.toLowerCase()));
            }
            // Filter by keyword if provided
            if (filterKeyword) {
                filteredLines = filteredLines.filter(line => line.toLowerCase().includes(filterKeyword.toLowerCase()));
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
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to read project logs: ${error.message}`
            };
        }
    }
    async getLogFileInfo() {
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
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get log file info: ${error.message}`
            };
        }
    }
    async searchProjectLogs(pattern, maxResults = 20, contextLines = 2) {
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
            let regex;
            try {
                regex = new RegExp(pattern, 'gi');
            }
            catch (_a) {
                // If pattern is not valid regex, treat as literal string
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            }
            const matches = [];
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
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to search project logs: ${error.message}`
            };
        }
    }
    formatFileSize(bytes) {
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
exports.DebugTools = DebugTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWctdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvZGVidWctdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFhLFVBQVU7SUFJbkI7UUFIUSxvQkFBZSxHQUFxQixFQUFFLENBQUM7UUFDOUIsZ0JBQVcsR0FBRyxJQUFJLENBQUM7UUFHaEMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVPLG1CQUFtQjtRQUN2QiwrQ0FBK0M7UUFDL0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDNUIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUM5QixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ2hDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFFOUIsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBVyxFQUFFLEVBQUU7WUFDN0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNySSxDQUFDLENBQUM7UUFDRixPQUFP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SUFDcEQsQ0FBQztDQUNKO0FBcnJCRCxnQ0FxckJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yLCBDb25zb2xlTWVzc2FnZSwgUGVyZm9ybWFuY2VTdGF0cywgVmFsaWRhdGlvblJlc3VsdCwgVmFsaWRhdGlvbklzc3VlIH0gZnJvbSAnLi4vdHlwZXMnO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgY2xhc3MgRGVidWdUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XHJcbiAgICBwcml2YXRlIGNvbnNvbGVNZXNzYWdlczogQ29uc29sZU1lc3NhZ2VbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBtYXhNZXNzYWdlcyA9IDEwMDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5zZXR1cENvbnNvbGVDYXB0dXJlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cENvbnNvbGVDYXB0dXJlKCk6IHZvaWQge1xyXG4gICAgICAgIC8vIE92ZXJyaWRlIGNvbnNvbGUgbWV0aG9kcyB0byBjYXB0dXJlIG1lc3NhZ2VzXHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3Qgb3JpZ0xvZyA9IGNvbnNvbGUubG9nO1xyXG4gICAgICAgIGNvbnN0IG9yaWdXYXJuID0gY29uc29sZS53YXJuO1xyXG4gICAgICAgIGNvbnN0IG9yaWdFcnJvciA9IGNvbnNvbGUuZXJyb3I7XHJcbiAgICAgICAgY29uc3Qgb3JpZ0luZm8gPSBjb25zb2xlLmluZm87XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nID0gKC4uLmFyZ3M6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgIG9yaWdMb2cuYXBwbHkoY29uc29sZSwgYXJncyk7XHJcbiAgICAgICAgICAgIHNlbGYuYWRkQ29uc29sZU1lc3NhZ2UoeyB0eXBlOiAnbG9nJywgbWVzc2FnZTogYXJncy5tYXAoYSA9PiB0eXBlb2YgYSA9PT0gJ29iamVjdCcgPyBKU09OLnN0cmluZ2lmeShhKSA6IFN0cmluZyhhKSkuam9pbignICcpIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc29sZS53YXJuID0gKC4uLmFyZ3M6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgIG9yaWdXYXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xyXG4gICAgICAgICAgICBzZWxmLmFkZENvbnNvbGVNZXNzYWdlKHsgdHlwZTogJ3dhcm4nLCBtZXNzYWdlOiBhcmdzLm1hcChhID0+IHR5cGVvZiBhID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KGEpIDogU3RyaW5nKGEpKS5qb2luKCcgJykgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zb2xlLmVycm9yID0gKC4uLmFyZ3M6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgICAgIG9yaWdFcnJvci5hcHBseShjb25zb2xlLCBhcmdzKTtcclxuICAgICAgICAgICAgc2VsZi5hZGRDb25zb2xlTWVzc2FnZSh7IHR5cGU6ICdlcnJvcicsIG1lc3NhZ2U6IGFyZ3MubWFwKGEgPT4gdHlwZW9mIGEgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYSkgOiBTdHJpbmcoYSkpLmpvaW4oJyAnKSB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnNvbGUuaW5mbyA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgICAgICBvcmlnSW5mby5hcHBseShjb25zb2xlLCBhcmdzKTtcclxuICAgICAgICAgICAgc2VsZi5hZGRDb25zb2xlTWVzc2FnZSh7IHR5cGU6ICdpbmZvJywgbWVzc2FnZTogYXJncy5tYXAoYSA9PiB0eXBlb2YgYSA9PT0gJ29iamVjdCcgPyBKU09OLnN0cmluZ2lmeShhKSA6IFN0cmluZyhhKSkuam9pbignICcpIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIG9yaWdMb2coJ0NvbnNvbGUgY2FwdHVyZSBzZXR1cCBjb21wbGV0ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYWRkQ29uc29sZU1lc3NhZ2UobWVzc2FnZTogYW55KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb25zb2xlTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAuLi5tZXNzYWdlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEtlZXAgb25seSBsYXRlc3QgbWVzc2FnZXNcclxuICAgICAgICBpZiAodGhpcy5jb25zb2xlTWVzc2FnZXMubGVuZ3RoID4gdGhpcy5tYXhNZXNzYWdlcykge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnNvbGVNZXNzYWdlcy5zaGlmdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZGVidWdfY29uc29sZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+e8lui+keWZqOaOp+WItuWPsOaTjeS9nO+8muiOt+WPluaOp+WItuWPsOaXpeW/l+OAgea4heepuuaOp+WItuWPsCcsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZ2V0X2xvZ3MnLCAnY2xlYXInXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pON5L2c57G75Z6LJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW1pdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+iOt+WPlueahOaXpeW/l+adoeaVsO+8iGdldF9sb2dzIOaXtuS9v+eUqO+8iScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAxMDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5oyJ57G75Z6L6L+H5ruk5pel5b+X77yIZ2V0X2xvZ3Mg5pe25L2/55So77yJJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYWxsJywgJ2xvZycsICd3YXJuJywgJ2Vycm9yJywgJ2luZm8nXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdhbGwnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdkZWJ1Z19sb2dzJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6aG555uu5pel5b+X5pON5L2c77ya6I635Y+W6aG555uu5pel5b+X5paH5Lu25YaF5a6544CB6I635Y+W5pel5b+X5paH5Lu25L+h5oGv44CB5pCc57Si5pel5b+XJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydnZXRfbG9ncycsICdnZXRfZmlsZV9pbmZvJywgJ3NlYXJjaCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmk43kvZznsbvlnosnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6K+75Y+W5pel5b+X5paH5Lu25pyr5bC+55qE6KGM5pWw77yIZ2V0X2xvZ3Mg5pe25L2/55So77yJJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDEwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW06IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiAxMDAwMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJLZXl3b3JkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5oyJ5YWz6ZSu6K+N6L+H5ruk5pel5b+X77yIZ2V0X2xvZ3Mg5pe25L2/55So77yJJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dMZXZlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aMieaXpeW/l+e6p+WIq+i/h+a7pO+8iGdldF9sb2dzIOaXtuS9v+eUqO+8iScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ0VSUk9SJywgJ1dBUk4nLCAnSU5GTycsICdERUJVRycsICdUUkFDRScsICdBTEwnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdBTEwnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmkJzntKLmqKHlvI/vvIzmlK/mjIHmraPliJnooajovr7lvI/vvIhzZWFyY2gg5pe25L2/55So77yJJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhSZXN1bHRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pyA5aSn5Yy56YWN57uT5p6c5pWw77yIc2VhcmNoIOaXtuS9v+eUqO+8iScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAyMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW06IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiAxMDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dExpbmVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5q+P5Liq5Yy56YWN57uT5p6c5ZGo5Zu055qE5LiK5LiL5paH6KGM5pWw77yIc2VhcmNoIOaXtuS9v+eUqO+8iScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW06IDEwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdkZWJ1Z19zeXN0ZW0nLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfosIPor5Xns7vnu5/mk43kvZzvvJrojrflj5bnvJbovpHlmajkv6Hmga/jgIHojrflj5bmgKfog73nu5/orqHjgIHpqozor4HlnLrmma/jgIHojrflj5boioLngrnmoJEnLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2dldF9lZGl0b3JfaW5mbycsICdnZXRfcGVyZm9ybWFuY2UnLCAndmFsaWRhdGVfc2NlbmUnLCAnZ2V0X25vZGVfdHJlZSddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmk43kvZznsbvlnosnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RVdWlkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5qC56IqC54K5IFVVSUTvvIhnZXRfbm9kZV90cmVlIOaXtuS9v+eUqO+8jOS4jeaPkOS+m+WImeS9v+eUqOWcuuaZr+agueiKgueCue+8iSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4RGVwdGg6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmnIDlpKfmoJHmt7HluqbvvIhnZXRfbm9kZV90cmVlIOaXtuS9v+eUqO+8iScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAxMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja01pc3NpbmdBc3NldHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5piv5ZCm5qOA5p+l57y65aSx55qE6LWE5rqQ5byV55So77yIdmFsaWRhdGVfc2NlbmUg5pe25L2/55So77yJJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQZXJmb3JtYW5jZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmmK/lkKbmo4Dmn6XmgKfog73pl67popjvvIh2YWxpZGF0ZV9zY2VuZSDml7bkvb/nlKjvvIknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZXhlY3V0ZV9zY3JpcHQnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGVjdXRlIEphdmFTY3JpcHQgaW4gc2NlbmUgY29udGV4dCcsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSmF2YVNjcmlwdCBjb2RlIHRvIGV4ZWN1dGUnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NjcmlwdCddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2RlYnVnX2NvbnNvbGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlRGVidWdDb25zb2xlKGFyZ3MuYWN0aW9uLCBhcmdzKTtcclxuICAgICAgICAgICAgY2FzZSAnZGVidWdfbG9ncyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVEZWJ1Z0xvZ3MoYXJncy5hY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICBjYXNlICdkZWJ1Z19zeXN0ZW0nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlRGVidWdTeXN0ZW0oYXJncy5hY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICBjYXNlICdleGVjdXRlX3NjcmlwdCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjdXRlU2NyaXB0KGFyZ3Muc2NyaXB0KTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZURlYnVnQ29uc29sZShhY3Rpb246IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfbG9ncyc6IHJldHVybiBhd2FpdCB0aGlzLmdldENvbnNvbGVMb2dzKGFyZ3MubGltaXQsIGFyZ3MuZmlsdGVyKTtcclxuICAgICAgICAgICAgY2FzZSAnY2xlYXInOiByZXR1cm4gYXdhaXQgdGhpcy5jbGVhckNvbnNvbGUoKTtcclxuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBhY3Rpb246ICR7YWN0aW9ufWAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVEZWJ1Z0xvZ3MoYWN0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0X2xvZ3MnOiByZXR1cm4gYXdhaXQgdGhpcy5nZXRQcm9qZWN0TG9ncyhhcmdzLmxpbmVzLCBhcmdzLmZpbHRlcktleXdvcmQsIGFyZ3MubG9nTGV2ZWwpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfZmlsZV9pbmZvJzogcmV0dXJuIGF3YWl0IHRoaXMuZ2V0TG9nRmlsZUluZm8oKTtcclxuICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzogcmV0dXJuIGF3YWl0IHRoaXMuc2VhcmNoUHJvamVjdExvZ3MoYXJncy5wYXR0ZXJuLCBhcmdzLm1heFJlc3VsdHMsIGFyZ3MuY29udGV4dExpbmVzKTtcclxuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBhY3Rpb246ICR7YWN0aW9ufWAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVEZWJ1Z1N5c3RlbShhY3Rpb246IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfZWRpdG9yX2luZm8nOiByZXR1cm4gYXdhaXQgdGhpcy5nZXRFZGl0b3JJbmZvKCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldF9wZXJmb3JtYW5jZSc6IHJldHVybiBhd2FpdCB0aGlzLmdldFBlcmZvcm1hbmNlU3RhdHMoKTtcclxuICAgICAgICAgICAgY2FzZSAndmFsaWRhdGVfc2NlbmUnOiByZXR1cm4gYXdhaXQgdGhpcy52YWxpZGF0ZVNjZW5lKGFyZ3MpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfbm9kZV90cmVlJzogcmV0dXJuIGF3YWl0IHRoaXMuZ2V0Tm9kZVRyZWUoYXJncy5yb290VXVpZCwgYXJncy5tYXhEZXB0aCk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYWN0aW9uOiAke2FjdGlvbn1gIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0Q29uc29sZUxvZ3MobGltaXQ6IG51bWJlciA9IDEwMCwgZmlsdGVyOiBzdHJpbmcgPSAnYWxsJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgbGV0IGxvZ3MgPSB0aGlzLmNvbnNvbGVNZXNzYWdlcztcclxuICAgICAgICBcclxuICAgICAgICBpZiAoZmlsdGVyICE9PSAnYWxsJykge1xyXG4gICAgICAgICAgICBsb2dzID0gbG9ncy5maWx0ZXIobG9nID0+IGxvZy50eXBlID09PSBmaWx0ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVjZW50TG9ncyA9IGxvZ3Muc2xpY2UoLWxpbWl0KTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbDogbG9ncy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICByZXR1cm5lZDogcmVjZW50TG9ncy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBsb2dzOiByZWNlbnRMb2dzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgY2xlYXJDb25zb2xlKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgdGhpcy5jb25zb2xlTWVzc2FnZXMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBOb3RlOiBFZGl0b3IuTWVzc2FnZS5zZW5kIG1heSBub3QgcmV0dXJuIGEgcHJvbWlzZSBpbiBhbGwgdmVyc2lvbnNcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnY29uc29sZScsICdjbGVhcicpO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdDb25zb2xlIGNsZWFyZWQgc3VjY2Vzc2Z1bGx5J1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlU2NyaXB0KHNjcmlwdDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgLy8gQ29jb3MgQ3JlYXRvciAzLjgueDogdHJ5IG11bHRpcGxlIGFwcHJvYWNoZXMgZm9yIEpTIGV4ZWN1dGlvblxyXG4gICAgICAgICAgICAvLyBGaXJzdCB0cnkgZXhlY3V0ZS1zY2VuZS1zY3JpcHQgd2l0aCBldmFsIG1ldGhvZFxyXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnZXZhbCcsXHJcbiAgICAgICAgICAgICAgICBhcmdzOiBbc2NyaXB0XVxyXG4gICAgICAgICAgICB9KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHJlc3VsdCB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gRmFsbGJhY2s6IHRyeSB1c2luZyAnc2NlbmU6cnVuLXNjcmlwdCcgbWVzc2FnZVxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncnVuLXNjcmlwdCcsIHsgc2NyaXB0IH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgcmVzdWx0IH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExhc3QgcmVzb3J0OiBldmFsIGluIGVkaXRvciBwcm9jZXNzIGNvbnRleHRcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9IG5ldyBGdW5jdGlvbihzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogeyByZXN1bHQgfSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChldmFsRXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFNjcmlwdCBleGVjdXRpb24gZmFpbGVkOiAke2V2YWxFcnIubWVzc2FnZX1gIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldE5vZGVUcmVlKHJvb3RVdWlkPzogc3RyaW5nLCBtYXhEZXB0aDogbnVtYmVyID0gMTApOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBidWlsZFRyZWUgPSBhc3luYyAobm9kZVV1aWQ6IHN0cmluZywgZGVwdGg6IG51bWJlciA9IDApOiBQcm9taXNlPGFueT4gPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlcHRoID49IG1heERlcHRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHJ1bmNhdGVkOiB0cnVlIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBub2RlRGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJlZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZURhdGEudXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogbm9kZURhdGEubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBub2RlRGF0YS5hY3RpdmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IChub2RlRGF0YSBhcyBhbnkpLmNvbXBvbmVudHMgPyAobm9kZURhdGEgYXMgYW55KS5jb21wb25lbnRzLm1hcCgoYzogYW55KSA9PiBjLl9fdHlwZV9fKSA6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvdW50OiBub2RlRGF0YS5jaGlsZHJlbiA/IG5vZGVEYXRhLmNoaWxkcmVuLmxlbmd0aCA6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXSBhcyBhbnlbXVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlRGF0YS5jaGlsZHJlbiAmJiBub2RlRGF0YS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGRJZCBvZiBub2RlRGF0YS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRUcmVlID0gYXdhaXQgYnVpbGRUcmVlKGNoaWxkSWQsIGRlcHRoICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmVlLmNoaWxkcmVuLnB1c2goY2hpbGRUcmVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyZWU7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHJvb3RVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICBidWlsZFRyZWUocm9vdFV1aWQpLnRoZW4odHJlZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHRyZWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIENvY29zIENyZWF0b3IgMy44Lng6IHVzZSAncXVlcnktbm9kZS10cmVlJyBpbnN0ZWFkIG9mICdxdWVyeS1oaWVyYXJjaHknXHJcbiAgICAgICAgICAgICAgICAvLyBCdWlsZCB0cmVlIGRpcmVjdGx5IGZyb20gcXVlcnktbm9kZS10cmVlIHJlc3BvbnNlIChkaWZmZXJlbnQgZm9ybWF0IHRoYW4gcXVlcnktbm9kZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1aWxkVHJlZUZyb21Ob2RlRGF0YSA9IChub2RlRGF0YTogYW55LCBkZXB0aDogbnVtYmVyID0gMCwgbWF4RDogbnVtYmVyID0gMTApOiBhbnkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXB0aCA+PSBtYXhEKSByZXR1cm4geyB0cnVuY2F0ZWQ6IHRydWUgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBVVUlEIC0gbWF5IGJlIGEgc3RyaW5nIG9yIHt2YWx1ZTogXCIuLi5cIn0gb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHR5cGVvZiBub2RlRGF0YS51dWlkID09PSAnc3RyaW5nJyA/IG5vZGVEYXRhLnV1aWQgOiBub2RlRGF0YS51dWlkPy52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IG5hbWUgLSBtYXkgYmUgYSBzdHJpbmcgb3Ige3ZhbHVlOiBcIi4uLlwifSBvYmplY3RcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdHlwZW9mIG5vZGVEYXRhLm5hbWUgPT09ICdzdHJpbmcnID8gbm9kZURhdGEubmFtZSA6IG5vZGVEYXRhLm5hbWU/LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgYWN0aXZlIC0gbWF5IGJlIGEgYm9vbGVhbiBvciB7dmFsdWU6IGJvb2x9IG9iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZSA9IHR5cGVvZiBub2RlRGF0YS5hY3RpdmUgPT09ICdib29sZWFuJyA/IG5vZGVEYXRhLmFjdGl2ZSA6IG5vZGVEYXRhLmFjdGl2ZT8udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyZWU6IGFueSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZENvdW50OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10gYXMgYW55W11cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBtYXkgYmUgb2JqZWN0cyBpbiBxdWVyeS1ub2RlLXRyZWUgZm9ybWF0IG9yIHN0cmluZyBVVUlEc1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gbm9kZURhdGEuY2hpbGRyZW47XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkcmVuICYmIEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pICYmIGNoaWxkcmVuLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJlZS5jaGlsZENvdW50ID0gY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0cmluZyBVVUlEIC0gbmVlZCB0byBxdWVyeSBmb3IgZGV0YWlsc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuY2hpbGRyZW4ucHVzaCh7IHV1aWQ6IGNoaWxkLCBuYW1lOiAnPycsIGFjdGl2ZTogdHJ1ZSwgY2hpbGRDb3VudDogMCwgY2hpbGRyZW46IFtdIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZCAmJiB0eXBlb2YgY2hpbGQgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2JqZWN0IGluIHF1ZXJ5LW5vZGUtdHJlZSBmb3JtYXQgLSByZWN1cnNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRUcmVlID0gYnVpbGRUcmVlRnJvbU5vZGVEYXRhKGNoaWxkLCBkZXB0aCArIDEsIG1heEQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyZWUuY2hpbGRyZW4ucHVzaChjaGlsZFRyZWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmVlO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKS50aGVuKChoaWVyYXJjaHk6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyZWVzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm9vdE5vZGVzID0gQXJyYXkuaXNBcnJheShoaWVyYXJjaHkpID8gaGllcmFyY2h5IDogKGhpZXJhcmNoeT8uY2hpbGRyZW4gfHwgW10pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgcm9vdE5vZGUgb2Ygcm9vdE5vZGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVzLnB1c2goYnVpbGRUcmVlRnJvbU5vZGVEYXRhKHJvb3ROb2RlLCAwLCBtYXhEZXB0aCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogdHJlZXMgfSk7XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFBlcmZvcm1hbmNlU3RhdHMoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktcGVyZm9ybWFuY2UnKS50aGVuKChzdGF0czogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJmU3RhdHM6IFBlcmZvcm1hbmNlU3RhdHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZUNvdW50OiBzdGF0cy5ub2RlQ291bnQgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRDb3VudDogc3RhdHMuY29tcG9uZW50Q291bnQgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICBkcmF3Q2FsbHM6IHN0YXRzLmRyYXdDYWxscyB8fCAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRyaWFuZ2xlczogc3RhdHMudHJpYW5nbGVzIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVtb3J5OiBzdGF0cy5tZW1vcnkgfHwge31cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcGVyZlN0YXRzIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayB0byBiYXNpYyBzdGF0c1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdQZXJmb3JtYW5jZSBzdGF0cyBub3QgYXZhaWxhYmxlIGluIGVkaXQgbW9kZSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVNjZW5lKG9wdGlvbnM6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgY29uc3QgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXSA9IFtdO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgbWlzc2luZyBhc3NldHNcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2hlY2tNaXNzaW5nQXNzZXRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldENoZWNrID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY2hlY2stbWlzc2luZy1hc3NldHMnKTtcclxuICAgICAgICAgICAgICAgIGlmIChhc3NldENoZWNrICYmIGFzc2V0Q2hlY2subWlzc2luZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdhc3NldHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgRm91bmQgJHthc3NldENoZWNrLm1pc3NpbmcubGVuZ3RofSBtaXNzaW5nIGFzc2V0IHJlZmVyZW5jZXNgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiBhc3NldENoZWNrLm1pc3NpbmdcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHBlcmZvcm1hbmNlIGlzc3Vlc1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jaGVja1BlcmZvcm1hbmNlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoaWVyYXJjaHkgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlLXRyZWUnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3ROb2RlcyA9IChoaWVyYXJjaHkgYXMgYW55KT8uY2hpbGRyZW4gfHwgaGllcmFyY2h5IHx8IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZUNvdW50ID0gdGhpcy5jb3VudE5vZGVzKHJvb3ROb2Rlcyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChub2RlQ291bnQgPiAxMDAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNzdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgSGlnaCBub2RlIGNvdW50OiAke25vZGVDb3VudH0gbm9kZXMgKHJlY29tbWVuZGVkIDwgMTAwMClgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uOiAnQ29uc2lkZXIgdXNpbmcgb2JqZWN0IHBvb2xpbmcgb3Igc2NlbmUgb3B0aW1pemF0aW9uJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQ6IFZhbGlkYXRpb25SZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICB2YWxpZDogaXNzdWVzLmxlbmd0aCA9PT0gMCxcclxuICAgICAgICAgICAgICAgIGlzc3VlQ291bnQ6IGlzc3Vlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpc3N1ZXM6IGlzc3Vlc1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0IH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNvdW50Tm9kZXMobm9kZXM6IGFueVtdKTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgY291bnQgPSBub2Rlcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCArPSB0aGlzLmNvdW50Tm9kZXMobm9kZS5jaGlsZHJlbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2V0RWRpdG9ySW5mbygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIGNvbnN0IGluZm8gPSB7XHJcbiAgICAgICAgICAgIGVkaXRvcjoge1xyXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogKEVkaXRvciBhcyBhbnkpLnZlcnNpb25zPy5lZGl0b3IgfHwgJ1Vua25vd24nLFxyXG4gICAgICAgICAgICAgICAgY29jb3NWZXJzaW9uOiAoRWRpdG9yIGFzIGFueSkudmVyc2lvbnM/LmNvY29zIHx8ICdVbmtub3duJyxcclxuICAgICAgICAgICAgICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxyXG4gICAgICAgICAgICAgICAgYXJjaDogcHJvY2Vzcy5hcmNoLFxyXG4gICAgICAgICAgICAgICAgbm9kZVZlcnNpb246IHByb2Nlc3MudmVyc2lvblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcm9qZWN0OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBFZGl0b3IuUHJvamVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogRWRpdG9yLlByb2plY3QucGF0aCxcclxuICAgICAgICAgICAgICAgIHV1aWQ6IEVkaXRvci5Qcm9qZWN0LnV1aWRcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWVtb3J5OiBwcm9jZXNzLm1lbW9yeVVzYWdlKCksXHJcbiAgICAgICAgICAgIHVwdGltZTogcHJvY2Vzcy51cHRpbWUoKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGluZm8gfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFByb2plY3RMb2dzKGxpbmVzOiBudW1iZXIgPSAxMDAsIGZpbHRlcktleXdvcmQ/OiBzdHJpbmcsIGxvZ0xldmVsOiBzdHJpbmcgPSAnQUxMJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gVHJ5IG11bHRpcGxlIHBvc3NpYmxlIHByb2plY3QgcGF0aHNcclxuICAgICAgICAgICAgbGV0IGxvZ0ZpbGVQYXRoID0gJyc7XHJcbiAgICAgICAgICAgIGNvbnN0IHBvc3NpYmxlUGF0aHMgPSBbXHJcbiAgICAgICAgICAgICAgICBFZGl0b3IuUHJvamVjdCA/IEVkaXRvci5Qcm9qZWN0LnBhdGggOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgJy9Vc2Vycy9saXpoaXlvbmcvTmV3UHJvamVjdF8zJyxcclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuY3dkKCksXHJcbiAgICAgICAgICAgIF0uZmlsdGVyKHAgPT4gcCAhPT0gbnVsbCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJhc2VQYXRoIG9mIHBvc3NpYmxlUGF0aHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RQYXRoID0gcGF0aC5qb2luKGJhc2VQYXRoLCAndGVtcC9sb2dzL3Byb2plY3QubG9nJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyh0ZXN0UGF0aCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2dGaWxlUGF0aCA9IHRlc3RQYXRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWxvZ0ZpbGVQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgUHJvamVjdCBsb2cgZmlsZSBub3QgZm91bmQuIFRyaWVkIHBhdGhzOiAke3Bvc3NpYmxlUGF0aHMubWFwKHAgPT4gcGF0aC5qb2luKHAsICd0ZW1wL2xvZ3MvcHJvamVjdC5sb2cnKSkuam9pbignLCAnKX1gXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZWFkIHRoZSBmaWxlIGNvbnRlbnRcclxuICAgICAgICAgICAgY29uc3QgbG9nQ29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhsb2dGaWxlUGF0aCwgJ3V0ZjgnKTtcclxuICAgICAgICAgICAgY29uc3QgbG9nTGluZXMgPSBsb2dDb250ZW50LnNwbGl0KCdcXG4nKS5maWx0ZXIobGluZSA9PiBsaW5lLnRyaW0oKSAhPT0gJycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gR2V0IHRoZSBsYXN0IE4gbGluZXNcclxuICAgICAgICAgICAgY29uc3QgcmVjZW50TGluZXMgPSBsb2dMaW5lcy5zbGljZSgtbGluZXMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQXBwbHkgZmlsdGVyc1xyXG4gICAgICAgICAgICBsZXQgZmlsdGVyZWRMaW5lcyA9IHJlY2VudExpbmVzO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gRmlsdGVyIGJ5IGxvZyBsZXZlbCBpZiBub3QgJ0FMTCdcclxuICAgICAgICAgICAgaWYgKGxvZ0xldmVsICE9PSAnQUxMJykge1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyZWRMaW5lcyA9IGZpbHRlcmVkTGluZXMuZmlsdGVyKGxpbmUgPT4gXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZS5pbmNsdWRlcyhgWyR7bG9nTGV2ZWx9XWApIHx8IGxpbmUuaW5jbHVkZXMobG9nTGV2ZWwudG9Mb3dlckNhc2UoKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEZpbHRlciBieSBrZXl3b3JkIGlmIHByb3ZpZGVkXHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXJLZXl3b3JkKSB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpbmVzID0gZmlsdGVyZWRMaW5lcy5maWx0ZXIobGluZSA9PiBcclxuICAgICAgICAgICAgICAgICAgICBsaW5lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZmlsdGVyS2V5d29yZC50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWxMaW5lczogbG9nTGluZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RlZExpbmVzOiBsaW5lcyxcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZExpbmVzOiBmaWx0ZXJlZExpbmVzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBsb2dMZXZlbDogbG9nTGV2ZWwsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyS2V5d29yZDogZmlsdGVyS2V5d29yZCB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGxvZ3M6IGZpbHRlcmVkTGluZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgbG9nRmlsZVBhdGg6IGxvZ0ZpbGVQYXRoXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byByZWFkIHByb2plY3QgbG9nczogJHtlcnJvci5tZXNzYWdlfWBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRMb2dGaWxlSW5mbygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFRyeSBtdWx0aXBsZSBwb3NzaWJsZSBwcm9qZWN0IHBhdGhzXHJcbiAgICAgICAgICAgIGxldCBsb2dGaWxlUGF0aCA9ICcnO1xyXG4gICAgICAgICAgICBjb25zdCBwb3NzaWJsZVBhdGhzID0gW1xyXG4gICAgICAgICAgICAgICAgRWRpdG9yLlByb2plY3QgPyBFZGl0b3IuUHJvamVjdC5wYXRoIDogbnVsbCxcclxuICAgICAgICAgICAgICAgICcvVXNlcnMvbGl6aGl5b25nL05ld1Byb2plY3RfMycsXHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmN3ZCgpLFxyXG4gICAgICAgICAgICBdLmZpbHRlcihwID0+IHAgIT09IG51bGwpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChjb25zdCBiYXNlUGF0aCBvZiBwb3NzaWJsZVBhdGhzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXN0UGF0aCA9IHBhdGguam9pbihiYXNlUGF0aCwgJ3RlbXAvbG9ncy9wcm9qZWN0LmxvZycpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGVzdFBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nRmlsZVBhdGggPSB0ZXN0UGF0aDtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCFsb2dGaWxlUGF0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYFByb2plY3QgbG9nIGZpbGUgbm90IGZvdW5kLiBUcmllZCBwYXRoczogJHtwb3NzaWJsZVBhdGhzLm1hcChwID0+IHBhdGguam9pbihwLCAndGVtcC9sb2dzL3Byb2plY3QubG9nJykpLmpvaW4oJywgJyl9YFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBmcy5zdGF0U3luYyhsb2dGaWxlUGF0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ0NvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobG9nRmlsZVBhdGgsICd1dGY4Jyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpbmVDb3VudCA9IGxvZ0NvbnRlbnQuc3BsaXQoJ1xcbicpLmZpbHRlcihsaW5lID0+IGxpbmUudHJpbSgpICE9PSAnJykubGVuZ3RoO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGxvZ0ZpbGVQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGVTaXplOiBzdGF0cy5zaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGVTaXplRm9ybWF0dGVkOiB0aGlzLmZvcm1hdEZpbGVTaXplKHN0YXRzLnNpemUpLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RNb2RpZmllZDogc3RhdHMubXRpbWUudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICBsaW5lQ291bnQ6IGxpbmVDb3VudCxcclxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkOiBzdGF0cy5iaXJ0aHRpbWUudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NpYmxlOiBmcy5jb25zdGFudHMuUl9PS1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZ2V0IGxvZyBmaWxlIGluZm86ICR7ZXJyb3IubWVzc2FnZX1gXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2VhcmNoUHJvamVjdExvZ3MocGF0dGVybjogc3RyaW5nLCBtYXhSZXN1bHRzOiBudW1iZXIgPSAyMCwgY29udGV4dExpbmVzOiBudW1iZXIgPSAyKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBUcnkgbXVsdGlwbGUgcG9zc2libGUgcHJvamVjdCBwYXRoc1xyXG4gICAgICAgICAgICBsZXQgbG9nRmlsZVBhdGggPSAnJztcclxuICAgICAgICAgICAgY29uc3QgcG9zc2libGVQYXRocyA9IFtcclxuICAgICAgICAgICAgICAgIEVkaXRvci5Qcm9qZWN0ID8gRWRpdG9yLlByb2plY3QucGF0aCA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAnL1VzZXJzL2xpemhpeW9uZy9OZXdQcm9qZWN0XzMnLFxyXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5jd2QoKSxcclxuICAgICAgICAgICAgXS5maWx0ZXIocCA9PiBwICE9PSBudWxsKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgYmFzZVBhdGggb2YgcG9zc2libGVQYXRocykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGVzdFBhdGggPSBwYXRoLmpvaW4oYmFzZVBhdGgsICd0ZW1wL2xvZ3MvcHJvamVjdC5sb2cnKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHRlc3RQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZ0ZpbGVQYXRoID0gdGVzdFBhdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghbG9nRmlsZVBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBQcm9qZWN0IGxvZyBmaWxlIG5vdCBmb3VuZC4gVHJpZWQgcGF0aHM6ICR7cG9zc2libGVQYXRocy5tYXAocCA9PiBwYXRoLmpvaW4ocCwgJ3RlbXAvbG9ncy9wcm9qZWN0LmxvZycpKS5qb2luKCcsICcpfWBcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ0NvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobG9nRmlsZVBhdGgsICd1dGY4Jyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvZ0xpbmVzID0gbG9nQ29udGVudC5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgcmVnZXggcGF0dGVybiAoc3VwcG9ydCBib3RoIHN0cmluZyBhbmQgcmVnZXggcGF0dGVybnMpXHJcbiAgICAgICAgICAgIGxldCByZWdleDogUmVnRXhwO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4sICdnaScpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHBhdHRlcm4gaXMgbm90IHZhbGlkIHJlZ2V4LCB0cmVhdCBhcyBsaXRlcmFsIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKHBhdHRlcm4ucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKSwgJ2dpJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZXM6IGFueVtdID0gW107XHJcbiAgICAgICAgICAgIGxldCByZXN1bHRDb3VudCA9IDA7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvZ0xpbmVzLmxlbmd0aCAmJiByZXN1bHRDb3VudCA8IG1heFJlc3VsdHM7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxvZ0xpbmVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QobGluZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgY29udGV4dCBsaW5lc1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHRTdGFydCA9IE1hdGgubWF4KDAsIGkgLSBjb250ZXh0TGluZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHRFbmQgPSBNYXRoLm1pbihsb2dMaW5lcy5sZW5ndGggLSAxLCBpICsgY29udGV4dExpbmVzKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb250ZXh0TGluZXNBcnJheSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSBjb250ZXh0U3RhcnQ7IGogPD0gY29udGV4dEVuZDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHRMaW5lc0FycmF5LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogaiArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBsb2dMaW5lc1tqXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2g6IGogPT09IGlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IGkgKyAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkTGluZTogbGluZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogY29udGV4dExpbmVzQXJyYXlcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHJlZ2V4IGxhc3RJbmRleCBmb3IgZ2xvYmFsIHNlYXJjaFxyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4Lmxhc3RJbmRleCA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm46IHBhdHRlcm4sXHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWxNYXRjaGVzOiBtYXRjaGVzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhSZXN1bHRzOiBtYXhSZXN1bHRzLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRMaW5lczogY29udGV4dExpbmVzLFxyXG4gICAgICAgICAgICAgICAgICAgIGxvZ0ZpbGVQYXRoOiBsb2dGaWxlUGF0aCxcclxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzOiBtYXRjaGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBzZWFyY2ggcHJvamVjdCBsb2dzOiAke2Vycm9yLm1lc3NhZ2V9YFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZvcm1hdEZpbGVTaXplKGJ5dGVzOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJ107XHJcbiAgICAgICAgbGV0IHNpemUgPSBieXRlcztcclxuICAgICAgICBsZXQgdW5pdEluZGV4ID0gMDtcclxuICAgICAgICBcclxuICAgICAgICB3aGlsZSAoc2l6ZSA+PSAxMDI0ICYmIHVuaXRJbmRleCA8IHVuaXRzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgc2l6ZSAvPSAxMDI0O1xyXG4gICAgICAgICAgICB1bml0SW5kZXgrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGAke3NpemUudG9GaXhlZCgyKX0gJHt1bml0c1t1bml0SW5kZXhdfWA7XHJcbiAgICB9XHJcbn0iXX0=