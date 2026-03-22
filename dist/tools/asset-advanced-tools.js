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
exports.AssetAdvancedTools = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AssetAdvancedTools {
    getTools() {
        return [
            {
                name: 'asset_manage',
                description: '资源管理：导入、删除资源，保存元数据，生成可用URL',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['import', 'delete', 'save_meta', 'generate_url'],
                            description: '操作类型'
                        },
                        assetPath: {
                            type: 'string',
                            description: '资源路径'
                        },
                        urlOrUUID: {
                            type: 'string',
                            description: '资源URL或UUID（save_meta 时使用）'
                        },
                        content: {
                            type: 'string',
                            description: '元数据内容（save_meta 时使用）'
                        },
                        url: {
                            type: 'string',
                            description: '资源URL（generate_url 时使用）'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_analyze',
                description: '资源分析：获取资源依赖关系、获取未使用资源列表',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_dependencies', 'get_unused'],
                            description: '操作类型'
                        },
                        assetUuid: {
                            type: 'string',
                            description: '资源UUID（get_dependencies 时使用）'
                        },
                        assetPath: {
                            type: 'string',
                            description: '资源路径'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_system',
                description: '资源系统：检查资源数据库状态、刷新资源数据库、用外部程序打开资源',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['check_db_ready', 'refresh', 'open_external'],
                            description: '操作类型'
                        },
                        assetPath: {
                            type: 'string',
                            description: '资源路径（open_external 时使用）'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_query',
                description: '资源查询：搜索资源、获取资源详情',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_info', 'search'],
                            description: '操作类型'
                        },
                        assetPath: {
                            type: 'string',
                            description: '资源路径'
                        },
                        pattern: {
                            type: 'string',
                            description: '搜索模式（如 db://assets/**/*.png）'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'asset_operations',
                description: '资源文件操作：创建、复制、移动、删除、保存、导入资源',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['create', 'copy', 'move', 'delete', 'save', 'import'],
                            description: '操作类型'
                        },
                        sourcePath: {
                            type: 'string',
                            description: '源路径'
                        },
                        targetPath: {
                            type: 'string',
                            description: '目标路径'
                        },
                        content: {
                            type: 'string',
                            description: '文件内容（create 时使用）'
                        },
                        overwrite: {
                            type: 'boolean',
                            description: '是否覆盖',
                            default: false
                        }
                    },
                    required: ['action']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'asset_manage':
                return await this.handleAssetManage(args.action, args);
            case 'asset_analyze':
                return await this.handleAssetAnalyze(args.action, args);
            case 'asset_system':
                return await this.handleAssetSystem(args.action, args);
            case 'asset_query':
                return await this.handleAssetQuery(args.action, args);
            case 'asset_operations':
                return await this.handleAssetOperations(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async handleAssetManage(action, args) {
        switch (action) {
            case 'import': return await this.importAsset(args.assetPath);
            case 'delete': return await this.deleteAsset(args.assetPath);
            case 'save_meta': return await this.saveAssetMeta(args.urlOrUUID, args.content);
            case 'generate_url': return await this.generateAvailableUrl(args.url);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handleAssetAnalyze(action, args) {
        switch (action) {
            case 'get_dependencies': return await this.getAssetDependencies(args.assetUuid);
            case 'get_unused': return await this.getUnusedAssets(args.assetPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handleAssetSystem(action, args) {
        switch (action) {
            case 'check_db_ready': return await this.queryAssetDbReady();
            case 'refresh': return await this.refreshAsset(args.assetPath);
            case 'open_external': return await this.openAssetExternal(args.assetPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handleAssetQuery(action, args) {
        switch (action) {
            case 'get_info': return await this.getAssetInfo(args.assetPath);
            case 'search': return await this.queryAssets(args.pattern);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async handleAssetOperations(action, args) {
        switch (action) {
            case 'create': return await this.createAsset(args.targetPath, args.content, args.overwrite);
            case 'copy': return await this.copyAsset(args.sourcePath, args.targetPath, args.overwrite);
            case 'move': return await this.moveAsset(args.sourcePath, args.targetPath, args.overwrite);
            case 'delete': return await this.deleteAsset(args.targetPath);
            case 'save': return await this.saveAsset(args.targetPath, args.content);
            case 'import': return await this.importAssetFile(args.sourcePath, args.targetPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }
    async importAsset(assetPath) {
        return new Promise((resolve) => {
            if (!fs.existsSync(assetPath)) {
                resolve({ success: false, error: 'Source file not found' });
                return;
            }
            const fileName = path.basename(assetPath);
            const targetPath = `db://assets/${fileName}`;
            Editor.Message.request('asset-db', 'import-asset', assetPath, targetPath).then((result) => {
                resolve({
                    success: true,
                    data: {
                        uuid: result.uuid,
                        path: result.url,
                        message: `Asset imported: ${fileName}`
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async deleteAsset(assetPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'delete-asset', assetPath).then(() => {
                resolve({
                    success: true,
                    data: { path: assetPath, message: 'Asset deleted successfully' }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async saveAssetMeta(urlOrUUID, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', urlOrUUID, content).then(() => {
                resolve({
                    success: true,
                    data: { path: urlOrUUID, message: 'Asset meta saved successfully' }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async generateAvailableUrl(url) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-url', url).then((resultUrl) => {
                resolve({
                    success: true,
                    data: {
                        url: resultUrl,
                        message: 'Available URL generated'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getAssetDependencies(assetUuid) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetUuid).then((assetInfo) => {
                resolve({
                    success: true,
                    data: {
                        uuid: assetUuid,
                        info: assetInfo
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getUnusedAssets(assetPath) {
        return new Promise((resolve) => {
            const folder = assetPath || 'db://assets';
            Editor.Message.request('asset-db', 'query-assets', { pattern: `${folder}/**/*.prefab` }).then((results) => {
                resolve({
                    success: true,
                    data: {
                        path: folder,
                        assets: results.map(a => ({ name: a.name, uuid: a.uuid, path: a.url })),
                        message: 'Asset list retrieved for analysis'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryAssetDbReady() {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-ready').then((ready) => {
                resolve({
                    success: true,
                    data: { ready, message: `Asset database ready: ${ready}` }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async refreshAsset(assetPath) {
        return new Promise((resolve) => {
            const targetPath = assetPath || 'db://assets';
            Editor.Message.request('asset-db', 'refresh-asset', targetPath).then(() => {
                resolve({
                    success: true,
                    message: `Assets refreshed in: ${targetPath}`
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async openAssetExternal(assetPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetPath).then((assetInfo) => {
                if (!assetInfo) {
                    resolve({ success: false, error: 'Asset not found' });
                    return;
                }
                const fullPath = path.join(Editor.Project.path, assetInfo.path || '');
                resolve({
                    success: true,
                    data: { path: fullPath, message: `Opening asset externally: ${assetPath}` }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async getAssetInfo(assetPath) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetPath).then((assetInfo) => {
                if (!assetInfo) {
                    resolve({ success: false, error: 'Asset not found' });
                    return;
                }
                const info = {
                    name: assetInfo.name,
                    uuid: assetInfo.uuid,
                    path: assetInfo.url,
                    type: assetInfo.type,
                    size: assetInfo.size,
                    isDirectory: assetInfo.isDirectory
                };
                if (assetInfo.meta) {
                    info.meta = { ver: assetInfo.meta.ver, importer: assetInfo.meta.importer };
                }
                resolve({ success: true, data: info });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async queryAssets(pattern) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-assets', { pattern: pattern }).then((results) => {
                const assets = results.map(asset => ({
                    name: asset.name,
                    uuid: asset.uuid,
                    path: asset.url,
                    type: asset.type,
                    size: asset.size || 0,
                    isDirectory: asset.isDirectory || false
                }));
                resolve({
                    success: true,
                    data: { pattern, count: assets.length, assets }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async createAsset(url, content = null, overwrite = false) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'create-asset', url, content, { overwrite, rename: !overwrite }).then((result) => {
                resolve({
                    success: true,
                    data: {
                        uuid: result === null || result === void 0 ? void 0 : result.uuid,
                        url: (result === null || result === void 0 ? void 0 : result.url) || url,
                        message: content === null ? 'Folder created successfully' : 'File created successfully'
                    }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async copyAsset(source, target, overwrite = false) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'copy-asset', source, target, { overwrite, rename: !overwrite }).then((result) => {
                resolve({
                    success: true,
                    data: { uuid: result === null || result === void 0 ? void 0 : result.uuid, url: (result === null || result === void 0 ? void 0 : result.url) || target, message: 'Asset copied successfully' }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async moveAsset(source, target, overwrite = false) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'move-asset', source, target, { overwrite, rename: !overwrite }).then((result) => {
                resolve({
                    success: true,
                    data: { uuid: result === null || result === void 0 ? void 0 : result.uuid, url: (result === null || result === void 0 ? void 0 : result.url) || target, message: 'Asset moved successfully' }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async saveAsset(url, content) {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', url, content).then((result) => {
                resolve({
                    success: true,
                    data: { uuid: result === null || result === void 0 ? void 0 : result.uuid, url: (result === null || result === void 0 ? void 0 : result.url) || url, message: 'Asset saved successfully' }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
    async importAssetFile(sourcePath, targetPath) {
        return new Promise((resolve) => {
            if (!fs.existsSync(sourcePath)) {
                resolve({ success: false, error: 'Source file not found' });
                return;
            }
            const fileName = path.basename(sourcePath);
            const target = targetPath.startsWith('db://') ? targetPath : `db://assets/${targetPath}`;
            Editor.Message.request('asset-db', 'import-asset', sourcePath, `${target}/${fileName}`).then((result) => {
                resolve({
                    success: true,
                    data: { uuid: result.uuid, path: result.url, message: `Asset imported: ${fileName}` }
                });
            }).catch((err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}
exports.AssetAdvancedTools = AssetAdvancedTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUU3QixNQUFhLGtCQUFrQjtJQUMzQixRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxjQUFjO2dCQUNwQixXQUFXLEVBQUUsNEJBQTRCO2dCQUN6QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUM7NEJBQ3ZELFdBQVcsRUFBRSxNQUFNO3lCQUN0Qjt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLE1BQU07eUJBQ3RCO3dCQUNELFNBQVMsRUFBRTs0QkFDUCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUsMkJBQTJCO3lCQUMzQzt3QkFDRCxPQUFPLEVBQUU7NEJBQ0wsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLHNCQUFzQjt5QkFDdEM7d0JBQ0QsR0FBRyxFQUFFOzRCQUNELElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx5QkFBeUI7eUJBQ3pDO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztpQkFDdkI7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxlQUFlO2dCQUNyQixXQUFXLEVBQUUseUJBQXlCO2dCQUN0QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1B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QUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLGVBQWUsVUFBVSxFQUFFLENBQUM7WUFDekYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFXLEVBQUUsRUFBRTtnQkFDekcsT0FBTyxDQUFDO29CQUNKLE9BQU8sRUFBRSxJQUFJO29CQUNiLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsUUFBUSxFQUFFLEVBQUU7aUJBQ3hGLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFO2dCQUNwQixPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBaGRELGdEQWdkQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciwgQXNzZXRJbmZvIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIEFzc2V0QWR2YW5jZWRUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Fzc2V0X21hbmFnZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfotYTmupDnrqHnkIbvvJrlr7zlhaXjgIHliKDpmaTotYTmupDvvIzkv53lrZjlhYPmlbDmja7vvIznlJ/miJDlj6/nlKhVUkwnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2ltcG9ydCcsICdkZWxldGUnLCAnc2F2ZV9tZXRhJywgJ2dlbmVyYXRlX3VybCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pON5L2c57G75Z6LJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0UGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6LWE5rqQ6Lev5b6EJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6LWE5rqQVVJM5oiWVVVJRO+8iHNhdmVfbWV0YSDml7bkvb/nlKjvvIknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5YWD5pWw5o2u5YaF5a6577yIc2F2ZV9tZXRhIOaXtuS9v+eUqO+8iSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+i1hOa6kFVSTO+8iGdlbmVyYXRlX3VybCDml7bkvb/nlKjvvIknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYXNzZXRfYW5hbHl6ZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfotYTmupDliIbmnpDvvJrojrflj5botYTmupDkvp3otZblhbPns7vjgIHojrflj5bmnKrkvb/nlKjotYTmupDliJfooagnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2dldF9kZXBlbmRlbmNpZXMnLCAnZ2V0X3VudXNlZCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pON5L2c57G75Z6LJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6LWE5rqQVVVJRO+8iGdldF9kZXBlbmRlbmNpZXMg5pe25L2/55So77yJJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0UGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6LWE5rqQ6Lev5b6EJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Fzc2V0X3N5c3RlbScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfotYTmupDns7vnu5/vvJrmo4Dmn6XotYTmupDmlbDmja7lupPnirbmgIHjgIHliLfmlrDotYTmupDmlbDmja7lupPjgIHnlKjlpJbpg6jnqIvluo/miZPlvIDotYTmupAnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2NoZWNrX2RiX3JlYWR5JywgJ3JlZnJlc2gnLCAnb3Blbl9leHRlcm5hbCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5pON5L2c57G75Z6LJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0UGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6LWE5rqQ6Lev5b6E77yIb3Blbl9leHRlcm5hbCDml7bkvb/nlKjvvIknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYXNzZXRfcXVlcnknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn6LWE5rqQ5p+l6K+i77ya5pCc57Si6LWE5rqQ44CB6I635Y+W6LWE5rqQ6K+m5oOFJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydnZXRfaW5mbycsICdzZWFyY2gnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aTjeS9nOexu+WeiydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+i1hOa6kOi3r+W+hCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmkJzntKLmqKHlvI/vvIjlpoIgZGI6Ly9hc3NldHMvKiovKi5wbmfvvIknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYXNzZXRfb3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfotYTmupDmlofku7bmk43kvZzvvJrliJvlu7rjgIHlpI3liLbjgIHnp7vliqjjgIHliKDpmaTjgIHkv53lrZjjgIHlr7zlhaXotYTmupAnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2NyZWF0ZScsICdjb3B5JywgJ21vdmUnLCAnZGVsZXRlJywgJ3NhdmUnLCAnaW1wb3J0J10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmk43kvZznsbvlnosnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlUGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAn5rqQ6Lev5b6EJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+ebruagh+i3r+W+hCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICfmlofku7blhoXlrrnvvIhjcmVhdGUg5pe25L2/55So77yJJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJ3cml0ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ+aYr+WQpuimhueblicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdhc3NldF9tYW5hZ2UnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUFzc2V0TWFuYWdlKGFyZ3MuYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2Fzc2V0X2FuYWx5emUnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUFzc2V0QW5hbHl6ZShhcmdzLmFjdGlvbiwgYXJncyk7XG4gICAgICAgICAgICBjYXNlICdhc3NldF9zeXN0ZW0nOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUFzc2V0U3lzdGVtKGFyZ3MuYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2Fzc2V0X3F1ZXJ5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVBc3NldFF1ZXJ5KGFyZ3MuYWN0aW9uLCBhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2Fzc2V0X29wZXJhdGlvbnMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUFzc2V0T3BlcmF0aW9ucyhhcmdzLmFjdGlvbiwgYXJncyk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBc3NldE1hbmFnZShhY3Rpb246IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2ltcG9ydCc6IHJldHVybiBhd2FpdCB0aGlzLmltcG9ydEFzc2V0KGFyZ3MuYXNzZXRQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6IHJldHVybiBhd2FpdCB0aGlzLmRlbGV0ZUFzc2V0KGFyZ3MuYXNzZXRQYXRoKTtcbiAgICAgICAgICAgIGNhc2UgJ3NhdmVfbWV0YSc6IHJldHVybiBhd2FpdCB0aGlzLnNhdmVBc3NldE1ldGEoYXJncy51cmxPclVVSUQsIGFyZ3MuY29udGVudCk7XG4gICAgICAgICAgICBjYXNlICdnZW5lcmF0ZV91cmwnOiByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZUF2YWlsYWJsZVVybChhcmdzLnVybCk7XG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBc3NldEFuYWx5emUoYWN0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfZGVwZW5kZW5jaWVzJzogcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QXNzZXREZXBlbmRlbmNpZXMoYXJncy5hc3NldFV1aWQpO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X3VudXNlZCc6IHJldHVybiBhd2FpdCB0aGlzLmdldFVudXNlZEFzc2V0cyhhcmdzLmFzc2V0UGF0aCk7XG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVBc3NldFN5c3RlbShhY3Rpb246IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgIGNhc2UgJ2NoZWNrX2RiX3JlYWR5JzogcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldERiUmVhZHkoKTtcbiAgICAgICAgICAgIGNhc2UgJ3JlZnJlc2gnOiByZXR1cm4gYXdhaXQgdGhpcy5yZWZyZXNoQXNzZXQoYXJncy5hc3NldFBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnb3Blbl9leHRlcm5hbCc6IHJldHVybiBhd2FpdCB0aGlzLm9wZW5Bc3NldEV4dGVybmFsKGFyZ3MuYXNzZXRQYXRoKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYWN0aW9uOiAke2FjdGlvbn1gIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZUFzc2V0UXVlcnkoYWN0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlICdnZXRfaW5mbyc6IHJldHVybiBhd2FpdCB0aGlzLmdldEFzc2V0SW5mbyhhcmdzLmFzc2V0UGF0aCk7XG4gICAgICAgICAgICBjYXNlICdzZWFyY2gnOiByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeUFzc2V0cyhhcmdzLnBhdHRlcm4pO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgVW5rbm93biBhY3Rpb246ICR7YWN0aW9ufWAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlQXNzZXRPcGVyYXRpb25zKGFjdGlvbjogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnY3JlYXRlJzogcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlQXNzZXQoYXJncy50YXJnZXRQYXRoLCBhcmdzLmNvbnRlbnQsIGFyZ3Mub3ZlcndyaXRlKTtcbiAgICAgICAgICAgIGNhc2UgJ2NvcHknOiByZXR1cm4gYXdhaXQgdGhpcy5jb3B5QXNzZXQoYXJncy5zb3VyY2VQYXRoLCBhcmdzLnRhcmdldFBhdGgsIGFyZ3Mub3ZlcndyaXRlKTtcbiAgICAgICAgICAgIGNhc2UgJ21vdmUnOiByZXR1cm4gYXdhaXQgdGhpcy5tb3ZlQXNzZXQoYXJncy5zb3VyY2VQYXRoLCBhcmdzLnRhcmdldFBhdGgsIGFyZ3Mub3ZlcndyaXRlKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6IHJldHVybiBhd2FpdCB0aGlzLmRlbGV0ZUFzc2V0KGFyZ3MudGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICBjYXNlICdzYXZlJzogcmV0dXJuIGF3YWl0IHRoaXMuc2F2ZUFzc2V0KGFyZ3MudGFyZ2V0UGF0aCwgYXJncy5jb250ZW50KTtcbiAgICAgICAgICAgIGNhc2UgJ2ltcG9ydCc6IHJldHVybiBhd2FpdCB0aGlzLmltcG9ydEFzc2V0RmlsZShhcmdzLnNvdXJjZVBhdGgsIGFyZ3MudGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthY3Rpb259YCB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbXBvcnRBc3NldChhc3NldFBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGFzc2V0UGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU291cmNlIGZpbGUgbm90IGZvdW5kJyB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShhc3NldFBhdGgpO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IGBkYjovL2Fzc2V0cy8ke2ZpbGVOYW1lfWA7XG5cbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2ltcG9ydC1hc3NldCcsIGFzc2V0UGF0aCwgdGFyZ2V0UGF0aCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogcmVzdWx0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiByZXN1bHQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEFzc2V0IGltcG9ydGVkOiAke2ZpbGVOYW1lfWBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGRlbGV0ZUFzc2V0KGFzc2V0UGF0aDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdkZWxldGUtYXNzZXQnLCBhc3NldFBhdGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHBhdGg6IGFzc2V0UGF0aCwgbWVzc2FnZTogJ0Fzc2V0IGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5JyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZUFzc2V0TWV0YSh1cmxPclVVSUQ6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdzYXZlLWFzc2V0JywgdXJsT3JVVUlELCBjb250ZW50KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBwYXRoOiB1cmxPclVVSUQsIG1lc3NhZ2U6ICdBc3NldCBtZXRhIHNhdmVkIHN1Y2Nlc3NmdWxseScgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQXZhaWxhYmxlVXJsKHVybDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11cmwnLCB1cmwpLnRoZW4oKHJlc3VsdFVybDogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHJlc3VsdFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBdmFpbGFibGUgVVJMIGdlbmVyYXRlZCdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldEFzc2V0RGVwZW5kZW5jaWVzKGFzc2V0VXVpZDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgYXNzZXRVdWlkKS50aGVuKChhc3NldEluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvOiBhc3NldEluZm9cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFVudXNlZEFzc2V0cyhhc3NldFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlciA9IGFzc2V0UGF0aCB8fCAnZGI6Ly9hc3NldHMnO1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXRzJywgeyBwYXR0ZXJuOiBgJHtmb2xkZXJ9LyoqLyoucHJlZmFiYCB9KS50aGVuKChyZXN1bHRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBmb2xkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldHM6IHJlc3VsdHMubWFwKGEgPT4gKHsgbmFtZTogYS5uYW1lLCB1dWlkOiBhLnV1aWQsIHBhdGg6IGEudXJsIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBc3NldCBsaXN0IHJldHJpZXZlZCBmb3IgYW5hbHlzaXMnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUFzc2V0RGJSZWFkeSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXJlYWR5JykudGhlbigocmVhZHk6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyByZWFkeSwgbWVzc2FnZTogYEFzc2V0IGRhdGFiYXNlIHJlYWR5OiAke3JlYWR5fWAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlZnJlc2hBc3NldChhc3NldFBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBhc3NldFBhdGggfHwgJ2RiOi8vYXNzZXRzJztcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCB0YXJnZXRQYXRoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEFzc2V0cyByZWZyZXNoZWQgaW46ICR7dGFyZ2V0UGF0aH1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgb3BlbkFzc2V0RXh0ZXJuYWwoYXNzZXRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBhc3NldFBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0Fzc2V0IG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgYXNzZXRJbmZvLnBhdGggfHwgJycpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHBhdGg6IGZ1bGxQYXRoLCBtZXNzYWdlOiBgT3BlbmluZyBhc3NldCBleHRlcm5hbGx5OiAke2Fzc2V0UGF0aH1gIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBc3NldEluZm8oYXNzZXRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBhc3NldFBhdGgpLnRoZW4oKGFzc2V0SW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldEluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ0Fzc2V0IG5vdCBmb3VuZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mbzogQXNzZXRJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXRJbmZvLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGFzc2V0SW5mby51cmwsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0SW5mby50eXBlLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBhc3NldEluZm8uc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgaXNEaXJlY3Rvcnk6IGFzc2V0SW5mby5pc0RpcmVjdG9yeVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0SW5mby5tZXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZm8ubWV0YSA9IHsgdmVyOiBhc3NldEluZm8ubWV0YS52ZXIsIGltcG9ydGVyOiBhc3NldEluZm8ubWV0YS5pbXBvcnRlciB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogaW5mbyB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUFzc2V0cyhwYXR0ZXJuOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHsgcGF0dGVybjogcGF0dGVybiB9KS50aGVuKChyZXN1bHRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0cyA9IHJlc3VsdHMubWFwKGFzc2V0ID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogYXNzZXQuc2l6ZSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICBpc0RpcmVjdG9yeTogYXNzZXQuaXNEaXJlY3RvcnkgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgcGF0dGVybiwgY291bnQ6IGFzc2V0cy5sZW5ndGgsIGFzc2V0cyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY3JlYXRlQXNzZXQodXJsOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZyB8IG51bGwgPSBudWxsLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgdXJsLCBjb250ZW50LCB7IG92ZXJ3cml0ZSwgcmVuYW1lOiAhb3ZlcndyaXRlIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHJlc3VsdD8udXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogcmVzdWx0Py51cmwgfHwgdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogY29udGVudCA9PT0gbnVsbCA/ICdGb2xkZXIgY3JlYXRlZCBzdWNjZXNzZnVsbHknIDogJ0ZpbGUgY3JlYXRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjb3B5QXNzZXQoc291cmNlOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY29weS1hc3NldCcsIHNvdXJjZSwgdGFyZ2V0LCB7IG92ZXJ3cml0ZSwgcmVuYW1lOiAhb3ZlcndyaXRlIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgdXVpZDogcmVzdWx0Py51dWlkLCB1cmw6IHJlc3VsdD8udXJsIHx8IHRhcmdldCwgbWVzc2FnZTogJ0Fzc2V0IGNvcGllZCBzdWNjZXNzZnVsbHknIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBtb3ZlQXNzZXQoc291cmNlOiBzdHJpbmcsIHRhcmdldDogc3RyaW5nLCBvdmVyd3JpdGU6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnbW92ZS1hc3NldCcsIHNvdXJjZSwgdGFyZ2V0LCB7IG92ZXJ3cml0ZSwgcmVuYW1lOiAhb3ZlcndyaXRlIH0pLnRoZW4oKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgdXVpZDogcmVzdWx0Py51dWlkLCB1cmw6IHJlc3VsdD8udXJsIHx8IHRhcmdldCwgbWVzc2FnZTogJ0Fzc2V0IG1vdmVkIHN1Y2Nlc3NmdWxseScgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHNhdmVBc3NldCh1cmw6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdzYXZlLWFzc2V0JywgdXJsLCBjb250ZW50KS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IHV1aWQ6IHJlc3VsdD8udXVpZCwgdXJsOiByZXN1bHQ/LnVybCB8fCB1cmwsIG1lc3NhZ2U6ICdBc3NldCBzYXZlZCBzdWNjZXNzZnVsbHknIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBpbXBvcnRBc3NldEZpbGUoc291cmNlUGF0aDogc3RyaW5nLCB0YXJnZXRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhzb3VyY2VQYXRoKSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdTb3VyY2UgZmlsZSBub3QgZm91bmQnIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHRhcmdldFBhdGguc3RhcnRzV2l0aCgnZGI6Ly8nKSA/IHRhcmdldFBhdGggOiBgZGI6Ly9hc3NldHMvJHt0YXJnZXRQYXRofWA7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbXBvcnQtYXNzZXQnLCBzb3VyY2VQYXRoLCBgJHt0YXJnZXR9LyR7ZmlsZU5hbWV9YCkudGhlbigocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogeyB1dWlkOiByZXN1bHQudXVpZCwgcGF0aDogcmVzdWx0LnVybCwgbWVzc2FnZTogYEFzc2V0IGltcG9ydGVkOiAke2ZpbGVOYW1lfWAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=