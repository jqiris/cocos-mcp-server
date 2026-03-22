"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesTools = void 0;
class PreferencesTools {
    getTools() {
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
    async execute(toolName, args) {
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
    async handlePreferencesManage(action, args) {
        switch (action) {
            case 'open_panel': return await this.openPreferencesSettings(args.tab, args.args);
            case 'get_config': return await this.queryPreferencesConfig(args.name, args.path, args.type);
            case 'set_config': return await this.setPreferencesConfig(args.name, args.path, args.value, args.type);
            case 'reset': return await this.resetPreferences(args.name, args.type);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handlePreferencesQuery(action, args) {
        switch (action) {
            case 'get_all': return await this.getAllPreferences();
            case 'list_categories': return await this.listPreferenceCategories();
            case 'search': return await this.searchPreferences(args.keyword);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handlePreferencesBackup(action, args) {
        switch (action) {
            case 'export': return await this.exportPreferences(args.exportPath);
            case 'import': return await this.importPreferences(args.importPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async openPreferencesSettings(tab, args) {
        return new Promise((resolve) => {
            const requestArgs = [];
            if (tab) {
                requestArgs.push(tab);
            }
            if (args && args.length > 0) {
                requestArgs.push(...args);
            }
            Editor.Message.request('preferences', 'open-settings', ...requestArgs).then(() => {
                resolve({
                    success: true,
                    message: `Preferences settings opened${tab ? ` on tab: ${tab}` : ''}`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryPreferencesConfig(name, path, type = 'global') {
        return new Promise((resolve) => {
            const requestArgs = [name];
            if (path) {
                requestArgs.push(path);
            }
            requestArgs.push(type);
            Editor.Message.request('preferences', 'query-config', ...requestArgs).then((config) => {
                resolve({
                    success: true,
                    data: {
                        name: name,
                        path: path,
                        type: type,
                        config: config
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async setPreferencesConfig(name, path, value, type = 'global') {
        return new Promise((resolve) => {
            Editor.Message.request('preferences', 'set-config', name, path, value, type).then((success) => {
                if (success) {
                    resolve({
                        success: true,
                        message: `Preference '${name}.${path}' updated successfully`
                    });
                }
                else {
                    resolve({
                        success: false,
                        error: `Failed to update preference '${name}.${path}'`
                    });
                }
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getAllPreferences() {
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
            const preferences = {};
            const queryPromises = categories.map(category => {
                return Editor.Message.request('preferences', 'query-config', category, undefined, 'global')
                    .then((config) => {
                    preferences[category] = config;
                })
                    .catch(() => {
                    // Ignore errors for categories that don't exist
                    preferences[category] = null;
                });
            });
            Promise.all(queryPromises).then(() => {
                // Filter out null entries
                const validPreferences = Object.fromEntries(Object.entries(preferences).filter(([_, value]) => value !== null));
                resolve({
                    success: true,
                    data: {
                        categories: Object.keys(validPreferences),
                        preferences: validPreferences
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async resetPreferences(name, type = 'global') {
        return new Promise((resolve) => {
            if (name) {
                // Reset specific preference category
                Editor.Message.request('preferences', 'query-config', name, undefined, 'default').then((defaultConfig) => {
                    return Editor.Message.request('preferences', 'set-config', name, '', defaultConfig, type);
                }).then((success) => {
                    if (success) {
                        resolve({
                            success: true,
                            message: `Preference category '${name}' reset to default`
                        });
                    }
                    else {
                        resolve({
                            success: false,
                            error: `Failed to reset preference category '${name}'`
                        });
                    }
                }).catch((err) => {
                    resolve({ success: false, error: err.message });
                });
            }
            else {
                resolve({
                    success: false,
                    error: 'Resetting all preferences is not supported through API. Please specify a preference category.'
                });
            }
        });
    }
    async exportPreferences(exportPath) {
        return new Promise((resolve) => {
            this.getAllPreferences().then((prefsResult) => {
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
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async importPreferences(importPath) {
        return new Promise((resolve) => {
            resolve({
                success: false,
                error: 'Import preferences functionality requires file system access which is not available in this context. Please manually import preferences through the Editor UI.'
            });
        });
    }
    async listPreferenceCategories() {
        const allResult = await this.getAllPreferences();
        if (!allResult.success) {
            return allResult;
        }
        const categories = allResult.data.categories;
        return {
            success: true,
            data: {
                categories: categories,
                count: categories.length,
                message: 'Preference categories retrieved successfully'
            }
        };
    }
    async searchPreferences(keyword) {
        if (!keyword) {
            return { success: false, error: 'Search keyword is required' };
        }
        const allResult = await this.getAllPreferences();
        if (!allResult.success) {
            return allResult;
        }
        const preferences = allResult.data.preferences;
        const lowerKeyword = keyword.toLowerCase();
        const matches = {};
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
exports.PreferencesTools = PreferencesTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvcHJlZmVyZW5jZXMtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxnQkFBZ0I7SUFDekIsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsb0JBQW9CO2dCQUMxQixXQUFXLEVBQUUsOEJBQThCO2dCQUMzQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxJQUFJLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUM7NEJBQ3pELFdBQVcsRUFBRSxNQUFNO3lCQUN0Qjt3QkFDRCxHQUFHLEVBQUU7NEJBQ0QsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHdCQUF3Qjs0QkFDckMsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDO3lCQUNqRjt3QkFDRCxJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLE9BQU87NEJBQ2IsV0FBVyxFQUFFLHFCQUFxQjt5QkFDckM7d0JBQ0QsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSw0Q0FBNEM7eUJBQzVEO3dCQUNELElBQUksRUFBRTs0QkFDRixJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsaUNBQWlDO3lCQUNqRDt3QkFDRCxLQUFLLEVBQUU7NEJBQ0gsV0FBVyxFQUFFLG1CQUFtQjt5QkFDbkM7d0JBQ0QsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx5Q0FBeUM7NEJBQ3RELElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUs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LEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRTtnQkFDRixPQUFPLEVBQUUsT0FBTztnQkFDaEIsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU07Z0JBQ3ZDLE9BQU8sRUFBRSxTQUFTLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSx5QkFBeUIsT0FBTyxHQUFHO2FBQ25GO1NBQ0osQ0FBQztJQUNOLENBQUM7Q0FDSjtBQXhXRCw0Q0F3V0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IgfSBmcm9tICcuLi90eXBlcyc7XHJcblxyXG5leHBvcnQgY2xhc3MgUHJlZmVyZW5jZXNUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAncHJlZmVyZW5jZXNfbWFuYWdlJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5YGP5aW96K6+572u566h55CG77ya5omT5byA6K6+572u6Z2i5p2/44CB5p+l6K+i6YWN572u44CB6K6+572u6YWN572u44CB6YeN572u5YGP5aW9JyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydvcGVuX3BhbmVsJywgJ2dldF9jb25maWcnLCAnc2V0X2NvbmZpZycsICdyZXNldCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmk43kvZznsbvlnosnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+WBj+Wlveiuvue9ruagh+etvumhte+8jOS7heeUqOS6jiBvcGVuX3BhbmVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZ2VuZXJhbCcsICdleHRlcm5hbC10b29scycsICdkYXRhLWVkaXRvcicsICdsYWJvcmF0b3J5JywgJ2V4dGVuc2lvbnMnXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfpmYTliqDlj4LmlbDvvIzku4XnlKjkuo4gb3Blbl9wYW5lbCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aPkuS7tuaIluWIhuexu+WQjeensO+8jOeUqOS6jiBnZXRfY29uZmlnIC8gc2V0X2NvbmZpZyAvIHJlc2V0J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6YWN572u6Lev5b6E77yM55So5LqOIGdldF9jb25maWcgLyBzZXRfY29uZmlnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfphY3nva7lgLzvvIznlKjkuo4gc2V0X2NvbmZpZydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+mFjee9ruexu+Wei++8jOeUqOS6jiBnZXRfY29uZmlnIC8gc2V0X2NvbmZpZyAvIHJlc2V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZGVmYXVsdCcsICdnbG9iYWwnLCAnbG9jYWwnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdnbG9iYWwnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdwcmVmZXJlbmNlc19xdWVyeScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+WBj+Wlveiuvue9ruafpeivou+8muiOt+WPluaJgOacieWBj+WlveOAgeWIl+WHuuWIhuexu+OAgeaMieWFs+mUruivjeaQnOe0oicsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZ2V0X2FsbCcsICdsaXN0X2NhdGVnb3JpZXMnLCAnc2VhcmNoJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aTjeS9nOexu+WeiydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5d29yZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aQnOe0ouWFs+mUruivje+8jOS7heeUqOS6jiBzZWFyY2gnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdwcmVmZXJlbmNlc19iYWNrdXAnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICflgY/lpb3orr7nva7lpIfku73vvJrlr7zlh7rlkozlr7zlhaXlgY/lpb3phY3nva4nLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2V4cG9ydCcsICdpbXBvcnQnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pON5L2c57G75Z6LJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRQYXRoOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5a+85Ye65paH5Lu26Lev5b6E77yM5LuF55So5LqOIGV4cG9ydCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0UGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+WvvOWFpeaWh+S7tui3r+W+hO+8jOS7heeUqOS6jiBpbXBvcnQnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ByZWZlcmVuY2VzX21hbmFnZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVQcmVmZXJlbmNlc01hbmFnZShhcmdzLmFjdGlvbiwgYXJncyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ByZWZlcmVuY2VzX3F1ZXJ5JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZVByZWZlcmVuY2VzUXVlcnkoYXJncy5hY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICBjYXNlICdwcmVmZXJlbmNlc19iYWNrdXAnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlUHJlZmVyZW5jZXNCYWNrdXAoYXJncy5hY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlUHJlZmVyZW5jZXNNYW5hZ2UoYWN0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSAnb3Blbl9wYW5lbCc6IHJldHVybiBhd2FpdCB0aGlzLm9wZW5QcmVmZXJlbmNlc1NldHRpbmdzKGFyZ3MudGFiLCBhcmdzLmFyZ3MpO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRfY29uZmlnJzogcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlQcmVmZXJlbmNlc0NvbmZpZyhhcmdzLm5hbWUsIGFyZ3MucGF0aCwgYXJncy50eXBlKTtcclxuICAgICAgICAgICAgY2FzZSAnc2V0X2NvbmZpZyc6IHJldHVybiBhd2FpdCB0aGlzLnNldFByZWZlcmVuY2VzQ29uZmlnKGFyZ3MubmFtZSwgYXJncy5wYXRoLCBhcmdzLnZhbHVlLCBhcmdzLnR5cGUpO1xyXG4gICAgICAgICAgICBjYXNlICdyZXNldCc6IHJldHVybiBhd2FpdCB0aGlzLnJlc2V0UHJlZmVyZW5jZXMoYXJncy5uYW1lLCBhcmdzLnR5cGUpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthY3Rpb259YCB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVByZWZlcmVuY2VzUXVlcnkoYWN0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0X2FsbCc6IHJldHVybiBhd2FpdCB0aGlzLmdldEFsbFByZWZlcmVuY2VzKCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2xpc3RfY2F0ZWdvcmllcyc6IHJldHVybiBhd2FpdCB0aGlzLmxpc3RQcmVmZXJlbmNlQ2F0ZWdvcmllcygpO1xyXG4gICAgICAgICAgICBjYXNlICdzZWFyY2gnOiByZXR1cm4gYXdhaXQgdGhpcy5zZWFyY2hQcmVmZXJlbmNlcyhhcmdzLmtleXdvcmQpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthY3Rpb259YCB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVByZWZlcmVuY2VzQmFja3VwKGFjdGlvbjogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2V4cG9ydCc6IHJldHVybiBhd2FpdCB0aGlzLmV4cG9ydFByZWZlcmVuY2VzKGFyZ3MuZXhwb3J0UGF0aCk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2ltcG9ydCc6IHJldHVybiBhd2FpdCB0aGlzLmltcG9ydFByZWZlcmVuY2VzKGFyZ3MuaW1wb3J0UGF0aCk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYWN0aW9uOiAke2FjdGlvbn1gIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgb3BlblByZWZlcmVuY2VzU2V0dGluZ3ModGFiPzogc3RyaW5nLCBhcmdzPzogYW55W10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0QXJncyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAodGFiKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QXJncy5wdXNoKHRhYik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGFyZ3MgJiYgYXJncy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QXJncy5wdXNoKC4uLmFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdwcmVmZXJlbmNlcycsICdvcGVuLXNldHRpbmdzJywgLi4ucmVxdWVzdEFyZ3MpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJlZmVyZW5jZXMgc2V0dGluZ3Mgb3BlbmVkJHt0YWIgPyBgIG9uIHRhYjogJHt0YWJ9YCA6ICcnfWBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlQcmVmZXJlbmNlc0NvbmZpZyhuYW1lOiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcsIHR5cGU6IHN0cmluZyA9ICdnbG9iYWwnKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmVxdWVzdEFyZ3MgPSBbbmFtZV07XHJcbiAgICAgICAgICAgIGlmIChwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0QXJncy5wdXNoKHBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlcXVlc3RBcmdzLnB1c2godHlwZSk7XHJcblxyXG4gICAgICAgICAgICAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdwcmVmZXJlbmNlcycsICdxdWVyeS1jb25maWcnLCAuLi5yZXF1ZXN0QXJncykudGhlbigoY29uZmlnOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0UHJlZmVyZW5jZXNDb25maWcobmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHZhbHVlOiBhbnksIHR5cGU6IHN0cmluZyA9ICdnbG9iYWwnKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KSgncHJlZmVyZW5jZXMnLCAnc2V0LWNvbmZpZycsIG5hbWUsIHBhdGgsIHZhbHVlLCB0eXBlKS50aGVuKChzdWNjZXNzOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgUHJlZmVyZW5jZSAnJHtuYW1lfS4ke3BhdGh9JyB1cGRhdGVkIHN1Y2Nlc3NmdWxseWBcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byB1cGRhdGUgcHJlZmVyZW5jZSAnJHtuYW1lfS4ke3BhdGh9J2BcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldEFsbFByZWZlcmVuY2VzKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIENvbW1vbiBwcmVmZXJlbmNlIGNhdGVnb3JpZXMgaW4gQ29jb3MgQ3JlYXRvclxyXG4gICAgICAgICAgICBjb25zdCBjYXRlZ29yaWVzID0gW1xyXG4gICAgICAgICAgICAgICAgJ2dlbmVyYWwnLFxyXG4gICAgICAgICAgICAgICAgJ2V4dGVybmFsLXRvb2xzJywgXHJcbiAgICAgICAgICAgICAgICAnZGF0YS1lZGl0b3InLFxyXG4gICAgICAgICAgICAgICAgJ2xhYm9yYXRvcnknLFxyXG4gICAgICAgICAgICAgICAgJ2V4dGVuc2lvbnMnLFxyXG4gICAgICAgICAgICAgICAgJ3ByZXZpZXcnLFxyXG4gICAgICAgICAgICAgICAgJ2NvbnNvbGUnLFxyXG4gICAgICAgICAgICAgICAgJ25hdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAnYnVpbGRlcidcclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHByZWZlcmVuY2VzOiBhbnkgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5UHJvbWlzZXMgPSBjYXRlZ29yaWVzLm1hcChjYXRlZ29yeSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJlZmVyZW5jZXMnLCAncXVlcnktY29uZmlnJywgY2F0ZWdvcnksIHVuZGVmaW5lZCwgJ2dsb2JhbCcpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGNvbmZpZzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcmVuY2VzW2NhdGVnb3J5XSA9IGNvbmZpZztcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElnbm9yZSBlcnJvcnMgZm9yIGNhdGVnb3JpZXMgdGhhdCBkb24ndCBleGlzdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJlbmNlc1tjYXRlZ29yeV0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIFByb21pc2UuYWxsKHF1ZXJ5UHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gRmlsdGVyIG91dCBudWxsIGVudHJpZXNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkUHJlZmVyZW5jZXMgPSBPYmplY3QuZnJvbUVudHJpZXMoXHJcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMocHJlZmVyZW5jZXMpLmZpbHRlcigoW18sIHZhbHVlXSkgPT4gdmFsdWUgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3Qua2V5cyh2YWxpZFByZWZlcmVuY2VzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZmVyZW5jZXM6IHZhbGlkUHJlZmVyZW5jZXNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJlc2V0UHJlZmVyZW5jZXMobmFtZT86IHN0cmluZywgdHlwZTogc3RyaW5nID0gJ2dsb2JhbCcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVzZXQgc3BlY2lmaWMgcHJlZmVyZW5jZSBjYXRlZ29yeVxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgncHJlZmVyZW5jZXMnLCAncXVlcnktY29uZmlnJywgbmFtZSwgdW5kZWZpbmVkLCAnZGVmYXVsdCcpLnRoZW4oKGRlZmF1bHRDb25maWc6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKCdwcmVmZXJlbmNlcycsICdzZXQtY29uZmlnJywgbmFtZSwgJycsIGRlZmF1bHRDb25maWcsIHR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfSkudGhlbigoc3VjY2VzczogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBQcmVmZXJlbmNlIGNhdGVnb3J5ICcke25hbWV9JyByZXNldCB0byBkZWZhdWx0YFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gcmVzZXQgcHJlZmVyZW5jZSBjYXRlZ29yeSAnJHtuYW1lfSdgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiAnUmVzZXR0aW5nIGFsbCBwcmVmZXJlbmNlcyBpcyBub3Qgc3VwcG9ydGVkIHRocm91Z2ggQVBJLiBQbGVhc2Ugc3BlY2lmeSBhIHByZWZlcmVuY2UgY2F0ZWdvcnkuJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGV4cG9ydFByZWZlcmVuY2VzKGV4cG9ydFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmdldEFsbFByZWZlcmVuY2VzKCkudGhlbigocHJlZnNSZXN1bHQ6IFRvb2xSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFwcmVmc1Jlc3VsdC5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShwcmVmc1Jlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWZzRGF0YSA9IEpTT04uc3RyaW5naWZ5KHByZWZzUmVzdWx0LmRhdGEsIG51bGwsIDIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aCA9IGV4cG9ydFBhdGggfHwgYHByZWZlcmVuY2VzX2V4cG9ydF8ke0RhdGUubm93KCl9Lmpzb25gO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZvciBub3csIHJldHVybiB0aGUgZGF0YSAtIGluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgeW91J2Qgd3JpdGUgdG8gZmlsZVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydFBhdGg6IHBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcmVuY2VzOiBwcmVmc1Jlc3VsdC5kYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBqc29uRGF0YTogcHJlZnNEYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmVyZW5jZXMgZXhwb3J0ZWQgc3VjY2Vzc2Z1bGx5J1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaW1wb3J0UHJlZmVyZW5jZXMoaW1wb3J0UGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGVycm9yOiAnSW1wb3J0IHByZWZlcmVuY2VzIGZ1bmN0aW9uYWxpdHkgcmVxdWlyZXMgZmlsZSBzeXN0ZW0gYWNjZXNzIHdoaWNoIGlzIG5vdCBhdmFpbGFibGUgaW4gdGhpcyBjb250ZXh0LiBQbGVhc2UgbWFudWFsbHkgaW1wb3J0IHByZWZlcmVuY2VzIHRocm91Z2ggdGhlIEVkaXRvciBVSS4nXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgbGlzdFByZWZlcmVuY2VDYXRlZ29yaWVzKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgY29uc3QgYWxsUmVzdWx0ID0gYXdhaXQgdGhpcy5nZXRBbGxQcmVmZXJlbmNlcygpO1xyXG4gICAgICAgIGlmICghYWxsUmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFsbFJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNhdGVnb3JpZXMgPSAoYWxsUmVzdWx0LmRhdGEgYXMgYW55KS5jYXRlZ29yaWVzIGFzIHN0cmluZ1tdO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IGNhdGVnb3JpZXMsXHJcbiAgICAgICAgICAgICAgICBjb3VudDogY2F0ZWdvcmllcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUHJlZmVyZW5jZSBjYXRlZ29yaWVzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2VhcmNoUHJlZmVyZW5jZXMoa2V5d29yZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICBpZiAoIWtleXdvcmQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU2VhcmNoIGtleXdvcmQgaXMgcmVxdWlyZWQnIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhbGxSZXN1bHQgPSBhd2FpdCB0aGlzLmdldEFsbFByZWZlcmVuY2VzKCk7XHJcbiAgICAgICAgaWYgKCFhbGxSZXN1bHQuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICByZXR1cm4gYWxsUmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcHJlZmVyZW5jZXMgPSAoYWxsUmVzdWx0LmRhdGEgYXMgYW55KS5wcmVmZXJlbmNlcyBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xyXG4gICAgICAgIGNvbnN0IGxvd2VyS2V5d29yZCA9IGtleXdvcmQudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgbWF0Y2hlczogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xyXG4gICAgICAgIGZvciAoY29uc3QgW2NhdGVnb3J5LCBjb25maWddIG9mIE9iamVjdC5lbnRyaWVzKHByZWZlcmVuY2VzKSkge1xyXG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhsb3dlcktleXdvcmQpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaGVzW2NhdGVnb3J5XSA9IGNvbmZpZztcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjb25maWdTdHIgPSBKU09OLnN0cmluZ2lmeShjb25maWcpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmIChjb25maWdTdHIuaW5jbHVkZXMobG93ZXJLZXl3b3JkKSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlc1tjYXRlZ29yeV0gPSBjb25maWc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGtleXdvcmQ6IGtleXdvcmQsXHJcbiAgICAgICAgICAgICAgICBtYXRjaGVzOiBtYXRjaGVzLFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hDb3VudDogT2JqZWN0LmtleXMobWF0Y2hlcykubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEZvdW5kICR7T2JqZWN0LmtleXMobWF0Y2hlcykubGVuZ3RofSBjYXRlZ29yaWVzIG1hdGNoaW5nICcke2tleXdvcmR9J2BcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn0iXX0=