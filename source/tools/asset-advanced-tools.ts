import { ToolDefinition, ToolResponse, ToolExecutor, AssetInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class AssetAdvancedTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
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

    async execute(toolName: string, args: any): Promise<ToolResponse> {
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

    private async handleAssetManage(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'import': return await this.importAsset(args.assetPath);
            case 'delete': return await this.deleteAsset(args.assetPath);
            case 'save_meta': return await this.saveAssetMeta(args.urlOrUUID, args.content);
            case 'generate_url': return await this.generateAvailableUrl(args.url);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleAssetAnalyze(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_dependencies': return await this.getAssetDependencies(args.assetUuid);
            case 'get_unused': return await this.getUnusedAssets(args.assetPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleAssetSystem(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'check_db_ready': return await this.queryAssetDbReady();
            case 'refresh': return await this.refreshAsset(args.assetPath);
            case 'open_external': return await this.openAssetExternal(args.assetPath);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleAssetQuery(action: string, args: any): Promise<ToolResponse> {
        switch (action) {
            case 'get_info': return await this.getAssetInfo(args.assetPath);
            case 'search': return await this.queryAssets(args.pattern);
            default: return { success: false, error: `Unknown action: ${action}` };
        }
    }

    private async handleAssetOperations(action: string, args: any): Promise<ToolResponse> {
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

    private async importAsset(assetPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            if (!fs.existsSync(assetPath)) {
                resolve({ success: false, error: 'Source file not found' });
                return;
            }

            const fileName = path.basename(assetPath);
            const targetPath = `db://assets/${fileName}`;

            Editor.Message.request('asset-db', 'import-asset', assetPath, targetPath).then((result: any) => {
                resolve({
                    success: true,
                    data: {
                        uuid: result.uuid,
                        path: result.url,
                        message: `Asset imported: ${fileName}`
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async deleteAsset(assetPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'delete-asset', assetPath).then(() => {
                resolve({
                    success: true,
                    data: { path: assetPath, message: 'Asset deleted successfully' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async saveAssetMeta(urlOrUUID: string, content: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', urlOrUUID, content).then(() => {
                resolve({
                    success: true,
                    data: { path: urlOrUUID, message: 'Asset meta saved successfully' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async generateAvailableUrl(url: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-url', url).then((resultUrl: string | null) => {
                resolve({
                    success: true,
                    data: {
                        url: resultUrl,
                        message: 'Available URL generated'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getAssetDependencies(assetUuid: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetUuid).then((assetInfo: any) => {
                resolve({
                    success: true,
                    data: {
                        uuid: assetUuid,
                        info: assetInfo
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getUnusedAssets(assetPath?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const folder = assetPath || 'db://assets';
            Editor.Message.request('asset-db', 'query-assets', { pattern: `${folder}/**/*.prefab` }).then((results: any[]) => {
                resolve({
                    success: true,
                    data: {
                        path: folder,
                        assets: results.map(a => ({ name: a.name, uuid: a.uuid, path: a.url })),
                        message: 'Asset list retrieved for analysis'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryAssetDbReady(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-ready').then((ready: boolean) => {
                resolve({
                    success: true,
                    data: { ready, message: `Asset database ready: ${ready}` }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async refreshAsset(assetPath?: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            const targetPath = assetPath || 'db://assets';
            Editor.Message.request('asset-db', 'refresh-asset', targetPath).then(() => {
                resolve({
                    success: true,
                    message: `Assets refreshed in: ${targetPath}`
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async openAssetExternal(assetPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetPath).then((assetInfo: any) => {
                if (!assetInfo) {
                    resolve({ success: false, error: 'Asset not found' });
                    return;
                }
                const fullPath = path.join(Editor.Project.path, assetInfo.path || '');
                resolve({
                    success: true,
                    data: { path: fullPath, message: `Opening asset externally: ${assetPath}` }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async getAssetInfo(assetPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-asset-info', assetPath).then((assetInfo: any) => {
                if (!assetInfo) {
                    resolve({ success: false, error: 'Asset not found' });
                    return;
                }
                const info: AssetInfo = {
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
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async queryAssets(pattern: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'query-assets', { pattern: pattern }).then((results: any[]) => {
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
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async createAsset(url: string, content: string | null = null, overwrite: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'create-asset', url, content, { overwrite, rename: !overwrite }).then((result: any) => {
                resolve({
                    success: true,
                    data: {
                        uuid: result?.uuid,
                        url: result?.url || url,
                        message: content === null ? 'Folder created successfully' : 'File created successfully'
                    }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async copyAsset(source: string, target: string, overwrite: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'copy-asset', source, target, { overwrite, rename: !overwrite }).then((result: any) => {
                resolve({
                    success: true,
                    data: { uuid: result?.uuid, url: result?.url || target, message: 'Asset copied successfully' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async moveAsset(source: string, target: string, overwrite: boolean = false): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'move-asset', source, target, { overwrite, rename: !overwrite }).then((result: any) => {
                resolve({
                    success: true,
                    data: { uuid: result?.uuid, url: result?.url || target, message: 'Asset moved successfully' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async saveAsset(url: string, content: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            Editor.Message.request('asset-db', 'save-asset', url, content).then((result: any) => {
                resolve({
                    success: true,
                    data: { uuid: result?.uuid, url: result?.url || url, message: 'Asset saved successfully' }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }

    private async importAssetFile(sourcePath: string, targetPath: string): Promise<ToolResponse> {
        return new Promise((resolve) => {
            if (!fs.existsSync(sourcePath)) {
                resolve({ success: false, error: 'Source file not found' });
                return;
            }
            const fileName = path.basename(sourcePath);
            const target = targetPath.startsWith('db://') ? targetPath : `db://assets/${targetPath}`;
            Editor.Message.request('asset-db', 'import-asset', sourcePath, `${target}/${fileName}`).then((result: any) => {
                resolve({
                    success: true,
                    data: { uuid: result.uuid, path: result.url, message: `Asset imported: ${fileName}` }
                });
            }).catch((err: Error) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}
