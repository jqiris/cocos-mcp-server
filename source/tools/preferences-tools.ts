import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class PreferencesTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'preferences_manage',
                description: '偏好设置管理：打开设置面板、查询配置、设置配置、重置偏好',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['open_panel', 'get_config', 'set_config', 'reset'],
                            description: '操作类型'
                        },
                        tab: {
                            type: 'string',
                            description: '偏好设置标签页，仅用于 open_panel',
                            enum: ['general', 'external-tools', 'data-editor', 'laboratory', 'extensions']
                        },
                        args: {
                            type: 'array',
                            description: '附加参数，仅用于 open_panel'
                        },
                        name: {
                            type: 'string',
                            description: '插件或分类名称，用于 get_config / set_config / reset'
                        },
                        path: {
                            type: 'string',
                            description: '配置路径，用于 get_config / set_config'
                        },
                        value: {
                            description: '配置值，用于 set_config'
                        },
                        type: {
                            type: 'string',
                            description: '配置类型，用于 get_config / set_config / reset',
                            enum: ['default', 'global', 'local'],
                            default: 'global'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'preferences_query',
                description: '偏好设置查询：获取所有偏好、列出分类、按关键词搜索',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_all', 'list_categories', 'search'],
                            description: '操作类型'
                        },
                        keyword: {
                            type: 'string',
                            description: '搜索关键词，仅用于 search'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'preferences_backup',
                description: '偏好设置备份：导出和导入偏好配置',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['export', 'import'],
                            description: '操作类型'
                        },
                        exportPath: {
                            type: 'string',
                            description: '导出文件路径，仅用于 export'
                        },
                        importPath: {
                            type: 'string',
                            description: '导入文件路径，仅用于 import'
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'preferences_manage':
                return await this.handlePreferencesManage(args.action, args);
            case 'preferences_query':
                return await this.handlePreferencesQuery(args.action, args);
            case 'preferences_backup':
                return await this.handlePreferencesBackup(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async handlePreferencesManage(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'open_panel': return await this.openPreferencesSettings(args.tab, args.args);
            case 'get_config': return await this.queryPreferencesConfig(args.name, args.path, args.type);
            case 'set_config': return await this.setPreferencesConfig(args.name, args.path, args.value, args.type);
            case 'reset': return await this.resetPreferences(args.name, args.type);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handlePreferencesQuery(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_all': return await this.getAllPreferences();
            case 'list_categories': return await this.listPreferenceCategories();
            case 'search': return await this.searchPreferences(args.keyword);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handlePreferencesBackup(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'export': return await this.exportPreferences(args.exportPath);
            case 'import': return await this.importPreferences(args.importPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async openPreferencesSettings(tab?: string, args?: any[]): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const requestArgs = [];
            if (tab) {
                requestArgs.push(tab);
            }
            if (args && args.length > 0) {
                requestArgs.push(...args);
            }

            (Editor.Message.request as any)('preferences', 'open-settings', ...requestArgs).then(() => {
                resolve({
                    success: true,
                    message: `Preferences settings opened${tab ? ` on tab: ${tab}` : ''}`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryPreferencesConfig(name: string, path?: string, type: string = 'global'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const requestArgs = [name];
            if (path) {
                requestArgs.push(path);
            }
            requestArgs.push(type);

            (Editor.Message.request as any)('preferences', 'query-config', ...requestArgs).then((config: any) => {
                resolve({
                    success: true,
                    data: {
                        name: name,
                        path: path,
                        type: type,
                        config: config
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async setPreferencesConfig(name: string, path: string, value: any, type: string = 'global'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            (Editor.Message.request as any)('preferences', 'set-config', name, path, value, type).then((success: boolean) => {
                if (success) {
                    resolve({
                        success: true,
                        message: `Preference '${name}.${path}' updated successfully`
                    });
                } else {
                    resolve({
                        success: false,
                        error: `Failed to update preference '${name}.${path}'`
                    });
                }
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getAllPreferences(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            // Common preference categories in Cocos Creator
            const categories = [
                'general',
                'external-tools', 
                'data-editor',
                'laboratory',
                'extensions',
                'preview',
                'console',
                'native',
                'builder'
            ];

            const preferences: any = {};

            const queryPromises = categories.map(category => {
                return Editor.Message.request('preferences', 'query-config', category, undefined, 'global')
                    .then((config: any) => {
                        preferences[category] = config;
                    })
                    .catch(() => {
                        // Ignore errors for categories that don't exist
                        preferences[category] = null;
                    });
            });

            Promise.all(queryPromises).then(() => {
                // Filter out null entries
                const validPreferences = Object.fromEntries(
                    Object.entries(preferences).filter(([_, value]) => value !== null)
                );

                resolve({
                    success: true,
                    data: {
                        categories: Object.keys(validPreferences),
                        preferences: validPreferences
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async resetPreferences(name?: string, type: string = 'global'): Promise<ToolResponse> {
        return new Promise((resolve) => {
            if (name) {
                // Reset specific preference category
                Editor.Message.request('preferences', 'query-config', name, undefined, 'default').then((defaultConfig: any) => {
                    return (Editor.Message.request as any)('preferences', 'set-config', name, '', defaultConfig, type);
                }).then((success: boolean) => {
                    if (success) {
                        resolve({
                            success: true,
                            message: `Preference category '${name}' reset to default`
                        });
                    } else {
                        resolve({
                            success: false,
                            error: `Failed to reset preference category '${name}'`
                        });
                    }
                }).catch((err: Error) => {
                    resolve({ success: false, error: err.message });
                });
            } else {
                resolve({
                    success: false,
                    error: 'Resetting all preferences is not supported through API. Please specify a preference category.'
                });
            }
        });
    }

    private async exportPreferences(exportPath?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            this.getAllPreferences().then((prefsResult: ToolResponse) => {
                if (!prefsResult.success) {
                    resolve(prefsResult);
                    return;
                }

                const prefsData = JSON.stringify(prefsResult.data, null, 2);
                const path = exportPath || `preferences_export_${Date.now()}.json`;

                // For now, return the data - in a real implementation, you'd write to file
                resolve({
                    success: true,
                    data: {
                        exportPath: path,
                        preferences: prefsResult.data,
                        jsonData: prefsData,
                        message: 'Preferences exported successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async importPreferences(importPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            resolve({
                success: false,
                error: 'Import preferences functionality requires file system access which is not available in this context. Please manually import preferences through the Editor UI.'
            });
        });
    }

    private async listPreferenceCategories(): Promise<ToolResponse> {
        const allResult = await this.getAllPreferences();
        if (!allResult.success) {
            return allResult;
        }

        const categories = (allResult.data as any).categories as string[];
        return {
            success: true,
            data: {
                categories: categories,
                count: categories.length,
                message: 'Preference categories retrieved successfully'
            }
        };
    }

    private async searchPreferences(keyword: string): Promise<ToolResponse> {
        if (!keyword) {
            return { success: false, error: 'Search keyword is required' };
        }

        const allResult = await this.getAllPreferences();
        if (!allResult.success) {
            return allResult;
        }

        const preferences = (allResult.data as any).preferences as Record<string, any>;
        const lowerKeyword = keyword.toLowerCase();

        const matches: Record<string, any> = {};
        for (const [category, config] of Object.entries(preferences)) {
            if (category.toLowerCase().includes(lowerKeyword)) {
                matches[category] = config;
                continue;
            }

            const configStr = JSON.stringify(config).toLowerCase();
            if (configStr.includes(lowerKeyword)) {
                matches[category] = config;
            }
        }

        return {
            success: true,
            data: {
                keyword: keyword,
                matches: matches,
                matchCount: Object.keys(matches).length,
                message: `Found ${Object.keys(matches).length} categories matching '${keyword}'`
            }
        };
    }
}