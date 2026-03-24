import * as fs from 'fs';
import * as path from 'path';
import { MCPServerSettings, ToolManagerSettings, ToolConfiguration, ToolConfig, VerificationSettings } from './types';

const DEFAULT_SETTINGS: MCPServerSettings = {
    port: 3000,
    autoStart: false,
    enableDebugLog: false,
    allowedOrigins: ['*'],
    maxConnections: 10
};

const DEFAULT_TOOL_MANAGER_SETTINGS: ToolManagerSettings = {
    configurations: [],
    currentConfigId: '',
    maxConfigSlots: 5
};

const DEFAULT_VERIFICATION_SETTINGS: VerificationSettings = {
    defaultTolerance: {
        pixelThreshold: 0.15,
        similarityThreshold: 0.85,
        minRegionSize: 500,
        minRegionPercent: 0.5,
        positionTolerance: 10,
        strictMode: false
    },
    presets: [
        {
            name: '宽松',
            tolerance: {
                pixelThreshold: 0.25,
                similarityThreshold: 0.70,
                minRegionSize: 1000,
                minRegionPercent: 1.0,
                positionTolerance: 20,
                strictMode: false
            }
        },
        {
            name: '标准',
            tolerance: {
                pixelThreshold: 0.15,
                similarityThreshold: 0.85,
                minRegionSize: 500,
                minRegionPercent: 0.5,
                positionTolerance: 10,
                strictMode: false
            }
        },
        {
            name: '严格',
            tolerance: {
                pixelThreshold: 0.05,
                similarityThreshold: 0.95,
                minRegionSize: 100,
                minRegionPercent: 0.1,
                positionTolerance: 5,
                strictMode: true
            }
        }
    ],
    lastUsedPreset: '标准'
};

function getSettingsPath(): string {
    return path.join(Editor.Project.path, 'settings', 'mcp-server.json');
}

function getToolManagerSettingsPath(): string {
    return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
}

function getVerificationSettingsPath(): string {
    return path.join(Editor.Project.path, 'settings', 'verification.json');
}

function ensureSettingsDir(): void {
    const settingsDir = path.dirname(getSettingsPath());
    if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
    }
}

export function readSettings(): MCPServerSettings {
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
        }
    } catch (e) {
        console.error('Failed to read settings:', e);
    }
    return DEFAULT_SETTINGS;
}

export function saveSettings(settings: MCPServerSettings): void {
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error('Failed to save settings:', e);
        throw e;
    }
}

// 工具管理器设置相关函数
export function readToolManagerSettings(): ToolManagerSettings {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return { ...DEFAULT_TOOL_MANAGER_SETTINGS, ...JSON.parse(content) };
        }
    } catch (e) {
        console.error('Failed to read tool manager settings:', e);
    }
    return DEFAULT_TOOL_MANAGER_SETTINGS;
}

export function saveToolManagerSettings(settings: ToolManagerSettings): void {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error('Failed to save tool manager settings:', e);
        throw e;
    }
}

// 视觉校验设置相关函数
export function readVerificationSettings(): VerificationSettings {
    try {
        ensureSettingsDir();
        const settingsFile = getVerificationSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return { ...DEFAULT_VERIFICATION_SETTINGS, ...JSON.parse(content) };
        }
    } catch (e) {
        console.error('Failed to read verification settings:', e);
    }
    return DEFAULT_VERIFICATION_SETTINGS;
}

export function saveVerificationSettings(settings: VerificationSettings): void {
    try {
        ensureSettingsDir();
        const settingsFile = getVerificationSettingsPath();
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error('Failed to save verification settings:', e);
        throw e;
    }
}

export function exportToolConfiguration(config: ToolConfiguration): string {
    return JSON.stringify(config, null, 2);
}

export function importToolConfiguration(configJson: string): ToolConfiguration {
    try {
        const config = JSON.parse(configJson);
        // 验证配置格式
        if (!config.id || !config.name || !Array.isArray(config.tools)) {
            throw new Error('Invalid configuration format');
        }
        return config;
    } catch (e) {
        console.error('Failed to parse tool configuration:', e);
        throw new Error('Invalid JSON format or configuration structure');
    }
}

export { DEFAULT_SETTINGS, DEFAULT_TOOL_MANAGER_SETTINGS, DEFAULT_VERIFICATION_SETTINGS };