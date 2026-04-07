export interface MCPServerSettings {
    port: number;
    autoStart: boolean;
    enableDebugLog: boolean;
    allowedOrigins: string[];
    maxConnections: number;
}

export interface ServerStatus {
    running: boolean;
    port: number;
    clients: number;
}

export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    category?: string;
}

export interface ToolResponse {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
    instruction?: string;
    warning?: string;
    verificationData?: any;
    updatedProperties?: string[];
}

export interface NodeInfo {
    uuid: string;
    name: string;
    active: boolean;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    parent?: string;
    children?: string[];
    components?: ComponentInfo[];
    layer?: number;
    mobility?: number;
}

export interface ComponentInfo {
    type: string;
    enabled: boolean;
    properties?: Record<string, any>;
}

export interface SceneInfo {
    name: string;
    uuid: string;
    path: string;
}

export interface PrefabInfo {
    name: string;
    uuid: string;
    path: string;
    folder: string;
    createTime?: string;
    modifyTime?: string;
    dependencies?: string[];
}

export interface AssetInfo {
    name: string;
    uuid: string;
    path: string;
    type: string;
    size?: number;
    isDirectory: boolean;
    meta?: {
        ver: string;
        importer: string;
    };
}

export interface ProjectInfo {
    name: string;
    path: string;
    uuid: string;
    version: string;
    cocosVersion: string;
}

export interface ConsoleMessage {
    timestamp: string;
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    stack?: string;
}

export interface PerformanceStats {
    nodeCount: number;
    componentCount: number;
    drawCalls: number;
    triangles: number;
    memory: Record<string, any>;
}

export interface ValidationIssue {
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    details?: any;
    suggestion?: string;
}

export interface ValidationResult {
    valid: boolean;
    issueCount: number;
    issues: ValidationIssue[];
}

export interface MCPClient {
    id: string;
    lastActivity: Date;
    userAgent?: string;
}

export interface ToolExecutor {
    getTools(): ToolDefinition[];
    execute(toolName: string, args: any): Promise<ToolResponse>;
}

// 工具配置管理相关接口
export interface ToolConfig {
    category: string;
    name: string;
    enabled: boolean;
    description: string;
}

export interface ToolConfiguration {
    id: string;
    name: string;
    description?: string;
    tools: ToolConfig[];
    createdAt: string;
    updatedAt: string;
}

export interface ToolManagerSettings {
    configurations: ToolConfiguration[];
    currentConfigId: string;
    maxConfigSlots: number;
}

export interface ToolManagerState {
    availableTools: ToolConfig[];
    currentConfiguration: ToolConfiguration | null;
    configurations: ToolConfiguration[];
}

// 视觉校验相关接口
export interface VerificationTolerance {
    pixelThreshold: number;        // 单像素差异阈值 (0-1)
    similarityThreshold: number;   // 相似度阈值 (0-1)
    minRegionSize: number;         // 最小差异区域像素数
    minRegionPercent: number;      // 最小差异区域百分比
    positionTolerance: number;     // 位置容差像素数
    strictMode: boolean;           // 严格模式
}

export interface VerificationSettings {
    defaultTolerance: VerificationTolerance;
    presets: VerificationPreset[];
    lastUsedPreset: string;
}

export interface VerificationPreset {
    name: string;
    tolerance: VerificationTolerance;
}

export interface DiffRegion {
    id: number;
    boundingBox: { x: number; y: number; width: number; height: number };
    pixelCount: number;
    severity: 'low' | 'medium' | 'high';
    center: { x: number; y: number };
    percentageOfImage: number;
}

export interface CompareResult {
    similarity: number;
    mismatchedPixels: number;
    totalPixels: number;
    diffRegions: DiffRegion[];
    diffImageBase64?: string;
}

export interface VerificationResult {
    passed: boolean;
    similarity: number;
    overallVerdict: string;
    differences: DiffRegion[];
    diffImageBase64?: string;
    mockupPath: string;
    screenshotSize: { width: number; height: number };
    timestamp: string;
    toleranceUsed: VerificationTolerance;
}

export interface ScreenshotResult {
    success: boolean;
    base64?: string;
    width?: number;
    height?: number;
    error?: string;
}

// 结构对比相关接口
export interface StructuralCompareResult {
    edgeSimilarity: number;           // 边缘结构相似度 (0-1)
    ssim: number;                     // SSIM 结构相似度指数 (0-1)
    structuralDiffRegions: DiffRegion[];
    edgeImageBase64?: string;         // 边缘图可视化
}

// 差异分析与修复建议相关接口
export interface FixSuggestion {
    regionId: number;
    type: 'color_mismatch' | 'position_mismatch' | 'missing_element' | 'extra_element';
    description: string;              // 中文描述
    suggestedAction: string;          // 具体修复建议
    targetNode?: string;              // 推测的目标节点名称
    confidence: number;               // 置信度 0-1
}

export interface CategorizedDiff {
    category: 'color' | 'position' | 'size' | 'missing' | 'extra';
    description: string;              // 中文描述
    region: DiffRegion;
    severity: 'low' | 'medium' | 'high';
}

// 批量验证相关接口
export interface BatchVerifyTask {
    sceneName?: string;               // 场景名称
    mockupPath: string;               // 效果图路径
    cameraName?: string;              // 可选相机名称
}

export interface BatchVerifyResult {
    passed: number;
    failed: number;
    total: number;
    details: Array<{
        task: BatchVerifyTask;
        passed: boolean;
        similarity: number;
        verdict: string;
        error?: string;
    }>;
}

// 增强的校验结果
export interface EnhancedVerificationResult extends VerificationResult {
    // 结构化差异分析
    analysis?: {
        structuralSimilarity?: number;
        colorConsistency?: number;
        layoutMatch?: number;
    };
    // 分类差异描述
    categorizedDiffs?: CategorizedDiff[];
    // 修复建议
    fixSuggestions?: FixSuggestion[];
    // 报告持久化路径
    reportPath?: string;
}