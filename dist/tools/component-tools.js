"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentTools = void 0;
class ComponentTools {
    getTools() {
        return [
            {
                name: 'component_manage',
                description: 'Add or remove a component on a node. Use action "add" to add a component, action "remove" to remove one. For remove, componentType must be the component\'s classId (cid, i.e. the type field from getComponents), not the script name or class name.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['add', 'remove'],
                            description: 'Action to perform: add or remove a component'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Target node UUID. Use get_all_nodes or find_node_by_name to get the UUID of the desired node.'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component type (e.g., cc.Sprite, cc.Label, cc.Button). For remove, use the component cid (type field from getComponents).'
                        }
                    },
                    required: ['action', 'nodeUuid', 'componentType']
                }
            },
            {
                name: 'component_script',
                description: 'Attach or detach a script component to/from a node. Use action "attach" to attach a script, action "detach" to detach one.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['attach', 'detach'],
                            description: 'Action to perform: attach or detach a script component'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID'
                        },
                        scriptPath: {
                            type: 'string',
                            description: 'Script asset path (e.g., db://assets/scripts/MyScript.ts). Required for attach.'
                        },
                        scriptName: {
                            type: 'string',
                            description: 'Script component name to detach. Required for detach.'
                        }
                    },
                    required: ['action', 'nodeUuid']
                }
            },
            {
                name: 'component_query',
                description: 'Query component information. Use action "get_all" to get all components of a node, "get_info" to get specific component info, "get_available" to list available component types by category.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['get_all', 'get_info', 'get_available'],
                            description: 'Query action: get_all, get_info, or get_available'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID. Required for get_all and get_info.'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component type to get info for. Required for get_info.'
                        },
                        category: {
                            type: 'string',
                            description: 'Component category filter. Required for get_available.',
                            enum: ['all', 'renderer', 'ui', 'physics', 'animation', 'audio'],
                            default: 'all'
                        }
                    },
                    required: ['action']
                }
            },
            {
                name: 'set_component_property',
                description: 'Set component property values for UI components or custom script components. Supports setting properties of built-in UI components (e.g., cc.Label, cc.Sprite) and custom script components. Note: For node basic properties (name, active, layer, etc.), use set_node_property. For node transform properties (position, rotation, scale, etc.), use set_node_transform.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        nodeUuid: {
                            type: 'string',
                            description: 'Target node UUID - Must specify the node to operate on'
                        },
                        componentType: {
                            type: 'string',
                            description: 'Component type - Can be built-in components (e.g., cc.Label) or custom script components (e.g., MyScript). If unsure about component type, use get_components first to retrieve all components on the node.',
                            // 移除enum限制，允许任意组件类型包括自定义脚本
                        },
                        property: {
                            type: 'string',
                            description: 'Property name - The property to set. Common properties include:\n' +
                                '• cc.Label: string (text content), fontSize (font size), color (text color)\n' +
                                '• cc.Sprite: spriteFrame (sprite frame), color (tint color), sizeMode (size mode)\n' +
                                '• cc.Button: normalColor (normal color), pressedColor (pressed color), target (target node)\n' +
                                '• cc.UITransform: contentSize (content size), anchorPoint (anchor point)\n' +
                                '• Custom Scripts: Based on properties defined in the script'
                        },
                        propertyType: {
                            type: 'string',
                            description: 'Property type - Must explicitly specify the property data type for correct value conversion and validation',
                            enum: [
                                'string', 'number', 'boolean', 'integer', 'float',
                                'color', 'vec2', 'vec3', 'size',
                                'node', 'component', 'spriteFrame', 'prefab', 'asset',
                                'nodeArray', 'colorArray', 'numberArray', 'stringArray'
                            ]
                        },
                        value: {
                            description: 'Property value - Use the corresponding data format based on propertyType:\n\n' +
                                '📝 Basic Data Types:\n' +
                                '• string: "Hello World" (text string)\n' +
                                '• number/integer/float: 42 or 3.14 (numeric value)\n' +
                                '• boolean: true or false (boolean value)\n\n' +
                                '🎨 Color Type:\n' +
                                '• color: {"r":255,"g":0,"b":0,"a":255} (RGBA values, range 0-255)\n' +
                                '  - Alternative: "#FF0000" (hexadecimal format)\n' +
                                '  - Transparency: a value controls opacity, 255 = fully opaque, 0 = fully transparent\n\n' +
                                '📐 Vector and Size Types:\n' +
                                '• vec2: {"x":100,"y":50} (2D vector)\n' +
                                '• vec3: {"x":1,"y":2,"z":3} (3D vector)\n' +
                                '• size: {"width":100,"height":50} (size dimensions)\n\n' +
                                '🔗 Reference Types (using UUID strings):\n' +
                                '• node: "target-node-uuid" (node reference)\n' +
                                '  How to get: Use get_all_nodes or find_node_by_name to get node UUIDs\n' +
                                '• component: "target-node-uuid" (component reference)\n' +
                                '  How it works: \n' +
                                '    1. Provide the UUID of the NODE that contains the target component\n' +
                                '    2. System auto-detects required component type from property metadata\n' +
                                '    3. Finds the component on target node and gets its scene __id__\n' +
                                '    4. Sets reference using the scene __id__ (not node UUID)\n' +
                                '  Example: value="label-node-uuid" will find cc.Label and use its scene ID\n' +
                                '• spriteFrame: "spriteframe-uuid" (sprite frame asset)\n' +
                                '  How to get: Check asset database or use asset browser\n' +
                                '• prefab: "prefab-uuid" (prefab asset)\n' +
                                '  How to get: Check asset database or use asset browser\n' +
                                '• asset: "asset-uuid" (generic asset reference)\n' +
                                '  How to get: Check asset database or use asset browser\n\n' +
                                '📋 Array Types:\n' +
                                '• nodeArray: ["uuid1","uuid2"] (array of node UUIDs)\n' +
                                '• colorArray: [{"r":255,"g":0,"b":0,"a":255}] (array of colors)\n' +
                                '• numberArray: [1,2,3,4,5] (array of numbers)\n' +
                                '• stringArray: ["item1","item2"] (array of strings)'
                        }
                    },
                    required: ['nodeUuid', 'componentType', 'property', 'propertyType', 'value']
                }
            },
            {
                name: 'configure_click_event',
                description: 'Configure or remove click events on a cc.Button component. Use action "set" to configure a click event handler, action "remove" to clear all click events.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        action: {
                            type: 'string',
                            enum: ['set', 'remove'],
                            description: 'Action: set a click event handler or remove all click events'
                        },
                        nodeUuid: {
                            type: 'string',
                            description: 'Node UUID of the node with the cc.Button component'
                        },
                        targetNodeUuid: {
                            type: 'string',
                            description: 'UUID of the target node containing the script component. Required for set.'
                        },
                        scriptComponentType: {
                            type: 'string',
                            description: 'Script component type name on the target node. Required for set.'
                        },
                        methodName: {
                            type: 'string',
                            description: 'Method name to call when button is clicked. Required for set.'
                        },
                        customEventData: {
                            type: 'string',
                            description: 'Optional custom event data string passed to the handler'
                        }
                    },
                    required: ['action', 'nodeUuid']
                }
            }
        ];
    }
    async execute(toolName, args) {
        switch (toolName) {
            case 'component_manage':
                switch (args.action) {
                    case 'add':
                        return await this.addComponent(args.nodeUuid, args.componentType);
                    case 'remove':
                        return await this.removeComponent(args.nodeUuid, args.componentType);
                    default:
                        return { success: false, error: `Unknown action: ${args.action}. Use "add" or "remove".` };
                }
            case 'component_script':
                switch (args.action) {
                    case 'attach':
                        return await this.attachScript(args.nodeUuid, args.scriptPath);
                    case 'detach':
                        return await this.detachScript(args.nodeUuid, args.scriptName);
                    default:
                        return { success: false, error: `Unknown action: ${args.action}. Use "attach" or "detach".` };
                }
            case 'component_query':
                switch (args.action) {
                    case 'get_all':
                        return await this.getComponents(args.nodeUuid);
                    case 'get_info':
                        return await this.getComponentInfo(args.nodeUuid, args.componentType);
                    case 'get_available':
                        return await this.getAvailableComponents(args.category);
                    default:
                        return { success: false, error: `Unknown action: ${args.action}. Use "get_all", "get_info", or "get_available".` };
                }
            case 'set_component_property':
                return await this.setComponentProperty(args);
            case 'configure_click_event':
                return await this.configureClickEvent(args.action, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    async detachScript(nodeUuid, scriptName) {
        return await this.removeComponent(nodeUuid, scriptName);
    }
    async configureClickEvent(action, args) {
        if (action === 'remove') {
            // Set _clickEvents to empty array on cc.Button component
            return await this.setButtonProperty(args.nodeUuid, '_clickEvents', 'nodeArray', []);
        }
        // action === 'set'
        const clickEvent = [{
                target: { __uuid__: args.targetNodeUuid },
                component: args.scriptComponentType,
                handler: args.methodName,
                customEventData: args.customEventData || ''
            }];
        return await this.setButtonProperty(args.nodeUuid, '_clickEvents', 'nodeArray', clickEvent);
    }
    async setButtonProperty(nodeUuid, property, propertyType, value) {
        return await this.setComponentProperty({
            nodeUuid,
            componentType: 'cc.Button',
            property,
            propertyType,
            value
        });
    }
    async addComponent(nodeUuid, componentType) {
        return new Promise(async (resolve) => {
            var _a;
            // 先查找节点上是否已存在该组件
            const allComponentsInfo = await this.getComponents(nodeUuid);
            if (allComponentsInfo.success && ((_a = allComponentsInfo.data) === null || _a === void 0 ? void 0 : _a.components)) {
                const existingComponent = allComponentsInfo.data.components.find((comp) => comp.type === componentType);
                if (existingComponent) {
                    resolve({
                        success: true,
                        message: `Component '${componentType}' already exists on node`,
                        data: {
                            nodeUuid: nodeUuid,
                            componentType: componentType,
                            componentVerified: true,
                            existing: true
                        }
                    });
                    return;
                }
            }
            // 尝试直接使用 Editor API 添加组件
            Editor.Message.request('scene', 'create-component', {
                uuid: nodeUuid,
                component: componentType
            }).then(async (result) => {
                var _a;
                // 等待一段时间让Editor完成组件添加
                await new Promise(resolve => setTimeout(resolve, 100));
                // 重新查询节点信息验证组件是否真的添加成功
                try {
                    const allComponentsInfo2 = await this.getComponents(nodeUuid);
                    if (allComponentsInfo2.success && ((_a = allComponentsInfo2.data) === null || _a === void 0 ? void 0 : _a.components)) {
                        const addedComponent = allComponentsInfo2.data.components.find((comp) => comp.type === componentType);
                        if (addedComponent) {
                            resolve({
                                success: true,
                                message: `Component '${componentType}' added successfully`,
                                data: {
                                    nodeUuid: nodeUuid,
                                    componentType: componentType,
                                    componentVerified: true,
                                    existing: false
                                }
                            });
                        }
                        else {
                            resolve({
                                success: false,
                                error: `Component '${componentType}' was not found on node after addition. Available components: ${allComponentsInfo2.data.components.map((c) => c.type).join(', ')}`
                            });
                        }
                    }
                    else {
                        resolve({
                            success: false,
                            error: `Failed to verify component addition: ${allComponentsInfo2.error || 'Unable to get node components'}`
                        });
                    }
                }
                catch (verifyError) {
                    resolve({
                        success: false,
                        error: `Failed to verify component addition: ${verifyError.message}`
                    });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'addComponentToNode',
                    args: [nodeUuid, componentType]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    async removeComponent(nodeUuid, componentType) {
        return new Promise(async (resolve) => {
            var _a, _b, _c;
            // 1. 查找节点上的所有组件
            const allComponentsInfo = await this.getComponents(nodeUuid);
            if (!allComponentsInfo.success || !((_a = allComponentsInfo.data) === null || _a === void 0 ? void 0 : _a.components)) {
                resolve({ success: false, error: `Failed to get components for node '${nodeUuid}': ${allComponentsInfo.error}` });
                return;
            }
            // 2. 只查找type字段等于componentType的组件（即cid）
            const exists = allComponentsInfo.data.components.some((comp) => comp.type === componentType);
            if (!exists) {
                resolve({ success: false, error: `Component cid '${componentType}' not found on node '${nodeUuid}'. 请用getComponents获取type字段（cid）作为componentType。` });
                return;
            }
            // 3. 官方API直接移除
            try {
                await Editor.Message.request('scene', 'remove-component', {
                    uuid: nodeUuid,
                    component: componentType
                });
                // 4. 再查一次确认是否移除
                const afterRemoveInfo = await this.getComponents(nodeUuid);
                const stillExists = afterRemoveInfo.success && ((_c = (_b = afterRemoveInfo.data) === null || _b === void 0 ? void 0 : _b.components) === null || _c === void 0 ? void 0 : _c.some((comp) => comp.type === componentType));
                if (stillExists) {
                    resolve({ success: false, error: `Component cid '${componentType}' was not removed from node '${nodeUuid}'.` });
                }
                else {
                    resolve({
                        success: true,
                        message: `Component cid '${componentType}' removed successfully from node '${nodeUuid}'`,
                        data: { nodeUuid, componentType }
                    });
                }
            }
            catch (err) {
                resolve({ success: false, error: `Failed to remove component: ${err.message}` });
            }
        });
    }
    async getComponents(nodeUuid) {
        return new Promise((resolve) => {
            // 优先尝试直接使用 Editor API 查询节点信息
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData) => {
                if (nodeData && nodeData.__comps__) {
                    const components = nodeData.__comps__.map((comp) => {
                        var _a;
                        return ({
                            type: comp.__type__ || comp.cid || comp.type || 'Unknown',
                            uuid: ((_a = comp.uuid) === null || _a === void 0 ? void 0 : _a.value) || comp.uuid || null,
                            enabled: comp.enabled !== undefined ? comp.enabled : true,
                            properties: this.extractComponentProperties(comp)
                        });
                    });
                    resolve({
                        success: true,
                        data: {
                            nodeUuid: nodeUuid,
                            components: components
                        }
                    });
                }
                else {
                    resolve({ success: false, error: 'Node not found or no components data' });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getNodeInfo',
                    args: [nodeUuid]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    if (result.success) {
                        resolve({
                            success: true,
                            data: result.data.components
                        });
                    }
                    else {
                        resolve(result);
                    }
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    async getComponentInfo(nodeUuid, componentType) {
        return new Promise((resolve) => {
            // 优先尝试直接使用 Editor API 查询节点信息
            Editor.Message.request('scene', 'query-node', nodeUuid).then((nodeData) => {
                if (nodeData && nodeData.__comps__) {
                    const component = nodeData.__comps__.find((comp) => {
                        const compType = comp.__type__ || comp.cid || comp.type;
                        return compType === componentType;
                    });
                    if (component) {
                        resolve({
                            success: true,
                            data: {
                                nodeUuid: nodeUuid,
                                componentType: componentType,
                                enabled: component.enabled !== undefined ? component.enabled : true,
                                properties: this.extractComponentProperties(component)
                            }
                        });
                    }
                    else {
                        resolve({ success: false, error: `Component '${componentType}' not found on node` });
                    }
                }
                else {
                    resolve({ success: false, error: 'Node not found or no components data' });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'getNodeInfo',
                    args: [nodeUuid]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    if (result.success && result.data.components) {
                        const component = result.data.components.find((comp) => comp.type === componentType);
                        if (component) {
                            resolve({
                                success: true,
                                data: Object.assign({ nodeUuid: nodeUuid, componentType: componentType }, component)
                            });
                        }
                        else {
                            resolve({ success: false, error: `Component '${componentType}' not found on node` });
                        }
                    }
                    else {
                        resolve({ success: false, error: result.error || 'Failed to get component info' });
                    }
                }).catch((err2) => {
                    resolve({ success: false, error: `Direct API failed: ${err.message}, Scene script failed: ${err2.message}` });
                });
            });
        });
    }
    extractComponentProperties(component) {
        console.log(`[extractComponentProperties] Processing component:`, Object.keys(component));
        // 检查组件是否有 value 属性，这通常包含实际的组件属性
        if (component.value && typeof component.value === 'object') {
            console.log(`[extractComponentProperties] Found component.value with properties:`, Object.keys(component.value));
            return component.value; // 直接返回 value 对象，它包含所有组件属性
        }
        // 备用方案：从组件对象中直接提取属性
        const properties = {};
        const excludeKeys = ['__type__', 'enabled', 'node', '_id', '__scriptAsset', 'uuid', 'name', '_name', '_objFlags', '_enabled', 'type', 'readonly', 'visible', 'cid', 'editor', 'extends'];
        for (const key in component) {
            if (!excludeKeys.includes(key) && !key.startsWith('_')) {
                console.log(`[extractComponentProperties] Found direct property '${key}':`, typeof component[key]);
                properties[key] = component[key];
            }
        }
        console.log(`[extractComponentProperties] Final extracted properties:`, Object.keys(properties));
        return properties;
    }
    async findComponentTypeByUuid(componentUuid) {
        var _a;
        console.log(`[findComponentTypeByUuid] Searching for component type with UUID: ${componentUuid}`);
        if (!componentUuid) {
            return null;
        }
        try {
            const nodeTree = await Editor.Message.request('scene', 'query-node-tree');
            if (!nodeTree) {
                console.warn('[findComponentTypeByUuid] Failed to query node tree.');
                return null;
            }
            const queue = [nodeTree];
            while (queue.length > 0) {
                const currentNodeInfo = queue.shift();
                if (!currentNodeInfo || !currentNodeInfo.uuid) {
                    continue;
                }
                try {
                    const fullNodeData = await Editor.Message.request('scene', 'query-node', currentNodeInfo.uuid);
                    if (fullNodeData && fullNodeData.__comps__) {
                        for (const comp of fullNodeData.__comps__) {
                            const compAny = comp; // Cast to any to access dynamic properties
                            // The component UUID is nested in the 'value' property
                            if (compAny.uuid && compAny.uuid.value === componentUuid) {
                                const componentType = compAny.__type__;
                                console.log(`[findComponentTypeByUuid] Found component type '${componentType}' for UUID ${componentUuid} on node ${(_a = fullNodeData.name) === null || _a === void 0 ? void 0 : _a.value}`);
                                return componentType;
                            }
                        }
                    }
                }
                catch (e) {
                    console.warn(`[findComponentTypeByUuid] Could not query node ${currentNodeInfo.uuid}:`, e);
                }
                if (currentNodeInfo.children) {
                    for (const child of currentNodeInfo.children) {
                        queue.push(child);
                    }
                }
            }
            console.warn(`[findComponentTypeByUuid] Component with UUID ${componentUuid} not found in scene tree.`);
            return null;
        }
        catch (error) {
            console.error(`[findComponentTypeByUuid] Error while searching for component type:`, error);
            return null;
        }
    }
    async setComponentProperty(args) {
        const { nodeUuid, componentType, property, propertyType, value } = args;
        return new Promise(async (resolve) => {
            var _a, _b;
            try {
                console.log(`[ComponentTools] Setting ${componentType}.${property} (type: ${propertyType}) = ${JSON.stringify(value)} on node ${nodeUuid}`);
                // Step 0: 检测是否为节点属性，如果是则重定向到对应的节点方法
                const nodeRedirectResult = await this.checkAndRedirectNodeProperties(args);
                if (nodeRedirectResult) {
                    resolve(nodeRedirectResult);
                    return;
                }
                // Step 1: 获取组件信息，使用与getComponents相同的方法
                const componentsResponse = await this.getComponents(nodeUuid);
                if (!componentsResponse.success || !componentsResponse.data) {
                    resolve({
                        success: false,
                        error: `Failed to get components for node '${nodeUuid}': ${componentsResponse.error}`,
                        instruction: `Please verify that node UUID '${nodeUuid}' is correct. Use get_all_nodes or find_node_by_name to get the correct node UUID.`
                    });
                    return;
                }
                const allComponents = componentsResponse.data.components;
                // Step 2: 查找目标组件
                let targetComponent = null;
                const availableTypes = [];
                for (let i = 0; i < allComponents.length; i++) {
                    const comp = allComponents[i];
                    availableTypes.push(comp.type);
                    if (comp.type === componentType) {
                        targetComponent = comp;
                        break;
                    }
                }
                if (!targetComponent) {
                    // 提供更详细的错误信息和建议
                    const instruction = this.generateComponentSuggestion(componentType, availableTypes, property);
                    resolve({
                        success: false,
                        error: `Component '${componentType}' not found on node. Available components: ${availableTypes.join(', ')}`,
                        instruction: instruction
                    });
                    return;
                }
                // Step 3: 自动检测和转换属性值
                let propertyInfo;
                try {
                    console.log(`[ComponentTools] Analyzing property: ${property}`);
                    propertyInfo = this.analyzeProperty(targetComponent, property);
                }
                catch (analyzeError) {
                    console.error(`[ComponentTools] Error in analyzeProperty:`, analyzeError);
                    resolve({
                        success: false,
                        error: `Failed to analyze property '${property}': ${analyzeError.message}`
                    });
                    return;
                }
                if (!propertyInfo.exists) {
                    resolve({
                        success: false,
                        error: `Property '${property}' not found on component '${componentType}'. Available properties: ${propertyInfo.availableProperties.join(', ')}`
                    });
                    return;
                }
                // Step 4: 处理属性值和设置
                const originalValue = propertyInfo.originalValue;
                let processedValue;
                // 根据明确的propertyType处理属性值
                switch (propertyType) {
                    case 'string':
                        processedValue = String(value);
                        break;
                    case 'number':
                    case 'integer':
                    case 'float':
                        processedValue = Number(value);
                        break;
                    case 'boolean':
                        processedValue = Boolean(value);
                        break;
                    case 'color':
                        if (typeof value === 'string') {
                            // 字符串格式：支持十六进制、颜色名称、rgb()/rgba()
                            processedValue = this.parseColorString(value);
                        }
                        else if (typeof value === 'object' && value !== null) {
                            // 对象格式：验证并转换RGBA值
                            processedValue = {
                                r: Math.min(255, Math.max(0, Number(value.r) || 0)),
                                g: Math.min(255, Math.max(0, Number(value.g) || 0)),
                                b: Math.min(255, Math.max(0, Number(value.b) || 0)),
                                a: value.a !== undefined ? Math.min(255, Math.max(0, Number(value.a))) : 255
                            };
                        }
                        else {
                            throw new Error('Color value must be an object with r, g, b properties or a hexadecimal string (e.g., "#FF0000")');
                        }
                        break;
                    case 'vec2':
                        if (typeof value === 'object' && value !== null) {
                            processedValue = {
                                x: Number(value.x) || 0,
                                y: Number(value.y) || 0
                            };
                        }
                        else {
                            throw new Error('Vec2 value must be an object with x, y properties');
                        }
                        break;
                    case 'vec3':
                        if (typeof value === 'object' && value !== null) {
                            processedValue = {
                                x: Number(value.x) || 0,
                                y: Number(value.y) || 0,
                                z: Number(value.z) || 0
                            };
                        }
                        else {
                            throw new Error('Vec3 value must be an object with x, y, z properties');
                        }
                        break;
                    case 'size':
                        if (typeof value === 'object' && value !== null) {
                            processedValue = {
                                width: Number(value.width) || 0,
                                height: Number(value.height) || 0
                            };
                        }
                        else {
                            throw new Error('Size value must be an object with width, height properties');
                        }
                        break;
                    case 'node':
                        if (typeof value === 'string') {
                            processedValue = { uuid: value };
                        }
                        else {
                            throw new Error('Node reference value must be a string UUID');
                        }
                        break;
                    case 'component':
                        if (typeof value === 'string') {
                            // 组件引用需要特殊处理：通过节点UUID找到组件的__id__
                            processedValue = value; // 先保存节点UUID，后续会转换为__id__
                        }
                        else {
                            throw new Error('Component reference value must be a string (node UUID containing the target component)');
                        }
                        break;
                    case 'spriteFrame':
                    case 'prefab':
                    case 'asset':
                        if (typeof value === 'string') {
                            processedValue = { uuid: value };
                        }
                        else {
                            throw new Error(`${propertyType} value must be a string UUID`);
                        }
                        break;
                    case 'nodeArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item) => {
                                if (typeof item === 'string') {
                                    return { uuid: item };
                                }
                                else {
                                    throw new Error('NodeArray items must be string UUIDs');
                                }
                            });
                        }
                        else {
                            throw new Error('NodeArray value must be an array');
                        }
                        break;
                    case 'colorArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item) => {
                                if (typeof item === 'object' && item !== null && 'r' in item) {
                                    return {
                                        r: Math.min(255, Math.max(0, Number(item.r) || 0)),
                                        g: Math.min(255, Math.max(0, Number(item.g) || 0)),
                                        b: Math.min(255, Math.max(0, Number(item.b) || 0)),
                                        a: item.a !== undefined ? Math.min(255, Math.max(0, Number(item.a))) : 255
                                    };
                                }
                                else {
                                    return { r: 255, g: 255, b: 255, a: 255 };
                                }
                            });
                        }
                        else {
                            throw new Error('ColorArray value must be an array');
                        }
                        break;
                    case 'numberArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item) => Number(item));
                        }
                        else {
                            throw new Error('NumberArray value must be an array');
                        }
                        break;
                    case 'stringArray':
                        if (Array.isArray(value)) {
                            processedValue = value.map((item) => String(item));
                        }
                        else {
                            throw new Error('StringArray value must be an array');
                        }
                        break;
                    default:
                        throw new Error(`Unsupported property type: ${propertyType}`);
                }
                console.log(`[ComponentTools] Converting value: ${JSON.stringify(value)} -> ${JSON.stringify(processedValue)} (type: ${propertyType})`);
                console.log(`[ComponentTools] Property analysis result: propertyInfo.type="${propertyInfo.type}", propertyType="${propertyType}"`);
                console.log(`[ComponentTools] Will use color special handling: ${propertyType === 'color' && processedValue && typeof processedValue === 'object'}`);
                // 用于验证的实际期望值（对于组件引用需要特殊处理）
                let actualExpectedValue = processedValue;
                // Step 5: 获取原始节点数据来构建正确的路径
                const rawNodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
                if (!rawNodeData || !rawNodeData.__comps__) {
                    resolve({
                        success: false,
                        error: `Failed to get raw node data for property setting`
                    });
                    return;
                }
                // 找到原始组件的索引
                let rawComponentIndex = -1;
                for (let i = 0; i < rawNodeData.__comps__.length; i++) {
                    const comp = rawNodeData.__comps__[i];
                    const compType = comp.__type__ || comp.cid || comp.type || 'Unknown';
                    if (compType === componentType) {
                        rawComponentIndex = i;
                        break;
                    }
                }
                if (rawComponentIndex === -1) {
                    resolve({
                        success: false,
                        error: `Could not find component index for setting property`
                    });
                    return;
                }
                // 构建正确的属性路径
                let propertyPath = `__comps__.${rawComponentIndex}.${property}`;
                // 特殊处理资源类属性
                if (propertyType === 'asset' || propertyType === 'spriteFrame' || propertyType === 'prefab' ||
                    (propertyInfo.type === 'asset' && propertyType === 'string')) {
                    console.log(`[ComponentTools] Setting asset reference:`, {
                        value: processedValue,
                        property: property,
                        propertyType: propertyType,
                        path: propertyPath
                    });
                    // Determine asset type based on property name
                    let assetType = 'cc.SpriteFrame'; // default
                    if (property.toLowerCase().includes('texture')) {
                        assetType = 'cc.Texture2D';
                    }
                    else if (property.toLowerCase().includes('material')) {
                        assetType = 'cc.Material';
                    }
                    else if (property.toLowerCase().includes('font')) {
                        assetType = 'cc.Font';
                    }
                    else if (property.toLowerCase().includes('clip')) {
                        assetType = 'cc.AudioClip';
                    }
                    else if (propertyType === 'prefab') {
                        assetType = 'cc.Prefab';
                    }
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: processedValue,
                            type: assetType
                        }
                    });
                }
                else if (componentType === 'cc.UITransform' && (property === '_contentSize' || property === 'contentSize')) {
                    // Special handling for UITransform contentSize - set width and height separately
                    const width = Number(value.width) || 100;
                    const height = Number(value.height) || 100;
                    // Set width first
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.width`,
                        dump: { value: width }
                    });
                    // Then set height
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.height`,
                        dump: { value: height }
                    });
                }
                else if (componentType === 'cc.UITransform' && (property === '_anchorPoint' || property === 'anchorPoint')) {
                    // Special handling for UITransform anchorPoint - set anchorX and anchorY separately
                    const anchorX = Number(value.x) || 0.5;
                    const anchorY = Number(value.y) || 0.5;
                    // Set anchorX first
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.anchorX`,
                        dump: { value: anchorX }
                    });
                    // Then set anchorY  
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: `__comps__.${rawComponentIndex}.anchorY`,
                        dump: { value: anchorY }
                    });
                }
                else if (propertyType === 'color' && processedValue && typeof processedValue === 'object') {
                    // 特殊处理颜色属性，确保RGBA值正确
                    // Cocos Creator颜色值范围是0-255
                    const colorValue = {
                        r: Math.min(255, Math.max(0, Number(processedValue.r) || 0)),
                        g: Math.min(255, Math.max(0, Number(processedValue.g) || 0)),
                        b: Math.min(255, Math.max(0, Number(processedValue.b) || 0)),
                        a: processedValue.a !== undefined ? Math.min(255, Math.max(0, Number(processedValue.a))) : 255
                    };
                    console.log(`[ComponentTools] Setting color value:`, colorValue);
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: colorValue,
                            type: 'cc.Color'
                        }
                    });
                }
                else if (propertyType === 'vec3' && processedValue && typeof processedValue === 'object') {
                    // 特殊处理Vec3属性
                    const vec3Value = {
                        x: Number(processedValue.x) || 0,
                        y: Number(processedValue.y) || 0,
                        z: Number(processedValue.z) || 0
                    };
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: vec3Value,
                            type: 'cc.Vec3'
                        }
                    });
                }
                else if (propertyType === 'vec2' && processedValue && typeof processedValue === 'object') {
                    // 特殊处理Vec2属性
                    const vec2Value = {
                        x: Number(processedValue.x) || 0,
                        y: Number(processedValue.y) || 0
                    };
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: vec2Value,
                            type: 'cc.Vec2'
                        }
                    });
                }
                else if (propertyType === 'size' && processedValue && typeof processedValue === 'object') {
                    // 特殊处理Size属性
                    const sizeValue = {
                        width: Number(processedValue.width) || 0,
                        height: Number(processedValue.height) || 0
                    };
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: sizeValue,
                            type: 'cc.Size'
                        }
                    });
                }
                else if (propertyType === 'node' && processedValue && typeof processedValue === 'object' && 'uuid' in processedValue) {
                    // 特殊处理节点引用
                    console.log(`[ComponentTools] Setting node reference with UUID: ${processedValue.uuid}`);
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: processedValue,
                            type: 'cc.Node'
                        }
                    });
                }
                else if (propertyType === 'component' && typeof processedValue === 'string') {
                    // 特殊处理组件引用：通过节点UUID找到组件的__id__
                    const targetNodeUuid = processedValue;
                    console.log(`[ComponentTools] Setting component reference - finding component on node: ${targetNodeUuid}`);
                    // 从当前组件的属性元数据中获取期望的组件类型
                    let expectedComponentType = '';
                    // 获取当前组件的详细信息，包括属性元数据
                    const currentComponentInfo = await this.getComponentInfo(nodeUuid, componentType);
                    if (currentComponentInfo.success && ((_b = (_a = currentComponentInfo.data) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b[property])) {
                        const propertyMeta = currentComponentInfo.data.properties[property];
                        // 从属性元数据中提取组件类型信息
                        if (propertyMeta && typeof propertyMeta === 'object') {
                            // 检查是否有type字段指示组件类型
                            if (propertyMeta.type) {
                                expectedComponentType = propertyMeta.type;
                            }
                            else if (propertyMeta.ctor) {
                                // 有些属性可能使用ctor字段
                                expectedComponentType = propertyMeta.ctor;
                            }
                            else if (propertyMeta.extends && Array.isArray(propertyMeta.extends)) {
                                // 检查extends数组，通常第一个是最具体的类型
                                for (const extendType of propertyMeta.extends) {
                                    if (extendType.startsWith('cc.') && extendType !== 'cc.Component' && extendType !== 'cc.Object') {
                                        expectedComponentType = extendType;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (!expectedComponentType) {
                        throw new Error(`Unable to determine required component type for property '${property}' on component '${componentType}'. Property metadata may not contain type information.`);
                    }
                    console.log(`[ComponentTools] Detected required component type: ${expectedComponentType} for property: ${property}`);
                    try {
                        // 获取目标节点的组件信息
                        const targetNodeData = await Editor.Message.request('scene', 'query-node', targetNodeUuid);
                        if (!targetNodeData || !targetNodeData.__comps__) {
                            throw new Error(`Target node ${targetNodeUuid} not found or has no components`);
                        }
                        // 打印目标节点的组件概览
                        console.log(`[ComponentTools] Target node ${targetNodeUuid} has ${targetNodeData.__comps__.length} components:`);
                        targetNodeData.__comps__.forEach((comp, index) => {
                            const sceneId = comp.value && comp.value.uuid && comp.value.uuid.value ? comp.value.uuid.value : 'unknown';
                            console.log(`[ComponentTools] Component ${index}: ${comp.type} (scene_id: ${sceneId})`);
                        });
                        // 查找对应的组件
                        let targetComponent = null;
                        let componentId = null;
                        // 在目标节点的_components数组中查找指定类型的组件
                        // 注意：__comps__和_components的索引是对应的
                        console.log(`[ComponentTools] Searching for component type: ${expectedComponentType}`);
                        for (let i = 0; i < targetNodeData.__comps__.length; i++) {
                            const comp = targetNodeData.__comps__[i];
                            console.log(`[ComponentTools] Checking component ${i}: type=${comp.type}, target=${expectedComponentType}`);
                            if (comp.type === expectedComponentType) {
                                targetComponent = comp;
                                console.log(`[ComponentTools] Found matching component at index ${i}: ${comp.type}`);
                                // 从组件的value.uuid.value中获取组件在场景中的ID
                                if (comp.value && comp.value.uuid && comp.value.uuid.value) {
                                    componentId = comp.value.uuid.value;
                                    console.log(`[ComponentTools] Got componentId from comp.value.uuid.value: ${componentId}`);
                                }
                                else {
                                    console.log(`[ComponentTools] Component structure:`, {
                                        hasValue: !!comp.value,
                                        hasUuid: !!(comp.value && comp.value.uuid),
                                        hasUuidValue: !!(comp.value && comp.value.uuid && comp.value.uuid.value),
                                        uuidStructure: comp.value ? comp.value.uuid : 'No value'
                                    });
                                    throw new Error(`Unable to extract component ID from component structure`);
                                }
                                break;
                            }
                        }
                        if (!targetComponent) {
                            // 如果没找到，列出可用组件让用户了解，显示场景中的真实ID
                            const availableComponents = targetNodeData.__comps__.map((comp, index) => {
                                let sceneId = 'unknown';
                                // 从组件的value.uuid.value获取场景ID
                                if (comp.value && comp.value.uuid && comp.value.uuid.value) {
                                    sceneId = comp.value.uuid.value;
                                }
                                return `${comp.type}(scene_id:${sceneId})`;
                            });
                            throw new Error(`Component type '${expectedComponentType}' not found on node ${targetNodeUuid}. Available components: ${availableComponents.join(', ')}`);
                        }
                        console.log(`[ComponentTools] Found component ${expectedComponentType} with scene ID: ${componentId} on node ${targetNodeUuid}`);
                        // 更新期望值为实际的组件ID对象格式，用于后续验证
                        if (componentId) {
                            actualExpectedValue = { uuid: componentId };
                        }
                        // 尝试使用与节点/资源引用相同的格式：{uuid: componentId}
                        // 测试看是否能正确设置组件引用
                        await Editor.Message.request('scene', 'set-property', {
                            uuid: nodeUuid,
                            path: propertyPath,
                            dump: {
                                value: { uuid: componentId }, // 使用对象格式，像节点/资源引用一样
                                type: expectedComponentType
                            }
                        });
                    }
                    catch (error) {
                        console.error(`[ComponentTools] Error setting component reference:`, error);
                        throw error;
                    }
                }
                else if (propertyType === 'nodeArray' && Array.isArray(processedValue)) {
                    // 特殊处理节点数组 - 保持预处理的格式
                    console.log(`[ComponentTools] Setting node array:`, processedValue);
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: processedValue // 保持 [{uuid: "..."}, {uuid: "..."}] 格式
                        }
                    });
                }
                else if (propertyType === 'colorArray' && Array.isArray(processedValue)) {
                    // 特殊处理颜色数组
                    const colorArrayValue = processedValue.map((item) => {
                        if (item && typeof item === 'object' && 'r' in item) {
                            return {
                                r: Math.min(255, Math.max(0, Number(item.r) || 0)),
                                g: Math.min(255, Math.max(0, Number(item.g) || 0)),
                                b: Math.min(255, Math.max(0, Number(item.b) || 0)),
                                a: item.a !== undefined ? Math.min(255, Math.max(0, Number(item.a))) : 255
                            };
                        }
                        else {
                            return { r: 255, g: 255, b: 255, a: 255 };
                        }
                    });
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: {
                            value: colorArrayValue,
                            type: 'cc.Color'
                        }
                    });
                }
                else {
                    // Normal property setting for non-asset properties
                    await Editor.Message.request('scene', 'set-property', {
                        uuid: nodeUuid,
                        path: propertyPath,
                        dump: { value: processedValue }
                    });
                }
                // Step 5: 等待Editor完成更新，然后验证设置结果
                await new Promise(resolve => setTimeout(resolve, 200)); // 等待200ms让Editor完成更新
                const verification = await this.verifyPropertyChange(nodeUuid, componentType, property, originalValue, actualExpectedValue);
                resolve({
                    success: true,
                    message: `Successfully set ${componentType}.${property}`,
                    data: {
                        nodeUuid,
                        componentType,
                        property,
                        actualValue: verification.actualValue,
                        changeVerified: verification.verified
                    }
                });
            }
            catch (error) {
                console.error(`[ComponentTools] Error setting property:`, error);
                resolve({
                    success: false,
                    error: `Failed to set property: ${error.message}`
                });
            }
        });
    }
    async attachScript(nodeUuid, scriptPath) {
        return new Promise(async (resolve) => {
            var _a, _b;
            // 从脚本路径提取组件类名
            const scriptName = (_a = scriptPath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('.ts', '').replace('.js', '');
            if (!scriptName) {
                resolve({ success: false, error: 'Invalid script path' });
                return;
            }
            // 先查找节点上是否已存在该脚本组件
            const allComponentsInfo = await this.getComponents(nodeUuid);
            if (allComponentsInfo.success && ((_b = allComponentsInfo.data) === null || _b === void 0 ? void 0 : _b.components)) {
                const existingScript = allComponentsInfo.data.components.find((comp) => comp.type === scriptName);
                if (existingScript) {
                    resolve({
                        success: true,
                        message: `Script '${scriptName}' already exists on node`,
                        data: {
                            nodeUuid: nodeUuid,
                            componentName: scriptName,
                            existing: true
                        }
                    });
                    return;
                }
            }
            // 首先尝试直接使用脚本名称作为组件类型
            Editor.Message.request('scene', 'create-component', {
                uuid: nodeUuid,
                component: scriptName // 使用脚本名称而非UUID
            }).then(async (result) => {
                var _a;
                // 等待一段时间让Editor完成组件添加
                await new Promise(resolve => setTimeout(resolve, 100));
                // 重新查询节点信息验证脚本是否真的添加成功
                const allComponentsInfo2 = await this.getComponents(nodeUuid);
                if (allComponentsInfo2.success && ((_a = allComponentsInfo2.data) === null || _a === void 0 ? void 0 : _a.components)) {
                    const addedScript = allComponentsInfo2.data.components.find((comp) => comp.type === scriptName);
                    if (addedScript) {
                        resolve({
                            success: true,
                            message: `Script '${scriptName}' attached successfully`,
                            data: {
                                nodeUuid: nodeUuid,
                                componentName: scriptName,
                                existing: false
                            }
                        });
                    }
                    else {
                        resolve({
                            success: false,
                            error: `Script '${scriptName}' was not found on node after addition. Available components: ${allComponentsInfo2.data.components.map((c) => c.type).join(', ')}`
                        });
                    }
                }
                else {
                    resolve({
                        success: false,
                        error: `Failed to verify script addition: ${allComponentsInfo2.error || 'Unable to get node components'}`
                    });
                }
            }).catch((err) => {
                // 备用方案：使用场景脚本
                const options = {
                    name: 'cocos-mcp-server',
                    method: 'attachScript',
                    args: [nodeUuid, scriptPath]
                };
                Editor.Message.request('scene', 'execute-scene-script', options).then((result) => {
                    resolve(result);
                }).catch(() => {
                    resolve({
                        success: false,
                        error: `Failed to attach script '${scriptName}': ${err.message}`,
                        instruction: 'Please ensure the script is properly compiled and exported as a Component class. You can also manually attach the script through the Properties panel in the editor.'
                    });
                });
            });
        });
    }
    async getAvailableComponents(category = 'all') {
        const componentCategories = {
            renderer: ['cc.Sprite', 'cc.Label', 'cc.RichText', 'cc.Mask', 'cc.Graphics'],
            ui: ['cc.Button', 'cc.Toggle', 'cc.Slider', 'cc.ScrollView', 'cc.EditBox', 'cc.ProgressBar'],
            physics: ['cc.RigidBody2D', 'cc.BoxCollider2D', 'cc.CircleCollider2D', 'cc.PolygonCollider2D'],
            animation: ['cc.Animation', 'cc.AnimationClip', 'cc.SkeletalAnimation'],
            audio: ['cc.AudioSource'],
            layout: ['cc.Layout', 'cc.Widget', 'cc.PageView', 'cc.PageViewIndicator'],
            effects: ['cc.MotionStreak', 'cc.ParticleSystem2D'],
            camera: ['cc.Camera'],
            light: ['cc.Light', 'cc.DirectionalLight', 'cc.PointLight', 'cc.SpotLight']
        };
        let components = [];
        if (category === 'all') {
            for (const cat in componentCategories) {
                components = components.concat(componentCategories[cat]);
            }
        }
        else if (componentCategories[category]) {
            components = componentCategories[category];
        }
        return {
            success: true,
            data: {
                category: category,
                components: components
            }
        };
    }
    isValidPropertyDescriptor(propData) {
        // 检查是否是有效的属性描述对象
        if (typeof propData !== 'object' || propData === null) {
            return false;
        }
        try {
            const keys = Object.keys(propData);
            // 避免遍历简单的数值对象（如 {width: 200, height: 150}）
            const isSimpleValueObject = keys.every(key => {
                const value = propData[key];
                return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
            });
            if (isSimpleValueObject) {
                return false;
            }
            // 检查是否包含属性描述符的特征字段，不使用'in'操作符
            const hasName = keys.includes('name');
            const hasValue = keys.includes('value');
            const hasType = keys.includes('type');
            const hasDisplayName = keys.includes('displayName');
            const hasReadonly = keys.includes('readonly');
            // 必须包含name或value字段，且通常还有type字段
            const hasValidStructure = (hasName || hasValue) && (hasType || hasDisplayName || hasReadonly);
            // 额外检查：如果有default字段且结构复杂，避免深度遍历
            if (keys.includes('default') && propData.default && typeof propData.default === 'object') {
                const defaultKeys = Object.keys(propData.default);
                if (defaultKeys.includes('value') && typeof propData.default.value === 'object') {
                    // 这种情况下，我们只返回顶层属性，不深入遍历default.value
                    return hasValidStructure;
                }
            }
            return hasValidStructure;
        }
        catch (error) {
            console.warn(`[isValidPropertyDescriptor] Error checking property descriptor:`, error);
            return false;
        }
    }
    analyzeProperty(component, propertyName) {
        // 从复杂的组件结构中提取可用属性
        const availableProperties = [];
        let propertyValue = undefined;
        let propertyExists = false;
        // 尝试多种方式查找属性：
        // 1. 直接属性访问
        if (Object.prototype.hasOwnProperty.call(component, propertyName)) {
            propertyValue = component[propertyName];
            propertyExists = true;
        }
        // 2. 从嵌套结构中查找 (如从测试数据看到的复杂结构)
        if (!propertyExists && component.properties && typeof component.properties === 'object') {
            // 首先检查properties.value是否存在（这是我们在getComponents中看到的结构）
            if (component.properties.value && typeof component.properties.value === 'object') {
                const valueObj = component.properties.value;
                for (const [key, propData] of Object.entries(valueObj)) {
                    // 检查propData是否是一个有效的属性描述对象
                    // 确保propData是对象且包含预期的属性结构
                    if (this.isValidPropertyDescriptor(propData)) {
                        const propInfo = propData;
                        availableProperties.push(key);
                        if (key === propertyName) {
                            // 优先使用value属性，如果没有则使用propData本身
                            try {
                                const propKeys = Object.keys(propInfo);
                                propertyValue = propKeys.includes('value') ? propInfo.value : propInfo;
                            }
                            catch (error) {
                                // 如果检查失败，直接使用propInfo
                                propertyValue = propInfo;
                            }
                            propertyExists = true;
                        }
                    }
                }
            }
            else {
                // 备用方案：直接从properties查找
                for (const [key, propData] of Object.entries(component.properties)) {
                    if (this.isValidPropertyDescriptor(propData)) {
                        const propInfo = propData;
                        availableProperties.push(key);
                        if (key === propertyName) {
                            // 优先使用value属性，如果没有则使用propData本身
                            try {
                                const propKeys = Object.keys(propInfo);
                                propertyValue = propKeys.includes('value') ? propInfo.value : propInfo;
                            }
                            catch (error) {
                                // 如果检查失败，直接使用propInfo
                                propertyValue = propInfo;
                            }
                            propertyExists = true;
                        }
                    }
                }
            }
        }
        // 3. 从直接属性中提取简单属性名
        if (availableProperties.length === 0) {
            for (const key of Object.keys(component)) {
                if (!key.startsWith('_') && !['__type__', 'cid', 'node', 'uuid', 'name', 'enabled', 'type', 'readonly', 'visible'].includes(key)) {
                    availableProperties.push(key);
                }
            }
        }
        if (!propertyExists) {
            return {
                exists: false,
                type: 'unknown',
                availableProperties,
                originalValue: undefined
            };
        }
        let type = 'unknown';
        // 智能类型检测
        if (Array.isArray(propertyValue)) {
            // 数组类型检测
            if (propertyName.toLowerCase().includes('node')) {
                type = 'nodeArray';
            }
            else if (propertyName.toLowerCase().includes('color')) {
                type = 'colorArray';
            }
            else {
                type = 'array';
            }
        }
        else if (typeof propertyValue === 'string') {
            // Check if property name suggests it's an asset
            if (['spriteFrame', 'texture', 'material', 'font', 'clip', 'prefab'].includes(propertyName.toLowerCase())) {
                type = 'asset';
            }
            else {
                type = 'string';
            }
        }
        else if (typeof propertyValue === 'number') {
            type = 'number';
        }
        else if (typeof propertyValue === 'boolean') {
            type = 'boolean';
        }
        else if (propertyValue && typeof propertyValue === 'object') {
            try {
                const keys = Object.keys(propertyValue);
                if (keys.includes('r') && keys.includes('g') && keys.includes('b')) {
                    type = 'color';
                }
                else if (keys.includes('x') && keys.includes('y')) {
                    type = propertyValue.z !== undefined ? 'vec3' : 'vec2';
                }
                else if (keys.includes('width') && keys.includes('height')) {
                    type = 'size';
                }
                else if (keys.includes('uuid') || keys.includes('__uuid__')) {
                    // 检查是否是节点引用（通过属性名或__id__属性判断）
                    if (propertyName.toLowerCase().includes('node') ||
                        propertyName.toLowerCase().includes('target') ||
                        keys.includes('__id__')) {
                        type = 'node';
                    }
                    else {
                        type = 'asset';
                    }
                }
                else if (keys.includes('__id__')) {
                    // 节点引用特征
                    type = 'node';
                }
                else {
                    type = 'object';
                }
            }
            catch (error) {
                console.warn(`[analyzeProperty] Error checking property type for: ${JSON.stringify(propertyValue)}`);
                type = 'object';
            }
        }
        else if (propertyValue === null || propertyValue === undefined) {
            // For null/undefined values, check property name to determine type
            if (['spriteFrame', 'texture', 'material', 'font', 'clip', 'prefab'].includes(propertyName.toLowerCase())) {
                type = 'asset';
            }
            else if (propertyName.toLowerCase().includes('node') ||
                propertyName.toLowerCase().includes('target')) {
                type = 'node';
            }
            else if (propertyName.toLowerCase().includes('component')) {
                type = 'component';
            }
            else {
                type = 'unknown';
            }
        }
        return {
            exists: true,
            type,
            availableProperties,
            originalValue: propertyValue
        };
    }
    smartConvertValue(inputValue, propertyInfo) {
        const { type, originalValue } = propertyInfo;
        console.log(`[smartConvertValue] Converting ${JSON.stringify(inputValue)} to type: ${type}`);
        switch (type) {
            case 'string':
                return String(inputValue);
            case 'number':
                return Number(inputValue);
            case 'boolean':
                if (typeof inputValue === 'boolean')
                    return inputValue;
                if (typeof inputValue === 'string') {
                    return inputValue.toLowerCase() === 'true' || inputValue === '1';
                }
                return Boolean(inputValue);
            case 'color':
                // 优化的颜色处理，支持多种输入格式
                if (typeof inputValue === 'string') {
                    // 字符串格式：十六进制、颜色名称、rgb()/rgba()
                    return this.parseColorString(inputValue);
                }
                else if (typeof inputValue === 'object' && inputValue !== null) {
                    try {
                        const inputKeys = Object.keys(inputValue);
                        // 如果输入是颜色对象，验证并转换
                        if (inputKeys.includes('r') || inputKeys.includes('g') || inputKeys.includes('b')) {
                            return {
                                r: Math.min(255, Math.max(0, Number(inputValue.r) || 0)),
                                g: Math.min(255, Math.max(0, Number(inputValue.g) || 0)),
                                b: Math.min(255, Math.max(0, Number(inputValue.b) || 0)),
                                a: inputValue.a !== undefined ? Math.min(255, Math.max(0, Number(inputValue.a))) : 255
                            };
                        }
                    }
                    catch (error) {
                        console.warn(`[smartConvertValue] Invalid color object: ${JSON.stringify(inputValue)}`);
                    }
                }
                // 如果有原值，保持原值结构并更新提供的值
                if (originalValue && typeof originalValue === 'object') {
                    try {
                        const inputKeys = typeof inputValue === 'object' && inputValue ? Object.keys(inputValue) : [];
                        return {
                            r: inputKeys.includes('r') ? Math.min(255, Math.max(0, Number(inputValue.r))) : (originalValue.r || 255),
                            g: inputKeys.includes('g') ? Math.min(255, Math.max(0, Number(inputValue.g))) : (originalValue.g || 255),
                            b: inputKeys.includes('b') ? Math.min(255, Math.max(0, Number(inputValue.b))) : (originalValue.b || 255),
                            a: inputKeys.includes('a') ? Math.min(255, Math.max(0, Number(inputValue.a))) : (originalValue.a || 255)
                        };
                    }
                    catch (error) {
                        console.warn(`[smartConvertValue] Error processing color with original value: ${error}`);
                    }
                }
                // 默认返回白色
                console.warn(`[smartConvertValue] Using default white color for invalid input: ${JSON.stringify(inputValue)}`);
                return { r: 255, g: 255, b: 255, a: 255 };
            case 'vec2':
                if (typeof inputValue === 'object' && inputValue !== null) {
                    return {
                        x: Number(inputValue.x) || originalValue.x || 0,
                        y: Number(inputValue.y) || originalValue.y || 0
                    };
                }
                return originalValue;
            case 'vec3':
                if (typeof inputValue === 'object' && inputValue !== null) {
                    return {
                        x: Number(inputValue.x) || originalValue.x || 0,
                        y: Number(inputValue.y) || originalValue.y || 0,
                        z: Number(inputValue.z) || originalValue.z || 0
                    };
                }
                return originalValue;
            case 'size':
                if (typeof inputValue === 'object' && inputValue !== null) {
                    return {
                        width: Number(inputValue.width) || originalValue.width || 100,
                        height: Number(inputValue.height) || originalValue.height || 100
                    };
                }
                return originalValue;
            case 'node':
                if (typeof inputValue === 'string') {
                    // 节点引用需要特殊处理
                    return inputValue;
                }
                else if (typeof inputValue === 'object' && inputValue !== null) {
                    // 如果已经是对象形式，返回UUID或完整对象
                    return inputValue.uuid || inputValue;
                }
                return originalValue;
            case 'asset':
                if (typeof inputValue === 'string') {
                    // 如果输入是字符串路径，转换为asset对象
                    return { uuid: inputValue };
                }
                else if (typeof inputValue === 'object' && inputValue !== null) {
                    return inputValue;
                }
                return originalValue;
            default:
                // 对于未知类型，尽量保持原有结构
                if (typeof inputValue === typeof originalValue) {
                    return inputValue;
                }
                return originalValue;
        }
    }
    parseColorString(colorStr) {
        const str = colorStr.trim();
        // 只支持十六进制格式 #RRGGBB 或 #RRGGBBAA
        if (str.startsWith('#')) {
            if (str.length === 7) { // #RRGGBB
                const r = parseInt(str.substring(1, 3), 16);
                const g = parseInt(str.substring(3, 5), 16);
                const b = parseInt(str.substring(5, 7), 16);
                return { r, g, b, a: 255 };
            }
            else if (str.length === 9) { // #RRGGBBAA
                const r = parseInt(str.substring(1, 3), 16);
                const g = parseInt(str.substring(3, 5), 16);
                const b = parseInt(str.substring(5, 7), 16);
                const a = parseInt(str.substring(7, 9), 16);
                return { r, g, b, a };
            }
        }
        // 如果不是有效的十六进制格式，返回错误提示
        throw new Error(`Invalid color format: "${colorStr}". Only hexadecimal format is supported (e.g., "#FF0000" or "#FF0000FF")`);
    }
    async verifyPropertyChange(nodeUuid, componentType, property, originalValue, expectedValue) {
        var _a, _b;
        console.log(`[verifyPropertyChange] Starting verification for ${componentType}.${property}`);
        console.log(`[verifyPropertyChange] Expected value:`, JSON.stringify(expectedValue));
        console.log(`[verifyPropertyChange] Original value:`, JSON.stringify(originalValue));
        try {
            // 重新获取组件信息进行验证
            console.log(`[verifyPropertyChange] Calling getComponentInfo...`);
            const componentInfo = await this.getComponentInfo(nodeUuid, componentType);
            console.log(`[verifyPropertyChange] getComponentInfo success:`, componentInfo.success);
            const allComponents = await this.getComponents(nodeUuid);
            console.log(`[verifyPropertyChange] getComponents success:`, allComponents.success);
            if (componentInfo.success && componentInfo.data) {
                console.log(`[verifyPropertyChange] Component data available, extracting property '${property}'`);
                const allPropertyNames = Object.keys(componentInfo.data.properties || {});
                console.log(`[verifyPropertyChange] Available properties:`, allPropertyNames);
                const propertyData = (_a = componentInfo.data.properties) === null || _a === void 0 ? void 0 : _a[property];
                console.log(`[verifyPropertyChange] Raw property data for '${property}':`, JSON.stringify(propertyData));
                // 从属性数据中提取实际值
                let actualValue = propertyData;
                console.log(`[verifyPropertyChange] Initial actualValue:`, JSON.stringify(actualValue));
                if (propertyData && typeof propertyData === 'object' && 'value' in propertyData) {
                    actualValue = propertyData.value;
                    console.log(`[verifyPropertyChange] Extracted actualValue from .value:`, JSON.stringify(actualValue));
                }
                else {
                    console.log(`[verifyPropertyChange] No .value property found, using raw data`);
                }
                // 修复验证逻辑：检查实际值是否匹配期望值
                let verified = false;
                if (typeof expectedValue === 'object' && expectedValue !== null && 'uuid' in expectedValue) {
                    // 对于引用类型（节点/组件/资源），比较UUID
                    const actualUuid = actualValue && typeof actualValue === 'object' && 'uuid' in actualValue ? actualValue.uuid : '';
                    const expectedUuid = expectedValue.uuid || '';
                    verified = actualUuid === expectedUuid && expectedUuid !== '';
                    console.log(`[verifyPropertyChange] Reference comparison:`);
                    console.log(`  - Expected UUID: "${expectedUuid}"`);
                    console.log(`  - Actual UUID: "${actualUuid}"`);
                    console.log(`  - UUID match: ${actualUuid === expectedUuid}`);
                    console.log(`  - UUID not empty: ${expectedUuid !== ''}`);
                    console.log(`  - Final verified: ${verified}`);
                }
                else {
                    // 对于其他类型，直接比较值
                    console.log(`[verifyPropertyChange] Value comparison:`);
                    console.log(`  - Expected type: ${typeof expectedValue}`);
                    console.log(`  - Actual type: ${typeof actualValue}`);
                    if (typeof actualValue === typeof expectedValue) {
                        if (typeof actualValue === 'object' && actualValue !== null && expectedValue !== null) {
                            // 对象类型的深度比较
                            verified = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
                            console.log(`  - Object comparison (JSON): ${verified}`);
                        }
                        else {
                            // 基本类型的直接比较
                            verified = actualValue === expectedValue;
                            console.log(`  - Direct comparison: ${verified}`);
                        }
                    }
                    else {
                        // 类型不匹配时的特殊处理（如数字和字符串）
                        const stringMatch = String(actualValue) === String(expectedValue);
                        const numberMatch = Number(actualValue) === Number(expectedValue);
                        verified = stringMatch || numberMatch;
                        console.log(`  - String match: ${stringMatch}`);
                        console.log(`  - Number match: ${numberMatch}`);
                        console.log(`  - Type mismatch verified: ${verified}`);
                    }
                }
                console.log(`[verifyPropertyChange] Final verification result: ${verified}`);
                console.log(`[verifyPropertyChange] Final actualValue:`, JSON.stringify(actualValue));
                const result = {
                    verified,
                    actualValue,
                    fullData: {
                        // 只返回修改的属性信息，不返回完整组件数据
                        modifiedProperty: {
                            name: property,
                            before: originalValue,
                            expected: expectedValue,
                            actual: actualValue,
                            verified,
                            propertyMetadata: propertyData // 只包含这个属性的元数据
                        },
                        // 简化的组件信息
                        componentSummary: {
                            nodeUuid,
                            componentType,
                            totalProperties: Object.keys(((_b = componentInfo.data) === null || _b === void 0 ? void 0 : _b.properties) || {}).length
                        }
                    }
                };
                console.log(`[verifyPropertyChange] Returning result:`, JSON.stringify(result, null, 2));
                return result;
            }
            else {
                console.log(`[verifyPropertyChange] ComponentInfo failed or no data:`, componentInfo);
            }
        }
        catch (error) {
            console.error('[verifyPropertyChange] Verification failed with error:', error);
            console.error('[verifyPropertyChange] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        }
        console.log(`[verifyPropertyChange] Returning fallback result`);
        return {
            verified: false,
            actualValue: undefined,
            fullData: null
        };
    }
    /**
     * 检测是否为节点属性，如果是则重定向到对应的节点方法
     */
    async checkAndRedirectNodeProperties(args) {
        const { nodeUuid, componentType, property, propertyType, value } = args;
        // 检测是否为节点基础属性（应该使用 set_node_property）
        const nodeBasicProperties = [
            'name', 'active', 'layer', 'mobility', 'parent', 'children', 'hideFlags'
        ];
        // 检测是否为节点变换属性（应该使用 set_node_transform）
        const nodeTransformProperties = [
            'position', 'rotation', 'scale', 'eulerAngles', 'angle'
        ];
        // Detect attempts to set cc.Node properties (common mistake)
        if (componentType === 'cc.Node' || componentType === 'Node') {
            if (nodeBasicProperties.includes(property)) {
                return {
                    success: false,
                    error: `Property '${property}' is a node basic property, not a component property`,
                    instruction: `Please use set_node_property method to set node properties: set_node_property(uuid="${nodeUuid}", property="${property}", value=${JSON.stringify(value)})`
                };
            }
            else if (nodeTransformProperties.includes(property)) {
                return {
                    success: false,
                    error: `Property '${property}' is a node transform property, not a component property`,
                    instruction: `Please use set_node_transform method to set transform properties: set_node_transform(uuid="${nodeUuid}", ${property}=${JSON.stringify(value)})`
                };
            }
        }
        // Detect common incorrect usage
        if (nodeBasicProperties.includes(property) || nodeTransformProperties.includes(property)) {
            const methodName = nodeTransformProperties.includes(property) ? 'set_node_transform' : 'set_node_property';
            return {
                success: false,
                error: `Property '${property}' is a node property, not a component property`,
                instruction: `Property '${property}' should be set using ${methodName} method, not set_component_property. Please use: ${methodName}(uuid="${nodeUuid}", ${nodeTransformProperties.includes(property) ? property : `property="${property}"`}=${JSON.stringify(value)})`
            };
        }
        return null; // 不是节点属性，继续正常处理
    }
    /**
     * 生成组件建议信息
     */
    generateComponentSuggestion(requestedType, availableTypes, property) {
        // 检查是否存在相似的组件类型
        const similarTypes = availableTypes.filter(type => type.toLowerCase().includes(requestedType.toLowerCase()) ||
            requestedType.toLowerCase().includes(type.toLowerCase()));
        let instruction = '';
        if (similarTypes.length > 0) {
            instruction += `\n\n🔍 Found similar components: ${similarTypes.join(', ')}`;
            instruction += `\n💡 Suggestion: Perhaps you meant to set the '${similarTypes[0]}' component?`;
        }
        // Recommend possible components based on property name
        const propertyToComponentMap = {
            'string': ['cc.Label', 'cc.RichText', 'cc.EditBox'],
            'text': ['cc.Label', 'cc.RichText'],
            'fontSize': ['cc.Label', 'cc.RichText'],
            'spriteFrame': ['cc.Sprite'],
            'color': ['cc.Label', 'cc.Sprite', 'cc.Graphics'],
            'normalColor': ['cc.Button'],
            'pressedColor': ['cc.Button'],
            'target': ['cc.Button'],
            'contentSize': ['cc.UITransform'],
            'anchorPoint': ['cc.UITransform']
        };
        const recommendedComponents = propertyToComponentMap[property] || [];
        const availableRecommended = recommendedComponents.filter(comp => availableTypes.includes(comp));
        if (availableRecommended.length > 0) {
            instruction += `\n\n🎯 Based on property '${property}', recommended components: ${availableRecommended.join(', ')}`;
        }
        // Provide operation suggestions
        instruction += `\n\n📋 Suggested Actions:`;
        instruction += `\n1. Use get_components(nodeUuid="${requestedType.includes('uuid') ? 'YOUR_NODE_UUID' : 'nodeUuid'}") to view all components on the node`;
        instruction += `\n2. If you need to add a component, use add_component(nodeUuid="...", componentType="${requestedType}")`;
        instruction += `\n3. Verify that the component type name is correct (case-sensitive)`;
        return instruction;
    }
    /**
     * 快速验证资源设置结果
     */
    async quickVerifyAsset(nodeUuid, componentType, property) {
        try {
            const rawNodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
            if (!rawNodeData || !rawNodeData.__comps__) {
                return null;
            }
            // 找到组件
            const component = rawNodeData.__comps__.find((comp) => {
                const compType = comp.__type__ || comp.cid || comp.type;
                return compType === componentType;
            });
            if (!component) {
                return null;
            }
            // 提取属性值
            const properties = this.extractComponentProperties(component);
            const propertyData = properties[property];
            if (propertyData && typeof propertyData === 'object' && 'value' in propertyData) {
                return propertyData.value;
            }
            else {
                return propertyData;
            }
        }
        catch (error) {
            console.error(`[quickVerifyAsset] Error:`, error);
            return null;
        }
    }
}
exports.ComponentTools = ComponentTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvbXBvbmVudC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFhLGNBQWM7SUFDdkIsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixXQUFXLEVBQUUsdVBBQXVQO2dCQUNwUSxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLE1BQU0sRUFBRTs0QkFDSixJQUFJLEVBQUUsUUFBUTs0QkFDZCxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDOzRCQUN2QixXQUFXLEVBQUUsOENBQThDO3lCQUM5RDt3QkFDRCxRQUFRLEVBQUU7NEJBQ04sSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLCtGQUErRjt5QkFDL0c7d0JBQ0QsYUFBYSxFQUFFOzRCQUNYLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSwySEFBMkg7eUJBQzNJO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsZUFBZSxDQUFDO2lCQUNwRDthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLGtCQUFrQjtnQkFDeEIsV0FBVyxFQUFFLDRIQUE0SDtnQkFDekksV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixNQUFNLEVBQUU7NEJBQ0osSUFBSSxFQUFFLFFBQVE7NEJBQ2QsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQzs0QkFDMUIsV0FBVyxFQUFFLHdEQUF3RDt5QkFDeEU7d0JBQ0QsUUFBUSxFQUFFOzRCQUNOLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxXQUFXO3lCQUMzQjt3QkFDRCxVQUFVLEVBQUU7NEJBQ1IsSUFBSSxFQUFF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SUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQ0FDM0QsT0FBTzt3Q0FDSCxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3Q0FDbEQsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0NBQ2xELENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dDQUNsRCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO3FDQUM3RSxDQUFDO2dDQUNOLENBQUM7cUNBQU0sQ0FBQztvQ0FDSixPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO2dDQUM5QyxDQUFDOzRCQUNMLENBQUMsQ0FBQyxDQUFDO3dCQUNQLENBQUM7NkJBQU0sQ0FBQzs0QkFDSixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7d0JBQ3pELENBQUM7d0JBQ0QsTUFBTTtvQkFDVixLQUFLLGFBQWE7d0JBQ2QsSUFB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UUFBUSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM5RixPQUFPOzRCQUNILENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQzs0QkFDeEcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDOzRCQUN4RyxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUM7NEJBQ3hHLENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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QUFZLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDOUUsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBQzlCLENBQUM7aUJBQU0sQ0FBQztnQkFDSixPQUFPLFlBQVksQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUEzeURELHdDQTJ5REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IsIENvbXBvbmVudEluZm8gfSBmcm9tICcuLi90eXBlcyc7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50VG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xyXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NvbXBvbmVudF9tYW5hZ2UnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBZGQgb3IgcmVtb3ZlIGEgY29tcG9uZW50IG9uIGEgbm9kZS4gVXNlIGFjdGlvbiBcImFkZFwiIHRvIGFkZCBhIGNvbXBvbmVudCwgYWN0aW9uIFwicmVtb3ZlXCIgdG8gcmVtb3ZlIG9uZS4gRm9yIHJlbW92ZSwgY29tcG9uZW50VHlwZSBtdXN0IGJlIHRoZSBjb21wb25lbnRcXCdzIGNsYXNzSWQgKGNpZCwgaS5lLiB0aGUgdHlwZSBmaWVsZCBmcm9tIGdldENvbXBvbmVudHMpLCBub3QgdGhlIHNjcmlwdCBuYW1lIG9yIGNsYXNzIG5hbWUuJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydhZGQnLCAncmVtb3ZlJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbiB0byBwZXJmb3JtOiBhZGQgb3IgcmVtb3ZlIGEgY29tcG9uZW50J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBub2RlIFVVSUQuIFVzZSBnZXRfYWxsX25vZGVzIG9yIGZpbmRfbm9kZV9ieV9uYW1lIHRvIGdldCB0aGUgVVVJRCBvZiB0aGUgZGVzaXJlZCBub2RlLidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbXBvbmVudCB0eXBlIChlLmcuLCBjYy5TcHJpdGUsIGNjLkxhYmVsLCBjYy5CdXR0b24pLiBGb3IgcmVtb3ZlLCB1c2UgdGhlIGNvbXBvbmVudCBjaWQgKHR5cGUgZmllbGQgZnJvbSBnZXRDb21wb25lbnRzKS4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2FjdGlvbicsICdub2RlVXVpZCcsICdjb21wb25lbnRUeXBlJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NvbXBvbmVudF9zY3JpcHQnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBdHRhY2ggb3IgZGV0YWNoIGEgc2NyaXB0IGNvbXBvbmVudCB0by9mcm9tIGEgbm9kZS4gVXNlIGFjdGlvbiBcImF0dGFjaFwiIHRvIGF0dGFjaCBhIHNjcmlwdCwgYWN0aW9uIFwiZGV0YWNoXCIgdG8gZGV0YWNoIG9uZS4nLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2F0dGFjaCcsICdkZXRhY2gnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uIHRvIHBlcmZvcm06IGF0dGFjaCBvciBkZXRhY2ggYSBzY3JpcHQgY29tcG9uZW50J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgVVVJRCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0UGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NjcmlwdCBhc3NldCBwYXRoIChlLmcuLCBkYjovL2Fzc2V0cy9zY3JpcHRzL015U2NyaXB0LnRzKS4gUmVxdWlyZWQgZm9yIGF0dGFjaC4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdE5hbWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY3JpcHQgY29tcG9uZW50IG5hbWUgdG8gZGV0YWNoLiBSZXF1aXJlZCBmb3IgZGV0YWNoLidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJywgJ25vZGVVdWlkJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NvbXBvbmVudF9xdWVyeScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1F1ZXJ5IGNvbXBvbmVudCBpbmZvcm1hdGlvbi4gVXNlIGFjdGlvbiBcImdldF9hbGxcIiB0byBnZXQgYWxsIGNvbXBvbmVudHMgb2YgYSBub2RlLCBcImdldF9pbmZvXCIgdG8gZ2V0IHNwZWNpZmljIGNvbXBvbmVudCBpbmZvLCBcImdldF9hdmFpbGFibGVcIiB0byBsaXN0IGF2YWlsYWJsZSBjb21wb25lbnQgdHlwZXMgYnkgY2F0ZWdvcnkuJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydnZXRfYWxsJywgJ2dldF9pbmZvJywgJ2dldF9hdmFpbGFibGUnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgYWN0aW9uOiBnZXRfYWxsLCBnZXRfaW5mbywgb3IgZ2V0X2F2YWlsYWJsZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQuIFJlcXVpcmVkIGZvciBnZXRfYWxsIGFuZCBnZXRfaW5mby4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wb25lbnQgdHlwZSB0byBnZXQgaW5mbyBmb3IuIFJlcXVpcmVkIGZvciBnZXRfaW5mby4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcG9uZW50IGNhdGVnb3J5IGZpbHRlci4gUmVxdWlyZWQgZm9yIGdldF9hdmFpbGFibGUuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYWxsJywgJ3JlbmRlcmVyJywgJ3VpJywgJ3BoeXNpY3MnLCAnYW5pbWF0aW9uJywgJ2F1ZGlvJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnYWxsJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2V0X2NvbXBvbmVudF9wcm9wZXJ0eScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NldCBjb21wb25lbnQgcHJvcGVydHkgdmFsdWVzIGZvciBVSSBjb21wb25lbnRzIG9yIGN1c3RvbSBzY3JpcHQgY29tcG9uZW50cy4gU3VwcG9ydHMgc2V0dGluZyBwcm9wZXJ0aWVzIG9mIGJ1aWx0LWluIFVJIGNvbXBvbmVudHMgKGUuZy4sIGNjLkxhYmVsLCBjYy5TcHJpdGUpIGFuZCBjdXN0b20gc2NyaXB0IGNvbXBvbmVudHMuIE5vdGU6IEZvciBub2RlIGJhc2ljIHByb3BlcnRpZXMgKG5hbWUsIGFjdGl2ZSwgbGF5ZXIsIGV0Yy4pLCB1c2Ugc2V0X25vZGVfcHJvcGVydHkuIEZvciBub2RlIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIChwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlLCBldGMuKSwgdXNlIHNldF9ub2RlX3RyYW5zZm9ybS4nLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IG5vZGUgVVVJRCAtIE11c3Qgc3BlY2lmeSB0aGUgbm9kZSB0byBvcGVyYXRlIG9uJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcG9uZW50IHR5cGUgLSBDYW4gYmUgYnVpbHQtaW4gY29tcG9uZW50cyAoZS5nLiwgY2MuTGFiZWwpIG9yIGN1c3RvbSBzY3JpcHQgY29tcG9uZW50cyAoZS5nLiwgTXlTY3JpcHQpLiBJZiB1bnN1cmUgYWJvdXQgY29tcG9uZW50IHR5cGUsIHVzZSBnZXRfY29tcG9uZW50cyBmaXJzdCB0byByZXRyaWV2ZSBhbGwgY29tcG9uZW50cyBvbiB0aGUgbm9kZS4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g56e76ZmkZW51bemZkOWItu+8jOWFgeiuuOS7u+aEj+e7hOS7tuexu+Wei+WMheaLrOiHquWumuS5ieiEmuacrFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3BlcnR5IG5hbWUgLSBUaGUgcHJvcGVydHkgdG8gc2V0LiBDb21tb24gcHJvcGVydGllcyBpbmNsdWRlOlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgY2MuTGFiZWw6IHN0cmluZyAodGV4dCBjb250ZW50KSwgZm9udFNpemUgKGZvbnQgc2l6ZSksIGNvbG9yICh0ZXh0IGNvbG9yKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgY2MuU3ByaXRlOiBzcHJpdGVGcmFtZSAoc3ByaXRlIGZyYW1lKSwgY29sb3IgKHRpbnQgY29sb3IpLCBzaXplTW9kZSAoc2l6ZSBtb2RlKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgY2MuQnV0dG9uOiBub3JtYWxDb2xvciAobm9ybWFsIGNvbG9yKSwgcHJlc3NlZENvbG9yIChwcmVzc2VkIGNvbG9yKSwgdGFyZ2V0ICh0YXJnZXQgbm9kZSlcXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn4oCiIGNjLlVJVHJhbnNmb3JtOiBjb250ZW50U2l6ZSAoY29udGVudCBzaXplKSwgYW5jaG9yUG9pbnQgKGFuY2hvciBwb2ludClcXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn4oCiIEN1c3RvbSBTY3JpcHRzOiBCYXNlZCBvbiBwcm9wZXJ0aWVzIGRlZmluZWQgaW4gdGhlIHNjcmlwdCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlUeXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvcGVydHkgdHlwZSAtIE11c3QgZXhwbGljaXRseSBzcGVjaWZ5IHRoZSBwcm9wZXJ0eSBkYXRhIHR5cGUgZm9yIGNvcnJlY3QgdmFsdWUgY29udmVyc2lvbiBhbmQgdmFsaWRhdGlvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0cmluZycsICdudW1iZXInLCAnYm9vbGVhbicsICdpbnRlZ2VyJywgJ2Zsb2F0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sb3InLCAndmVjMicsICd2ZWMzJywgJ3NpemUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdub2RlJywgJ2NvbXBvbmVudCcsICdzcHJpdGVGcmFtZScsICdwcmVmYWInLCAnYXNzZXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdub2RlQXJyYXknLCAnY29sb3JBcnJheScsICdudW1iZXJBcnJheScsICdzdHJpbmdBcnJheSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Byb3BlcnR5IHZhbHVlIC0gVXNlIHRoZSBjb3JyZXNwb25kaW5nIGRhdGEgZm9ybWF0IGJhc2VkIG9uIHByb3BlcnR5VHlwZTpcXG5cXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn8J+TnSBCYXNpYyBEYXRhIFR5cGVzOlxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgc3RyaW5nOiBcIkhlbGxvIFdvcmxkXCIgKHRleHQgc3RyaW5nKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgbnVtYmVyL2ludGVnZXIvZmxvYXQ6IDQyIG9yIDMuMTQgKG51bWVyaWMgdmFsdWUpXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiBib29sZWFuOiB0cnVlIG9yIGZhbHNlIChib29sZWFuIHZhbHVlKVxcblxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfwn46oIENvbG9yIFR5cGU6XFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiBjb2xvcjoge1wiclwiOjI1NSxcImdcIjowLFwiYlwiOjAsXCJhXCI6MjU1fSAoUkdCQSB2YWx1ZXMsIHJhbmdlIDAtMjU1KVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgIC0gQWx0ZXJuYXRpdmU6IFwiI0ZGMDAwMFwiIChoZXhhZGVjaW1hbCBmb3JtYXQpXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgLSBUcmFuc3BhcmVuY3k6IGEgdmFsdWUgY29udHJvbHMgb3BhY2l0eSwgMjU1ID0gZnVsbHkgb3BhcXVlLCAwID0gZnVsbHkgdHJhbnNwYXJlbnRcXG5cXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn8J+TkCBWZWN0b3IgYW5kIFNpemUgVHlwZXM6XFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiB2ZWMyOiB7XCJ4XCI6MTAwLFwieVwiOjUwfSAoMkQgdmVjdG9yKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgdmVjMzoge1wieFwiOjEsXCJ5XCI6MixcInpcIjozfSAoM0QgdmVjdG9yKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgc2l6ZToge1wid2lkdGhcIjoxMDAsXCJoZWlnaHRcIjo1MH0gKHNpemUgZGltZW5zaW9ucylcXG5cXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn8J+UlyBSZWZlcmVuY2UgVHlwZXMgKHVzaW5nIFVVSUQgc3RyaW5ncyk6XFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiBub2RlOiBcInRhcmdldC1ub2RlLXV1aWRcIiAobm9kZSByZWZlcmVuY2UpXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgSG93IHRvIGdldDogVXNlIGdldF9hbGxfbm9kZXMgb3IgZmluZF9ub2RlX2J5X25hbWUgdG8gZ2V0IG5vZGUgVVVJRHNcXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn4oCiIGNvbXBvbmVudDogXCJ0YXJnZXQtbm9kZS11dWlkXCIgKGNvbXBvbmVudCByZWZlcmVuY2UpXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgSG93IGl0IHdvcmtzOiBcXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICAgIDEuIFByb3ZpZGUgdGhlIFVVSUQgb2YgdGhlIE5PREUgdGhhdCBjb250YWlucyB0aGUgdGFyZ2V0IGNvbXBvbmVudFxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgICAgMi4gU3lzdGVtIGF1dG8tZGV0ZWN0cyByZXF1aXJlZCBjb21wb25lbnQgdHlwZSBmcm9tIHByb3BlcnR5IG1ldGFkYXRhXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgICAzLiBGaW5kcyB0aGUgY29tcG9uZW50IG9uIHRhcmdldCBub2RlIGFuZCBnZXRzIGl0cyBzY2VuZSBfX2lkX19cXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICAgIDQuIFNldHMgcmVmZXJlbmNlIHVzaW5nIHRoZSBzY2VuZSBfX2lkX18gKG5vdCBub2RlIFVVSUQpXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgRXhhbXBsZTogdmFsdWU9XCJsYWJlbC1ub2RlLXV1aWRcIiB3aWxsIGZpbmQgY2MuTGFiZWwgYW5kIHVzZSBpdHMgc2NlbmUgSURcXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn4oCiIHNwcml0ZUZyYW1lOiBcInNwcml0ZWZyYW1lLXV1aWRcIiAoc3ByaXRlIGZyYW1lIGFzc2V0KVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgIEhvdyB0byBnZXQ6IENoZWNrIGFzc2V0IGRhdGFiYXNlIG9yIHVzZSBhc3NldCBicm93c2VyXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiBwcmVmYWI6IFwicHJlZmFiLXV1aWRcIiAocHJlZmFiIGFzc2V0KVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgIEhvdyB0byBnZXQ6IENoZWNrIGFzc2V0IGRhdGFiYXNlIG9yIHVzZSBhc3NldCBicm93c2VyXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiBhc3NldDogXCJhc3NldC11dWlkXCIgKGdlbmVyaWMgYXNzZXQgcmVmZXJlbmNlKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgIEhvdyB0byBnZXQ6IENoZWNrIGFzc2V0IGRhdGFiYXNlIG9yIHVzZSBhc3NldCBicm93c2VyXFxuXFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ/Cfk4sgQXJyYXkgVHlwZXM6XFxuJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ+KAoiBub2RlQXJyYXk6IFtcInV1aWQxXCIsXCJ1dWlkMlwiXSAoYXJyYXkgb2Ygbm9kZSBVVUlEcylcXG4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAn4oCiIGNvbG9yQXJyYXk6IFt7XCJyXCI6MjU1LFwiZ1wiOjAsXCJiXCI6MCxcImFcIjoyNTV9XSAoYXJyYXkgb2YgY29sb3JzKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgbnVtYmVyQXJyYXk6IFsxLDIsMyw0LDVdIChhcnJheSBvZiBudW1iZXJzKVxcbicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICfigKIgc3RyaW5nQXJyYXk6IFtcIml0ZW0xXCIsXCJpdGVtMlwiXSAoYXJyYXkgb2Ygc3RyaW5ncyknXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ25vZGVVdWlkJywgJ2NvbXBvbmVudFR5cGUnLCAncHJvcGVydHknLCAncHJvcGVydHlUeXBlJywgJ3ZhbHVlJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NvbmZpZ3VyZV9jbGlja19ldmVudCcsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbmZpZ3VyZSBvciByZW1vdmUgY2xpY2sgZXZlbnRzIG9uIGEgY2MuQnV0dG9uIGNvbXBvbmVudC4gVXNlIGFjdGlvbiBcInNldFwiIHRvIGNvbmZpZ3VyZSBhIGNsaWNrIGV2ZW50IGhhbmRsZXIsIGFjdGlvbiBcInJlbW92ZVwiIHRvIGNsZWFyIGFsbCBjbGljayBldmVudHMuJyxcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydzZXQnLCAncmVtb3ZlJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FjdGlvbjogc2V0IGEgY2xpY2sgZXZlbnQgaGFuZGxlciBvciByZW1vdmUgYWxsIGNsaWNrIGV2ZW50cydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIFVVSUQgb2YgdGhlIG5vZGUgd2l0aCB0aGUgY2MuQnV0dG9uIGNvbXBvbmVudCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZVV1aWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVVUlEIG9mIHRoZSB0YXJnZXQgbm9kZSBjb250YWluaW5nIHRoZSBzY3JpcHQgY29tcG9uZW50LiBSZXF1aXJlZCBmb3Igc2V0LidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q29tcG9uZW50VHlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NjcmlwdCBjb21wb25lbnQgdHlwZSBuYW1lIG9uIHRoZSB0YXJnZXQgbm9kZS4gUmVxdWlyZWQgZm9yIHNldC4nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZE5hbWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNZXRob2QgbmFtZSB0byBjYWxsIHdoZW4gYnV0dG9uIGlzIGNsaWNrZWQuIFJlcXVpcmVkIGZvciBzZXQuJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21FdmVudERhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcHRpb25hbCBjdXN0b20gZXZlbnQgZGF0YSBzdHJpbmcgcGFzc2VkIHRvIHRoZSBoYW5kbGVyJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydhY3Rpb24nLCAnbm9kZVV1aWQnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICdjb21wb25lbnRfbWFuYWdlJzpcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXJncy5hY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdhZGQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5hZGRDb21wb25lbnQoYXJncy5ub2RlVXVpZCwgYXJncy5jb21wb25lbnRUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdyZW1vdmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZW1vdmVDb21wb25lbnQoYXJncy5ub2RlVXVpZCwgYXJncy5jb21wb25lbnRUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthcmdzLmFjdGlvbn0uIFVzZSBcImFkZFwiIG9yIFwicmVtb3ZlXCIuYCB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlICdjb21wb25lbnRfc2NyaXB0JzpcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXJncy5hY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdhdHRhY2gnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5hdHRhY2hTY3JpcHQoYXJncy5ub2RlVXVpZCwgYXJncy5zY3JpcHRQYXRoKTtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdkZXRhY2gnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZXRhY2hTY3JpcHQoYXJncy5ub2RlVXVpZCwgYXJncy5zY3JpcHROYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBVbmtub3duIGFjdGlvbjogJHthcmdzLmFjdGlvbn0uIFVzZSBcImF0dGFjaFwiIG9yIFwiZGV0YWNoXCIuYCB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlICdjb21wb25lbnRfcXVlcnknOlxyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChhcmdzLmFjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dldF9hbGwnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRDb21wb25lbnRzKGFyZ3Mubm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dldF9pbmZvJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0Q29tcG9uZW50SW5mbyhhcmdzLm5vZGVVdWlkLCBhcmdzLmNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dldF9hdmFpbGFibGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBdmFpbGFibGVDb21wb25lbnRzKGFyZ3MuY2F0ZWdvcnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYFVua25vd24gYWN0aW9uOiAke2FyZ3MuYWN0aW9ufS4gVXNlIFwiZ2V0X2FsbFwiLCBcImdldF9pbmZvXCIsIG9yIFwiZ2V0X2F2YWlsYWJsZVwiLmAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSAnc2V0X2NvbXBvbmVudF9wcm9wZXJ0eSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXRDb21wb25lbnRQcm9wZXJ0eShhcmdzKTtcclxuICAgICAgICAgICAgY2FzZSAnY29uZmlndXJlX2NsaWNrX2V2ZW50JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbmZpZ3VyZUNsaWNrRXZlbnQoYXJncy5hY3Rpb24sIGFyZ3MpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZGV0YWNoU2NyaXB0KG5vZGVVdWlkOiBzdHJpbmcsIHNjcmlwdE5hbWU6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVtb3ZlQ29tcG9uZW50KG5vZGVVdWlkLCBzY3JpcHROYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGNvbmZpZ3VyZUNsaWNrRXZlbnQoYWN0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3JlbW92ZScpIHtcclxuICAgICAgICAgICAgLy8gU2V0IF9jbGlja0V2ZW50cyB0byBlbXB0eSBhcnJheSBvbiBjYy5CdXR0b24gY29tcG9uZW50XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNldEJ1dHRvblByb3BlcnR5KGFyZ3Mubm9kZVV1aWQsICdfY2xpY2tFdmVudHMnLCAnbm9kZUFycmF5JywgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBhY3Rpb24gPT09ICdzZXQnXHJcbiAgICAgICAgY29uc3QgY2xpY2tFdmVudCA9IFt7XHJcbiAgICAgICAgICAgIHRhcmdldDogeyBfX3V1aWRfXzogYXJncy50YXJnZXROb2RlVXVpZCB9LFxyXG4gICAgICAgICAgICBjb21wb25lbnQ6IGFyZ3Muc2NyaXB0Q29tcG9uZW50VHlwZSxcclxuICAgICAgICAgICAgaGFuZGxlcjogYXJncy5tZXRob2ROYW1lLFxyXG4gICAgICAgICAgICBjdXN0b21FdmVudERhdGE6IGFyZ3MuY3VzdG9tRXZlbnREYXRhIHx8ICcnXHJcbiAgICAgICAgfV07XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2V0QnV0dG9uUHJvcGVydHkoYXJncy5ub2RlVXVpZCwgJ19jbGlja0V2ZW50cycsICdub2RlQXJyYXknLCBjbGlja0V2ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNldEJ1dHRvblByb3BlcnR5KG5vZGVVdWlkOiBzdHJpbmcsIHByb3BlcnR5OiBzdHJpbmcsIHByb3BlcnR5VHlwZTogc3RyaW5nLCB2YWx1ZTogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zZXRDb21wb25lbnRQcm9wZXJ0eSh7XHJcbiAgICAgICAgICAgIG5vZGVVdWlkLFxyXG4gICAgICAgICAgICBjb21wb25lbnRUeXBlOiAnY2MuQnV0dG9uJyxcclxuICAgICAgICAgICAgcHJvcGVydHksXHJcbiAgICAgICAgICAgIHByb3BlcnR5VHlwZSxcclxuICAgICAgICAgICAgdmFsdWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGFkZENvbXBvbmVudChub2RlVXVpZDogc3RyaW5nLCBjb21wb25lbnRUeXBlOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyDlhYjmn6Xmib7oioLngrnkuIrmmK/lkKblt7LlrZjlnKjor6Xnu4Tku7ZcclxuICAgICAgICAgICAgY29uc3QgYWxsQ29tcG9uZW50c0luZm8gPSBhd2FpdCB0aGlzLmdldENvbXBvbmVudHMobm9kZVV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYWxsQ29tcG9uZW50c0luZm8uc3VjY2VzcyAmJiBhbGxDb21wb25lbnRzSW5mby5kYXRhPy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZ0NvbXBvbmVudCA9IGFsbENvbXBvbmVudHNJbmZvLmRhdGEuY29tcG9uZW50cy5maW5kKChjb21wOiBhbnkpID0+IGNvbXAudHlwZSA9PT0gY29tcG9uZW50VHlwZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdDb21wb25lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYENvbXBvbmVudCAnJHtjb21wb25lbnRUeXBlfScgYWxyZWFkeSBleGlzdHMgb24gbm9kZWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRWZXJpZmllZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8g5bCd6K+V55u05o6l5L2/55SoIEVkaXRvciBBUEkg5re75Yqg57uE5Lu2XHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1jb21wb25lbnQnLCB7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50VHlwZVxyXG4gICAgICAgICAgICB9KS50aGVuKGFzeW5jIChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8g562J5b6F5LiA5q615pe26Ze06K6pRWRpdG9y5a6M5oiQ57uE5Lu25re75YqgXHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwKSk7XHJcbiAgICAgICAgICAgICAgICAvLyDph43mlrDmn6Xor6LoioLngrnkv6Hmga/pqozor4Hnu4Tku7bmmK/lkKbnnJ/nmoTmt7vliqDmiJDlip9cclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxsQ29tcG9uZW50c0luZm8yID0gYXdhaXQgdGhpcy5nZXRDb21wb25lbnRzKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ29tcG9uZW50c0luZm8yLnN1Y2Nlc3MgJiYgYWxsQ29tcG9uZW50c0luZm8yLmRhdGE/LmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRkZWRDb21wb25lbnQgPSBhbGxDb21wb25lbnRzSW5mbzIuZGF0YS5jb21wb25lbnRzLmZpbmQoKGNvbXA6IGFueSkgPT4gY29tcC50eXBlID09PSBjb21wb25lbnRUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkQ29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBDb21wb25lbnQgJyR7Y29tcG9uZW50VHlwZX0nIGFkZGVkIHN1Y2Nlc3NmdWxseWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFZlcmlmaWVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZzogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgQ29tcG9uZW50ICcke2NvbXBvbmVudFR5cGV9JyB3YXMgbm90IGZvdW5kIG9uIG5vZGUgYWZ0ZXIgYWRkaXRpb24uIEF2YWlsYWJsZSBjb21wb25lbnRzOiAke2FsbENvbXBvbmVudHNJbmZvMi5kYXRhLmNvbXBvbmVudHMubWFwKChjOiBhbnkpID0+IGMudHlwZSkuam9pbignLCAnKX1gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byB2ZXJpZnkgY29tcG9uZW50IGFkZGl0aW9uOiAke2FsbENvbXBvbmVudHNJbmZvMi5lcnJvciB8fCAnVW5hYmxlIHRvIGdldCBub2RlIGNvbXBvbmVudHMnfWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAodmVyaWZ5RXJyb3I6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gdmVyaWZ5IGNvbXBvbmVudCBhZGRpdGlvbjogJHt2ZXJpZnlFcnJvci5tZXNzYWdlfWBcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIOWkh+eUqOaWueahiO+8muS9v+eUqOWcuuaZr+iEmuacrFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnYWRkQ29tcG9uZW50VG9Ob2RlJyxcclxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBbbm9kZVV1aWQsIGNvbXBvbmVudFR5cGVdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnIyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBEaXJlY3QgQVBJIGZhaWxlZDogJHtlcnIubWVzc2FnZX0sIFNjZW5lIHNjcmlwdCBmYWlsZWQ6ICR7ZXJyMi5tZXNzYWdlfWAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZW1vdmVDb21wb25lbnQobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgLy8gMS4g5p+l5om+6IqC54K55LiK55qE5omA5pyJ57uE5Lu2XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbENvbXBvbmVudHNJbmZvID0gYXdhaXQgdGhpcy5nZXRDb21wb25lbnRzKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgaWYgKCFhbGxDb21wb25lbnRzSW5mby5zdWNjZXNzIHx8ICFhbGxDb21wb25lbnRzSW5mby5kYXRhPy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgRmFpbGVkIHRvIGdldCBjb21wb25lbnRzIGZvciBub2RlICcke25vZGVVdWlkfSc6ICR7YWxsQ29tcG9uZW50c0luZm8uZXJyb3J9YCB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyAyLiDlj6rmn6Xmib50eXBl5a2X5q61562J5LqOY29tcG9uZW50VHlwZeeahOe7hOS7tu+8iOWNs2NpZO+8iVxyXG4gICAgICAgICAgICBjb25zdCBleGlzdHMgPSBhbGxDb21wb25lbnRzSW5mby5kYXRhLmNvbXBvbmVudHMuc29tZSgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IGNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cykge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYENvbXBvbmVudCBjaWQgJyR7Y29tcG9uZW50VHlwZX0nIG5vdCBmb3VuZCBvbiBub2RlICcke25vZGVVdWlkfScuIOivt+eUqGdldENvbXBvbmVudHPojrflj5Z0eXBl5a2X5q6177yIY2lk77yJ5L2c5Li6Y29tcG9uZW50VHlwZeOAgmAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gMy4g5a6Y5pa5QVBJ55u05o6l56e76ZmkXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdyZW1vdmUtY29tcG9uZW50Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50VHlwZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvLyA0LiDlho3mn6XkuIDmrKHnoa7orqTmmK/lkKbnp7vpmaRcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFmdGVyUmVtb3ZlSW5mbyA9IGF3YWl0IHRoaXMuZ2V0Q29tcG9uZW50cyhub2RlVXVpZCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdGlsbEV4aXN0cyA9IGFmdGVyUmVtb3ZlSW5mby5zdWNjZXNzICYmIGFmdGVyUmVtb3ZlSW5mby5kYXRhPy5jb21wb25lbnRzPy5zb21lKChjb21wOiBhbnkpID0+IGNvbXAudHlwZSA9PT0gY29tcG9uZW50VHlwZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RpbGxFeGlzdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBgQ29tcG9uZW50IGNpZCAnJHtjb21wb25lbnRUeXBlfScgd2FzIG5vdCByZW1vdmVkIGZyb20gbm9kZSAnJHtub2RlVXVpZH0nLmAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgQ29tcG9uZW50IGNpZCAnJHtjb21wb25lbnRUeXBlfScgcmVtb3ZlZCBzdWNjZXNzZnVsbHkgZnJvbSBub2RlICcke25vZGVVdWlkfSdgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IG5vZGVVdWlkLCBjb21wb25lbnRUeXBlIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBGYWlsZWQgdG8gcmVtb3ZlIGNvbXBvbmVudDogJHtlcnIubWVzc2FnZX1gIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRDb21wb25lbnRzKG5vZGVVdWlkOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyDkvJjlhYjlsJ3or5Xnm7TmjqXkvb/nlKggRWRpdG9yIEFQSSDmn6Xor6LoioLngrnkv6Hmga9cclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVdWlkKS50aGVuKChub2RlRGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZURhdGEgJiYgbm9kZURhdGEuX19jb21wc19fKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50cyA9IG5vZGVEYXRhLl9fY29tcHNfXy5tYXAoKGNvbXA6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY29tcC5fX3R5cGVfXyB8fCBjb21wLmNpZCB8fCBjb21wLnR5cGUgfHwgJ1Vua25vd24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBjb21wLnV1aWQ/LnZhbHVlIHx8IGNvbXAudXVpZCB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBjb21wLmVuYWJsZWQgIT09IHVuZGVmaW5lZCA/IGNvbXAuZW5hYmxlZCA6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHRoaXMuZXh0cmFjdENvbXBvbmVudFByb3BlcnRpZXMoY29tcClcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudHM6IGNvbXBvbmVudHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm9kZSBub3QgZm91bmQgb3Igbm8gY29tcG9uZW50cyBkYXRhJyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIOWkh+eUqOaWueahiO+8muS9v+eUqOWcuuaZr+iEmuacrFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29jb3MtbWNwLXNlcnZlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnZ2V0Tm9kZUluZm8nLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtub2RlVXVpZF1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywgb3B0aW9ucykudGhlbigocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogcmVzdWx0LmRhdGEuY29tcG9uZW50c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycjI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYERpcmVjdCBBUEkgZmFpbGVkOiAke2Vyci5tZXNzYWdlfSwgU2NlbmUgc2NyaXB0IGZhaWxlZDogJHtlcnIyLm1lc3NhZ2V9YCB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldENvbXBvbmVudEluZm8obm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgLy8g5LyY5YWI5bCd6K+V55u05o6l5L2/55SoIEVkaXRvciBBUEkg5p+l6K+i6IqC54K55L+h5oGvXHJcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVXVpZCkudGhlbigobm9kZURhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVEYXRhICYmIG5vZGVEYXRhLl9fY29tcHNfXykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG5vZGVEYXRhLl9fY29tcHNfXy5maW5kKChjb21wOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcFR5cGUgPSBjb21wLl9fdHlwZV9fIHx8IGNvbXAuY2lkIHx8IGNvbXAudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBUeXBlID09PSBjb21wb25lbnRUeXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGNvbXBvbmVudC5lbmFibGVkICE9PSB1bmRlZmluZWQgPyBjb21wb25lbnQuZW5hYmxlZCA6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5leHRyYWN0Q29tcG9uZW50UHJvcGVydGllcyhjb21wb25lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJyR7Y29tcG9uZW50VHlwZX0nIG5vdCBmb3VuZCBvbiBub2RlYCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6ICdOb2RlIG5vdCBmb3VuZCBvciBubyBjb21wb25lbnRzIGRhdGEnIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8g5aSH55So5pa55qGI77ya5L2/55So5Zy65pmv6ISa5pysXHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjb2Nvcy1tY3Atc2VydmVyJyxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdnZXROb2RlSW5mbycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW25vZGVVdWlkXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZXhlY3V0ZS1zY2VuZS1zY3JpcHQnLCBvcHRpb25zKS50aGVuKChyZXN1bHQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcyAmJiByZXN1bHQuZGF0YS5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHJlc3VsdC5kYXRhLmNvbXBvbmVudHMuZmluZCgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IGNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5jb21wb25lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGBDb21wb25lbnQgJyR7Y29tcG9uZW50VHlwZX0nIG5vdCBmb3VuZCBvbiBub2RlYCB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHJlc3VsdC5lcnJvciB8fCAnRmFpbGVkIHRvIGdldCBjb21wb25lbnQgaW5mbycgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycjI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogYERpcmVjdCBBUEkgZmFpbGVkOiAke2Vyci5tZXNzYWdlfSwgU2NlbmUgc2NyaXB0IGZhaWxlZDogJHtlcnIyLm1lc3NhZ2V9YCB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGV4dHJhY3RDb21wb25lbnRQcm9wZXJ0aWVzKGNvbXBvbmVudDogYW55KTogUmVjb3JkPHN0cmluZywgYW55PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFtleHRyYWN0Q29tcG9uZW50UHJvcGVydGllc10gUHJvY2Vzc2luZyBjb21wb25lbnQ6YCwgT2JqZWN0LmtleXMoY29tcG9uZW50KSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5qOA5p+l57uE5Lu25piv5ZCm5pyJIHZhbHVlIOWxnuaAp++8jOi/memAmuW4uOWMheWQq+WunumZheeahOe7hOS7tuWxnuaAp1xyXG4gICAgICAgIGlmIChjb21wb25lbnQudmFsdWUgJiYgdHlwZW9mIGNvbXBvbmVudC52YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFtleHRyYWN0Q29tcG9uZW50UHJvcGVydGllc10gRm91bmQgY29tcG9uZW50LnZhbHVlIHdpdGggcHJvcGVydGllczpgLCBPYmplY3Qua2V5cyhjb21wb25lbnQudmFsdWUpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudC52YWx1ZTsgLy8g55u05o6l6L+U5ZueIHZhbHVlIOWvueixoe+8jOWug+WMheWQq+aJgOaciee7hOS7tuWxnuaAp1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyDlpIfnlKjmlrnmoYjvvJrku47nu4Tku7blr7nosaHkuK3nm7TmjqXmj5Dlj5blsZ7mgKdcclxuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XHJcbiAgICAgICAgY29uc3QgZXhjbHVkZUtleXMgPSBbJ19fdHlwZV9fJywgJ2VuYWJsZWQnLCAnbm9kZScsICdfaWQnLCAnX19zY3JpcHRBc3NldCcsICd1dWlkJywgJ25hbWUnLCAnX25hbWUnLCAnX29iakZsYWdzJywgJ19lbmFibGVkJywgJ3R5cGUnLCAncmVhZG9ubHknLCAndmlzaWJsZScsICdjaWQnLCAnZWRpdG9yJywgJ2V4dGVuZHMnXTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjb21wb25lbnQpIHtcclxuICAgICAgICAgICAgaWYgKCFleGNsdWRlS2V5cy5pbmNsdWRlcyhrZXkpICYmICFrZXkuc3RhcnRzV2l0aCgnXycpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW2V4dHJhY3RDb21wb25lbnRQcm9wZXJ0aWVzXSBGb3VuZCBkaXJlY3QgcHJvcGVydHkgJyR7a2V5fSc6YCwgdHlwZW9mIGNvbXBvbmVudFtrZXldKTtcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXNba2V5XSA9IGNvbXBvbmVudFtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbZXh0cmFjdENvbXBvbmVudFByb3BlcnRpZXNdIEZpbmFsIGV4dHJhY3RlZCBwcm9wZXJ0aWVzOmAsIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpKTtcclxuICAgICAgICByZXR1cm4gcHJvcGVydGllcztcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGZpbmRDb21wb25lbnRUeXBlQnlVdWlkKGNvbXBvbmVudFV1aWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbZmluZENvbXBvbmVudFR5cGVCeVV1aWRdIFNlYXJjaGluZyBmb3IgY29tcG9uZW50IHR5cGUgd2l0aCBVVUlEOiAke2NvbXBvbmVudFV1aWR9YCk7XHJcbiAgICAgICAgaWYgKCFjb21wb25lbnRVdWlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlVHJlZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUtdHJlZScpO1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVUcmVlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tmaW5kQ29tcG9uZW50VHlwZUJ5VXVpZF0gRmFpbGVkIHRvIHF1ZXJ5IG5vZGUgdHJlZS4nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBxdWV1ZTogYW55W10gPSBbbm9kZVRyZWVdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlSW5mbyA9IHF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnROb2RlSW5mbyB8fCAhY3VycmVudE5vZGVJbmZvLnV1aWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxOb2RlRGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBjdXJyZW50Tm9kZUluZm8udXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bGxOb2RlRGF0YSAmJiBmdWxsTm9kZURhdGEuX19jb21wc19fKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY29tcCBvZiBmdWxsTm9kZURhdGEuX19jb21wc19fKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wQW55ID0gY29tcCBhcyBhbnk7IC8vIENhc3QgdG8gYW55IHRvIGFjY2VzcyBkeW5hbWljIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjb21wb25lbnQgVVVJRCBpcyBuZXN0ZWQgaW4gdGhlICd2YWx1ZScgcHJvcGVydHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wQW55LnV1aWQgJiYgY29tcEFueS51dWlkLnZhbHVlID09PSBjb21wb25lbnRVdWlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcG9uZW50VHlwZSA9IGNvbXBBbnkuX190eXBlX187XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtmaW5kQ29tcG9uZW50VHlwZUJ5VXVpZF0gRm91bmQgY29tcG9uZW50IHR5cGUgJyR7Y29tcG9uZW50VHlwZX0nIGZvciBVVUlEICR7Y29tcG9uZW50VXVpZH0gb24gbm9kZSAke2Z1bGxOb2RlRGF0YS5uYW1lPy52YWx1ZX1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcG9uZW50VHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtmaW5kQ29tcG9uZW50VHlwZUJ5VXVpZF0gQ291bGQgbm90IHF1ZXJ5IG5vZGUgJHtjdXJyZW50Tm9kZUluZm8udXVpZH06YCwgZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlSW5mby5jaGlsZHJlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY3VycmVudE5vZGVJbmZvLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbZmluZENvbXBvbmVudFR5cGVCeVV1aWRdIENvbXBvbmVudCB3aXRoIFVVSUQgJHtjb21wb25lbnRVdWlkfSBub3QgZm91bmQgaW4gc2NlbmUgdHJlZS5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW2ZpbmRDb21wb25lbnRUeXBlQnlVdWlkXSBFcnJvciB3aGlsZSBzZWFyY2hpbmcgZm9yIGNvbXBvbmVudCB0eXBlOmAsIGVycm9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgc2V0Q29tcG9uZW50UHJvcGVydHkoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBub2RlVXVpZCwgY29tcG9uZW50VHlwZSwgcHJvcGVydHksIHByb3BlcnR5VHlwZSwgdmFsdWUgfSA9IGFyZ3M7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBTZXR0aW5nICR7Y29tcG9uZW50VHlwZX0uJHtwcm9wZXJ0eX0gKHR5cGU6ICR7cHJvcGVydHlUeXBlfSkgPSAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gb24gbm9kZSAke25vZGVVdWlkfWApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBTdGVwIDA6IOajgOa1i+aYr+WQpuS4uuiKgueCueWxnuaAp++8jOWmguaenOaYr+WImemHjeWumuWQkeWIsOWvueW6lOeahOiKgueCueaWueazlVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVJlZGlyZWN0UmVzdWx0ID0gYXdhaXQgdGhpcy5jaGVja0FuZFJlZGlyZWN0Tm9kZVByb3BlcnRpZXMoYXJncyk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZVJlZGlyZWN0UmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShub2RlUmVkaXJlY3RSZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gU3RlcCAxOiDojrflj5bnu4Tku7bkv6Hmga/vvIzkvb/nlKjkuI5nZXRDb21wb25lbnRz55u45ZCM55qE5pa55rOVXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnRzUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldENvbXBvbmVudHMobm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wb25lbnRzUmVzcG9uc2Uuc3VjY2VzcyB8fCAhY29tcG9uZW50c1Jlc3BvbnNlLmRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGdldCBjb21wb25lbnRzIGZvciBub2RlICcke25vZGVVdWlkfSc6ICR7Y29tcG9uZW50c1Jlc3BvbnNlLmVycm9yfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiBgUGxlYXNlIHZlcmlmeSB0aGF0IG5vZGUgVVVJRCAnJHtub2RlVXVpZH0nIGlzIGNvcnJlY3QuIFVzZSBnZXRfYWxsX25vZGVzIG9yIGZpbmRfbm9kZV9ieV9uYW1lIHRvIGdldCB0aGUgY29ycmVjdCBub2RlIFVVSUQuYFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsQ29tcG9uZW50cyA9IGNvbXBvbmVudHNSZXNwb25zZS5kYXRhLmNvbXBvbmVudHM7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgMjog5p+l5om+55uu5qCH57uE5Lu2XHJcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0Q29tcG9uZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZVR5cGVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbENvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gYWxsQ29tcG9uZW50c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUeXBlcy5wdXNoKGNvbXAudHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXAudHlwZSA9PT0gY29tcG9uZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRDb21wb25lbnQgPSBjb21wO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0Q29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5o+Q5L6b5pu06K+m57uG55qE6ZSZ6K+v5L+h5oGv5ZKM5bu66K6uXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0aGlzLmdlbmVyYXRlQ29tcG9uZW50U3VnZ2VzdGlvbihjb21wb25lbnRUeXBlLCBhdmFpbGFibGVUeXBlcywgcHJvcGVydHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBDb21wb25lbnQgJyR7Y29tcG9uZW50VHlwZX0nIG5vdCBmb3VuZCBvbiBub2RlLiBBdmFpbGFibGUgY29tcG9uZW50czogJHthdmFpbGFibGVUeXBlcy5qb2luKCcsICcpfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiBpbnN0cnVjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gU3RlcCAzOiDoh6rliqjmo4DmtYvlkozovazmjaLlsZ7mgKflgLxcclxuICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eUluZm87XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIEFuYWx5emluZyBwcm9wZXJ0eTogJHtwcm9wZXJ0eX1gKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUluZm8gPSB0aGlzLmFuYWx5emVQcm9wZXJ0eSh0YXJnZXRDb21wb25lbnQsIHByb3BlcnR5KTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGFuYWx5emVFcnJvcjogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0NvbXBvbmVudFRvb2xzXSBFcnJvciBpbiBhbmFseXplUHJvcGVydHk6YCwgYW5hbHl6ZUVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGFuYWx5emUgcHJvcGVydHkgJyR7cHJvcGVydHl9JzogJHthbmFseXplRXJyb3IubWVzc2FnZX1gXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIXByb3BlcnR5SW5mby5leGlzdHMpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyBub3QgZm91bmQgb24gY29tcG9uZW50ICcke2NvbXBvbmVudFR5cGV9Jy4gQXZhaWxhYmxlIHByb3BlcnRpZXM6ICR7cHJvcGVydHlJbmZvLmF2YWlsYWJsZVByb3BlcnRpZXMuam9pbignLCAnKX1gXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBTdGVwIDQ6IOWkhOeQhuWxnuaAp+WAvOWSjOiuvue9rlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxWYWx1ZSA9IHByb3BlcnR5SW5mby5vcmlnaW5hbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHByb2Nlc3NlZFZhbHVlOiBhbnk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIOagueaNruaYjuehrueahHByb3BlcnR5VHlwZeWkhOeQhuWxnuaAp+WAvFxyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwcm9wZXJ0eVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IFN0cmluZyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW50ZWdlcic6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZmxvYXQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IE51bWJlcih2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IEJvb2xlYW4odmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdjb2xvcic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlrZfnrKbkuLLmoLzlvI/vvJrmlK/mjIHljYHlha3ov5vliLbjgIHpopzoibLlkI3np7DjgIFyZ2IoKS9yZ2JhKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZFZhbHVlID0gdGhpcy5wYXJzZUNvbG9yU3RyaW5nKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlr7nosaHmoLzlvI/vvJrpqozor4HlubbovazmjaJSR0JB5YC8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5yKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZzogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIodmFsdWUuZykgfHwgMCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGI6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHZhbHVlLmIpIHx8IDApKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhOiB2YWx1ZS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcih2YWx1ZS5hKSkpIDogMjU1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb2xvciB2YWx1ZSBtdXN0IGJlIGFuIG9iamVjdCB3aXRoIHIsIGcsIGIgcHJvcGVydGllcyBvciBhIGhleGFkZWNpbWFsIHN0cmluZyAoZS5nLiwgXCIjRkYwMDAwXCIpJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndmVjMic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBOdW1iZXIodmFsdWUueCkgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBOdW1iZXIodmFsdWUueSkgfHwgMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVmVjMiB2YWx1ZSBtdXN0IGJlIGFuIG9iamVjdCB3aXRoIHgsIHkgcHJvcGVydGllcycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ZlYzMnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogTnVtYmVyKHZhbHVlLngpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogTnVtYmVyKHZhbHVlLnkpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgejogTnVtYmVyKHZhbHVlLnopIHx8IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZlYzMgdmFsdWUgbXVzdCBiZSBhbiBvYmplY3Qgd2l0aCB4LCB5LCB6IHByb3BlcnRpZXMnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZFZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIodmFsdWUud2lkdGgpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBOdW1iZXIodmFsdWUuaGVpZ2h0KSB8fCAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaXplIHZhbHVlIG11c3QgYmUgYW4gb2JqZWN0IHdpdGggd2lkdGgsIGhlaWdodCBwcm9wZXJ0aWVzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbm9kZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IHsgdXVpZDogdmFsdWUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSByZWZlcmVuY2UgdmFsdWUgbXVzdCBiZSBhIHN0cmluZyBVVUlEJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29tcG9uZW50JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOe7hOS7tuW8leeUqOmcgOimgeeJueauiuWkhOeQhu+8mumAmui/h+iKgueCuVVVSUTmib7liLDnu4Tku7bnmoRfX2lkX19cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZFZhbHVlID0gdmFsdWU7IC8vIOWFiOS/neWtmOiKgueCuVVVSUTvvIzlkI7nu63kvJrovazmjaLkuLpfX2lkX19cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tcG9uZW50IHJlZmVyZW5jZSB2YWx1ZSBtdXN0IGJlIGEgc3RyaW5nIChub2RlIFVVSUQgY29udGFpbmluZyB0aGUgdGFyZ2V0IGNvbXBvbmVudCknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzcHJpdGVGcmFtZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJlZmFiJzpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdhc3NldCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRWYWx1ZSA9IHsgdXVpZDogdmFsdWUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtwcm9wZXJ0eVR5cGV9IHZhbHVlIG11c3QgYmUgYSBzdHJpbmcgVVVJRGApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ25vZGVBcnJheSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkVmFsdWUgPSB2YWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdXVpZDogaXRlbSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZUFycmF5IGl0ZW1zIG11c3QgYmUgc3RyaW5nIFVVSURzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGVBcnJheSB2YWx1ZSBtdXN0IGJlIGFuIGFycmF5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29sb3JBcnJheSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkVmFsdWUgPSB2YWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgaXRlbSAhPT0gbnVsbCAmJiAncicgaW4gaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5yKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpdGVtLmcpIHx8IDApKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGI6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGl0ZW0uYikgfHwgMCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYTogaXRlbS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpdGVtLmEpKSkgOiAyNTVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29sb3JBcnJheSB2YWx1ZSBtdXN0IGJlIGFuIGFycmF5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyQXJyYXknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZFZhbHVlID0gdmFsdWUubWFwKChpdGVtOiBhbnkpID0+IE51bWJlcihpdGVtKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ051bWJlckFycmF5IHZhbHVlIG11c3QgYmUgYW4gYXJyYXknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdHJpbmdBcnJheSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkVmFsdWUgPSB2YWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4gU3RyaW5nKGl0ZW0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3RyaW5nQXJyYXkgdmFsdWUgbXVzdCBiZSBhbiBhcnJheScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgcHJvcGVydHkgdHlwZTogJHtwcm9wZXJ0eVR5cGV9YCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIENvbnZlcnRpbmcgdmFsdWU6ICR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSAtPiAke0pTT04uc3RyaW5naWZ5KHByb2Nlc3NlZFZhbHVlKX0gKHR5cGU6ICR7cHJvcGVydHlUeXBlfSlgKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIFByb3BlcnR5IGFuYWx5c2lzIHJlc3VsdDogcHJvcGVydHlJbmZvLnR5cGU9XCIke3Byb3BlcnR5SW5mby50eXBlfVwiLCBwcm9wZXJ0eVR5cGU9XCIke3Byb3BlcnR5VHlwZX1cImApO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtDb21wb25lbnRUb29sc10gV2lsbCB1c2UgY29sb3Igc3BlY2lhbCBoYW5kbGluZzogJHtwcm9wZXJ0eVR5cGUgPT09ICdjb2xvcicgJiYgcHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0J31gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8g55So5LqO6aqM6K+B55qE5a6e6ZmF5pyf5pyb5YC877yI5a+55LqO57uE5Lu25byV55So6ZyA6KaB54m55q6K5aSE55CG77yJXHJcbiAgICAgICAgICAgICAgICBsZXQgYWN0dWFsRXhwZWN0ZWRWYWx1ZSA9IHByb2Nlc3NlZFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBTdGVwIDU6IOiOt+WPluWOn+Wni+iKgueCueaVsOaNruadpeaehOW7uuato+ehrueahOi3r+W+hFxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmF3Tm9kZURhdGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyYXdOb2RlRGF0YSB8fCAhcmF3Tm9kZURhdGEuX19jb21wc19fKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBnZXQgcmF3IG5vZGUgZGF0YSBmb3IgcHJvcGVydHkgc2V0dGluZ2BcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIOaJvuWIsOWOn+Wni+e7hOS7tueahOe0ouW8lVxyXG4gICAgICAgICAgICAgICAgbGV0IHJhd0NvbXBvbmVudEluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJhd05vZGVEYXRhLl9fY29tcHNfXy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSByYXdOb2RlRGF0YS5fX2NvbXBzX19baV0gYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBUeXBlID0gY29tcC5fX3R5cGVfXyB8fCBjb21wLmNpZCB8fCBjb21wLnR5cGUgfHwgJ1Vua25vd24nO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wVHlwZSA9PT0gY29tcG9uZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByYXdDb21wb25lbnRJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHJhd0NvbXBvbmVudEluZGV4ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBDb3VsZCBub3QgZmluZCBjb21wb25lbnQgaW5kZXggZm9yIHNldHRpbmcgcHJvcGVydHlgXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyDmnoTlu7rmraPnoa7nmoTlsZ7mgKfot6/lvoRcclxuICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eVBhdGggPSBgX19jb21wc19fLiR7cmF3Q29tcG9uZW50SW5kZXh9LiR7cHJvcGVydHl9YDtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8g54m55q6K5aSE55CG6LWE5rqQ57G75bGe5oCnXHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlUeXBlID09PSAnYXNzZXQnIHx8IHByb3BlcnR5VHlwZSA9PT0gJ3Nwcml0ZUZyYW1lJyB8fCBwcm9wZXJ0eVR5cGUgPT09ICdwcmVmYWInIHx8IFxyXG4gICAgICAgICAgICAgICAgICAgIChwcm9wZXJ0eUluZm8udHlwZSA9PT0gJ2Fzc2V0JyAmJiBwcm9wZXJ0eVR5cGUgPT09ICdzdHJpbmcnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIFNldHRpbmcgYXNzZXQgcmVmZXJlbmNlOmAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHByb2Nlc3NlZFZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VHlwZTogcHJvcGVydHlUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwcm9wZXJ0eVBhdGhcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBEZXRlcm1pbmUgYXNzZXQgdHlwZSBiYXNlZCBvbiBwcm9wZXJ0eSBuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0VHlwZSA9ICdjYy5TcHJpdGVGcmFtZSc7IC8vIGRlZmF1bHRcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndGV4dHVyZScpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VHlwZSA9ICdjYy5UZXh0dXJlMkQnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbWF0ZXJpYWwnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFR5cGUgPSAnY2MuTWF0ZXJpYWwnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnZm9udCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VHlwZSA9ICdjYy5Gb250JztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2NsaXAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFR5cGUgPSAnY2MuQXVkaW9DbGlwJztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5VHlwZSA9PT0gJ3ByZWZhYicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRUeXBlID0gJ2NjLlByZWZhYic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHByb3BlcnR5UGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9jZXNzZWRWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0VHlwZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUgPT09ICdjYy5VSVRyYW5zZm9ybScgJiYgKHByb3BlcnR5ID09PSAnX2NvbnRlbnRTaXplJyB8fCBwcm9wZXJ0eSA9PT0gJ2NvbnRlbnRTaXplJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTcGVjaWFsIGhhbmRsaW5nIGZvciBVSVRyYW5zZm9ybSBjb250ZW50U2l6ZSAtIHNldCB3aWR0aCBhbmQgaGVpZ2h0IHNlcGFyYXRlbHlcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih2YWx1ZS53aWR0aCkgfHwgMTAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IE51bWJlcih2YWx1ZS5oZWlnaHQpIHx8IDEwMDtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgd2lkdGggZmlyc3RcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBgX19jb21wc19fLiR7cmF3Q29tcG9uZW50SW5kZXh9LndpZHRoYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogd2lkdGggfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZW4gc2V0IGhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGBfX2NvbXBzX18uJHtyYXdDb21wb25lbnRJbmRleH0uaGVpZ2h0YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tcG9uZW50VHlwZSA9PT0gJ2NjLlVJVHJhbnNmb3JtJyAmJiAocHJvcGVydHkgPT09ICdfYW5jaG9yUG9pbnQnIHx8IHByb3BlcnR5ID09PSAnYW5jaG9yUG9pbnQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNwZWNpYWwgaGFuZGxpbmcgZm9yIFVJVHJhbnNmb3JtIGFuY2hvclBvaW50IC0gc2V0IGFuY2hvclggYW5kIGFuY2hvclkgc2VwYXJhdGVseVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuY2hvclggPSBOdW1iZXIodmFsdWUueCkgfHwgMC41O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuY2hvclkgPSBOdW1iZXIodmFsdWUueSkgfHwgMC41O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCBhbmNob3JYIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogYF9fY29tcHNfXy4ke3Jhd0NvbXBvbmVudEluZGV4fS5hbmNob3JYYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogYW5jaG9yWCB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlbiBzZXQgYW5jaG9yWSAgXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogYF9fY29tcHNfXy4ke3Jhd0NvbXBvbmVudEluZGV4fS5hbmNob3JZYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyB2YWx1ZTogYW5jaG9yWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5VHlwZSA9PT0gJ2NvbG9yJyAmJiBwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g54m55q6K5aSE55CG6aKc6Imy5bGe5oCn77yM56Gu5L+dUkdCQeWAvOato+ehrlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENvY29zIENyZWF0b3LpopzoibLlgLzojIPlm7TmmK8wLTI1NVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHI6IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLnIpIHx8IDApKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZzogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIocHJvY2Vzc2VkVmFsdWUuZykgfHwgMCkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiOiBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihwcm9jZXNzZWRWYWx1ZS5iKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGE6IHByb2Nlc3NlZFZhbHVlLmEgIT09IHVuZGVmaW5lZCA/IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKHByb2Nlc3NlZFZhbHVlLmEpKSkgOiAyNTVcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIFNldHRpbmcgY29sb3IgdmFsdWU6YCwgY29sb3JWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJvcGVydHlQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNvbG9yVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2MuQ29sb3InXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlUeXBlID09PSAndmVjMycgJiYgcHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOeJueauiuWkhOeQhlZlYzPlsZ7mgKdcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZWMzVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IE51bWJlcihwcm9jZXNzZWRWYWx1ZS54KSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBOdW1iZXIocHJvY2Vzc2VkVmFsdWUueSkgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgejogTnVtYmVyKHByb2Nlc3NlZFZhbHVlLnopIHx8IDBcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHByb3BlcnR5UGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2ZWMzVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2MuVmVjMydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVR5cGUgPT09ICd2ZWMyJyAmJiBwcm9jZXNzZWRWYWx1ZSAmJiB0eXBlb2YgcHJvY2Vzc2VkVmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g54m55q6K5aSE55CGVmVjMuWxnuaAp1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZlYzJWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeDogTnVtYmVyKHByb2Nlc3NlZFZhbHVlLngpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IE51bWJlcihwcm9jZXNzZWRWYWx1ZS55KSB8fCAwXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwcm9wZXJ0eVBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmVjMlZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NjLlZlYzInXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlUeXBlID09PSAnc2l6ZScgJiYgcHJvY2Vzc2VkVmFsdWUgJiYgdHlwZW9mIHByb2Nlc3NlZFZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOeJueauiuWkhOeQhlNpemXlsZ7mgKdcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzaXplVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIocHJvY2Vzc2VkVmFsdWUud2lkdGgpIHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogTnVtYmVyKHByb2Nlc3NlZFZhbHVlLmhlaWdodCkgfHwgMFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJvcGVydHlQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNpemVWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5TaXplJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5VHlwZSA9PT0gJ25vZGUnICYmIHByb2Nlc3NlZFZhbHVlICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ29iamVjdCcgJiYgJ3V1aWQnIGluIHByb2Nlc3NlZFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g54m55q6K5aSE55CG6IqC54K55byV55SoXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtDb21wb25lbnRUb29sc10gU2V0dGluZyBub2RlIHJlZmVyZW5jZSB3aXRoIFVVSUQ6ICR7cHJvY2Vzc2VkVmFsdWUudXVpZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwcm9wZXJ0eVBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1bXA6IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcHJvY2Vzc2VkVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2MuTm9kZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVR5cGUgPT09ICdjb21wb25lbnQnICYmIHR5cGVvZiBwcm9jZXNzZWRWYWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDnibnmrorlpITnkIbnu4Tku7blvJXnlKjvvJrpgJrov4foioLngrlVVUlE5om+5Yiw57uE5Lu255qEX19pZF9fXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZVV1aWQgPSBwcm9jZXNzZWRWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBTZXR0aW5nIGNvbXBvbmVudCByZWZlcmVuY2UgLSBmaW5kaW5nIGNvbXBvbmVudCBvbiBub2RlOiAke3RhcmdldE5vZGVVdWlkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOS7juW9k+WJjee7hOS7tueahOWxnuaAp+WFg+aVsOaNruS4reiOt+WPluacn+acm+eahOe7hOS7tuexu+Wei1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHBlY3RlZENvbXBvbmVudFR5cGUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAvLyDojrflj5blvZPliY3nu4Tku7bnmoTor6bnu4bkv6Hmga/vvIzljIXmi6zlsZ7mgKflhYPmlbDmja5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SW5mbyA9IGF3YWl0IHRoaXMuZ2V0Q29tcG9uZW50SW5mbyhub2RlVXVpZCwgY29tcG9uZW50VHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRDb21wb25lbnRJbmZvLnN1Y2Nlc3MgJiYgY3VycmVudENvbXBvbmVudEluZm8uZGF0YT8ucHJvcGVydGllcz8uW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU1ldGEgPSBjdXJyZW50Q29tcG9uZW50SW5mby5kYXRhLnByb3BlcnRpZXNbcHJvcGVydHldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LuO5bGe5oCn5YWD5pWw5o2u5Lit5o+Q5Y+W57uE5Lu257G75Z6L5L+h5oGvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eU1ldGEgJiYgdHlwZW9mIHByb3BlcnR5TWV0YSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaciXR5cGXlrZfmrrXmjIfnpLrnu4Tku7bnsbvlnotcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eU1ldGEudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkQ29tcG9uZW50VHlwZSA9IHByb3BlcnR5TWV0YS50eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eU1ldGEuY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacieS6m+WxnuaAp+WPr+iDveS9v+eUqGN0b3LlrZfmrrVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZENvbXBvbmVudFR5cGUgPSBwcm9wZXJ0eU1ldGEuY3RvcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlNZXRhLmV4dGVuZHMgJiYgQXJyYXkuaXNBcnJheShwcm9wZXJ0eU1ldGEuZXh0ZW5kcykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6VleHRlbmRz5pWw57uE77yM6YCa5bi456ys5LiA5Liq5piv5pyA5YW35L2T55qE57G75Z6LXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBleHRlbmRUeXBlIG9mIHByb3BlcnR5TWV0YS5leHRlbmRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHRlbmRUeXBlLnN0YXJ0c1dpdGgoJ2NjLicpICYmIGV4dGVuZFR5cGUgIT09ICdjYy5Db21wb25lbnQnICYmIGV4dGVuZFR5cGUgIT09ICdjYy5PYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZENvbXBvbmVudFR5cGUgPSBleHRlbmRUeXBlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFleHBlY3RlZENvbXBvbmVudFR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZGV0ZXJtaW5lIHJlcXVpcmVkIGNvbXBvbmVudCB0eXBlIGZvciBwcm9wZXJ0eSAnJHtwcm9wZXJ0eX0nIG9uIGNvbXBvbmVudCAnJHtjb21wb25lbnRUeXBlfScuIFByb3BlcnR5IG1ldGFkYXRhIG1heSBub3QgY29udGFpbiB0eXBlIGluZm9ybWF0aW9uLmApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBEZXRlY3RlZCByZXF1aXJlZCBjb21wb25lbnQgdHlwZTogJHtleHBlY3RlZENvbXBvbmVudFR5cGV9IGZvciBwcm9wZXJ0eTogJHtwcm9wZXJ0eX1gKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDojrflj5bnm67moIfoioLngrnnmoTnu4Tku7bkv6Hmga9cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZURhdGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgdGFyZ2V0Tm9kZVV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldE5vZGVEYXRhIHx8ICF0YXJnZXROb2RlRGF0YS5fX2NvbXBzX18pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGFyZ2V0IG5vZGUgJHt0YXJnZXROb2RlVXVpZH0gbm90IGZvdW5kIG9yIGhhcyBubyBjb21wb25lbnRzYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaJk+WNsOebruagh+iKgueCueeahOe7hOS7tuamguiniFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBUYXJnZXQgbm9kZSAke3RhcmdldE5vZGVVdWlkfSBoYXMgJHt0YXJnZXROb2RlRGF0YS5fX2NvbXBzX18ubGVuZ3RofSBjb21wb25lbnRzOmApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlRGF0YS5fX2NvbXBzX18uZm9yRWFjaCgoY29tcDogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY2VuZUlkID0gY29tcC52YWx1ZSAmJiBjb21wLnZhbHVlLnV1aWQgJiYgY29tcC52YWx1ZS51dWlkLnZhbHVlID8gY29tcC52YWx1ZS51dWlkLnZhbHVlIDogJ3Vua25vd24nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtDb21wb25lbnRUb29sc10gQ29tcG9uZW50ICR7aW5kZXh9OiAke2NvbXAudHlwZX0gKHNjZW5lX2lkOiAke3NjZW5lSWR9KWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOafpeaJvuWvueW6lOeahOe7hOS7tlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0Q29tcG9uZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbXBvbmVudElkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWcqOebruagh+iKgueCueeahF9jb21wb25lbnRz5pWw57uE5Lit5p+l5om+5oyH5a6a57G75Z6L55qE57uE5Lu2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOazqOaEj++8ml9fY29tcHNfX+WSjF9jb21wb25lbnRz55qE57Si5byV5piv5a+55bqU55qEXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIFNlYXJjaGluZyBmb3IgY29tcG9uZW50IHR5cGU6ICR7ZXhwZWN0ZWRDb21wb25lbnRUeXBlfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YXJnZXROb2RlRGF0YS5fX2NvbXBzX18ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSB0YXJnZXROb2RlRGF0YS5fX2NvbXBzX19baV0gYXMgYW55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtDb21wb25lbnRUb29sc10gQ2hlY2tpbmcgY29tcG9uZW50ICR7aX06IHR5cGU9JHtjb21wLnR5cGV9LCB0YXJnZXQ9JHtleHBlY3RlZENvbXBvbmVudFR5cGV9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wLnR5cGUgPT09IGV4cGVjdGVkQ29tcG9uZW50VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldENvbXBvbmVudCA9IGNvbXA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFtDb21wb25lbnRUb29sc10gRm91bmQgbWF0Y2hpbmcgY29tcG9uZW50IGF0IGluZGV4ICR7aX06ICR7Y29tcC50eXBlfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS7jue7hOS7tueahHZhbHVlLnV1aWQudmFsdWXkuK3ojrflj5bnu4Tku7blnKjlnLrmma/kuK3nmoRJRFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wLnZhbHVlICYmIGNvbXAudmFsdWUudXVpZCAmJiBjb21wLnZhbHVlLnV1aWQudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50SWQgPSBjb21wLnZhbHVlLnV1aWQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ29tcG9uZW50VG9vbHNdIEdvdCBjb21wb25lbnRJZCBmcm9tIGNvbXAudmFsdWUudXVpZC52YWx1ZTogJHtjb21wb25lbnRJZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBDb21wb25lbnQgc3RydWN0dXJlOmAsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc1ZhbHVlOiAhIWNvbXAudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNVdWlkOiAhIShjb21wLnZhbHVlICYmIGNvbXAudmFsdWUudXVpZCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNVdWlkVmFsdWU6ICEhKGNvbXAudmFsdWUgJiYgY29tcC52YWx1ZS51dWlkICYmIGNvbXAudmFsdWUudXVpZC52YWx1ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkU3RydWN0dXJlOiBjb21wLnZhbHVlID8gY29tcC52YWx1ZS51dWlkIDogJ05vIHZhbHVlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gZXh0cmFjdCBjb21wb25lbnQgSUQgZnJvbSBjb21wb25lbnQgc3RydWN0dXJlYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldENvbXBvbmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5rKh5om+5Yiw77yM5YiX5Ye65Y+v55So57uE5Lu26K6p55So5oi35LqG6Kej77yM5pi+56S65Zy65pmv5Lit55qE55yf5a6eSURcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZUNvbXBvbmVudHMgPSB0YXJnZXROb2RlRGF0YS5fX2NvbXBzX18ubWFwKChjb21wOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2NlbmVJZCA9ICd1bmtub3duJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDku47nu4Tku7bnmoR2YWx1ZS51dWlkLnZhbHVl6I635Y+W5Zy65pmvSURcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcC52YWx1ZSAmJiBjb21wLnZhbHVlLnV1aWQgJiYgY29tcC52YWx1ZS51dWlkLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjZW5lSWQgPSBjb21wLnZhbHVlLnV1aWQudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtjb21wLnR5cGV9KHNjZW5lX2lkOiR7c2NlbmVJZH0pYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb21wb25lbnQgdHlwZSAnJHtleHBlY3RlZENvbXBvbmVudFR5cGV9JyBub3QgZm91bmQgb24gbm9kZSAke3RhcmdldE5vZGVVdWlkfS4gQXZhaWxhYmxlIGNvbXBvbmVudHM6ICR7YXZhaWxhYmxlQ29tcG9uZW50cy5qb2luKCcsICcpfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBGb3VuZCBjb21wb25lbnQgJHtleHBlY3RlZENvbXBvbmVudFR5cGV9IHdpdGggc2NlbmUgSUQ6ICR7Y29tcG9uZW50SWR9IG9uIG5vZGUgJHt0YXJnZXROb2RlVXVpZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsOacn+acm+WAvOS4uuWunumZheeahOe7hOS7tklE5a+56LGh5qC85byP77yM55So5LqO5ZCO57ut6aqM6K+BXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnRJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsRXhwZWN0ZWRWYWx1ZSA9IHsgdXVpZDogY29tcG9uZW50SWQgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5bCd6K+V5L2/55So5LiO6IqC54K5L+i1hOa6kOW8leeUqOebuOWQjOeahOagvOW8j++8mnt1dWlkOiBjb21wb25lbnRJZH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5rWL6K+V55yL5piv5ZCm6IO95q2j56Gu6K6+572u57uE5Lu25byV55SoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJvcGVydHlQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogeyB1dWlkOiBjb21wb25lbnRJZCB9LCAgLy8g5L2/55So5a+56LGh5qC85byP77yM5YOP6IqC54K5L+i1hOa6kOW8leeUqOS4gOagt1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGV4cGVjdGVkQ29tcG9uZW50VHlwZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0NvbXBvbmVudFRvb2xzXSBFcnJvciBzZXR0aW5nIGNvbXBvbmVudCByZWZlcmVuY2U6YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5VHlwZSA9PT0gJ25vZGVBcnJheScgJiYgQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDnibnmrorlpITnkIboioLngrnmlbDnu4QgLSDkv53mjIHpooTlpITnkIbnmoTmoLzlvI9cclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW0NvbXBvbmVudFRvb2xzXSBTZXR0aW5nIG5vZGUgYXJyYXk6YCwgcHJvY2Vzc2VkVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHByb3BlcnR5UGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9jZXNzZWRWYWx1ZSAgLy8g5L+d5oyBIFt7dXVpZDogXCIuLi5cIn0sIHt1dWlkOiBcIi4uLlwifV0g5qC85byPXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlUeXBlID09PSAnY29sb3JBcnJheScgJiYgQXJyYXkuaXNBcnJheShwcm9jZXNzZWRWYWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDnibnmrorlpITnkIbpopzoibLmlbDnu4RcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvckFycmF5VmFsdWUgPSBwcm9jZXNzZWRWYWx1ZS5tYXAoKGl0ZW06IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiB0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgJ3InIGluIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5yKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZzogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5nKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaXRlbS5iKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYTogaXRlbS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpdGVtLmEpKSkgOiAyNTVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyByOiAyNTUsIGc6IDI1NSwgYjogMjU1LCBhOiAyNTUgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHByb3BlcnR5UGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVtcDogeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjb2xvckFycmF5VmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2MuQ29sb3InXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm9ybWFsIHByb3BlcnR5IHNldHRpbmcgZm9yIG5vbi1hc3NldCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBub2RlVXVpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogcHJvcGVydHlQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdW1wOiB7IHZhbHVlOiBwcm9jZXNzZWRWYWx1ZSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgNTog562J5b6FRWRpdG9y5a6M5oiQ5pu05paw77yM54S25ZCO6aqM6K+B6K6+572u57uT5p6cXHJcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKSk7IC8vIOetieW+hTIwMG1z6K6pRWRpdG9y5a6M5oiQ5pu05pawXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcmlmaWNhdGlvbiA9IGF3YWl0IHRoaXMudmVyaWZ5UHJvcGVydHlDaGFuZ2Uobm9kZVV1aWQsIGNvbXBvbmVudFR5cGUsIHByb3BlcnR5LCBvcmlnaW5hbFZhbHVlLCBhY3R1YWxFeHBlY3RlZFZhbHVlKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgU3VjY2Vzc2Z1bGx5IHNldCAke2NvbXBvbmVudFR5cGV9LiR7cHJvcGVydHl9YCxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsVmFsdWU6IHZlcmlmaWNhdGlvbi5hY3R1YWxWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlVmVyaWZpZWQ6IHZlcmlmaWNhdGlvbi52ZXJpZmllZFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDb21wb25lbnRUb29sc10gRXJyb3Igc2V0dGluZyBwcm9wZXJ0eTpgLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBzZXQgcHJvcGVydHk6ICR7ZXJyb3IubWVzc2FnZX1gXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGF0dGFjaFNjcmlwdChub2RlVXVpZDogc3RyaW5nLCBzY3JpcHRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyDku47ohJrmnKzot6/lvoTmj5Dlj5bnu4Tku7bnsbvlkI1cclxuICAgICAgICAgICAgY29uc3Qgc2NyaXB0TmFtZSA9IHNjcmlwdFBhdGguc3BsaXQoJy8nKS5wb3AoKT8ucmVwbGFjZSgnLnRzJywgJycpLnJlcGxhY2UoJy5qcycsICcnKTtcclxuICAgICAgICAgICAgaWYgKCFzY3JpcHROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnSW52YWxpZCBzY3JpcHQgcGF0aCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8g5YWI5p+l5om+6IqC54K55LiK5piv5ZCm5bey5a2Y5Zyo6K+l6ISa5pys57uE5Lu2XHJcbiAgICAgICAgICAgIGNvbnN0IGFsbENvbXBvbmVudHNJbmZvID0gYXdhaXQgdGhpcy5nZXRDb21wb25lbnRzKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgaWYgKGFsbENvbXBvbmVudHNJbmZvLnN1Y2Nlc3MgJiYgYWxsQ29tcG9uZW50c0luZm8uZGF0YT8uY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdTY3JpcHQgPSBhbGxDb21wb25lbnRzSW5mby5kYXRhLmNvbXBvbmVudHMuZmluZCgoY29tcDogYW55KSA9PiBjb21wLnR5cGUgPT09IHNjcmlwdE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nU2NyaXB0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTY3JpcHQgJyR7c2NyaXB0TmFtZX0nIGFscmVhZHkgZXhpc3RzIG9uIG5vZGVgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlVXVpZDogbm9kZVV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnROYW1lOiBzY3JpcHROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3Rpbmc6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDpppblhYjlsJ3or5Xnm7TmjqXkvb/nlKjohJrmnKzlkI3np7DkvZzkuLrnu4Tku7bnsbvlnotcclxuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLWNvbXBvbmVudCcsIHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiBzY3JpcHROYW1lICAvLyDkvb/nlKjohJrmnKzlkI3np7DogIzpnZ5VVUlEXHJcbiAgICAgICAgICAgIH0pLnRoZW4oYXN5bmMgKHJlc3VsdDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyDnrYnlvoXkuIDmrrXml7bpl7TorqlFZGl0b3LlrozmiJDnu4Tku7bmt7vliqBcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcclxuICAgICAgICAgICAgICAgIC8vIOmHjeaWsOafpeivouiKgueCueS/oeaBr+mqjOivgeiEmuacrOaYr+WQpuecn+eahOa3u+WKoOaIkOWKn1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsQ29tcG9uZW50c0luZm8yID0gYXdhaXQgdGhpcy5nZXRDb21wb25lbnRzKG5vZGVVdWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChhbGxDb21wb25lbnRzSW5mbzIuc3VjY2VzcyAmJiBhbGxDb21wb25lbnRzSW5mbzIuZGF0YT8uY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFkZGVkU2NyaXB0ID0gYWxsQ29tcG9uZW50c0luZm8yLmRhdGEuY29tcG9uZW50cy5maW5kKChjb21wOiBhbnkpID0+IGNvbXAudHlwZSA9PT0gc2NyaXB0TmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkU2NyaXB0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTY3JpcHQgJyR7c2NyaXB0TmFtZX0nIGF0dGFjaGVkIHN1Y2Nlc3NmdWxseWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVV1aWQ6IG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudE5hbWU6IHNjcmlwdE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3Rpbmc6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYFNjcmlwdCAnJHtzY3JpcHROYW1lfScgd2FzIG5vdCBmb3VuZCBvbiBub2RlIGFmdGVyIGFkZGl0aW9uLiBBdmFpbGFibGUgY29tcG9uZW50czogJHthbGxDb21wb25lbnRzSW5mbzIuZGF0YS5jb21wb25lbnRzLm1hcCgoYzogYW55KSA9PiBjLnR5cGUpLmpvaW4oJywgJyl9YFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gdmVyaWZ5IHNjcmlwdCBhZGRpdGlvbjogJHthbGxDb21wb25lbnRzSW5mbzIuZXJyb3IgfHwgJ1VuYWJsZSB0byBnZXQgbm9kZSBjb21wb25lbnRzJ31gXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyDlpIfnlKjmlrnmoYjvvJrkvb/nlKjlnLrmma/ohJrmnKxcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2NvY29zLW1jcC1zZXJ2ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ2F0dGFjaFNjcmlwdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnczogW25vZGVVdWlkLCBzY3JpcHRQYXRoXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2V4ZWN1dGUtc2NlbmUtc2NyaXB0Jywgb3B0aW9ucykudGhlbigocmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRmFpbGVkIHRvIGF0dGFjaCBzY3JpcHQgJyR7c2NyaXB0TmFtZX0nOiAke2Vyci5tZXNzYWdlfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiAnUGxlYXNlIGVuc3VyZSB0aGUgc2NyaXB0IGlzIHByb3Blcmx5IGNvbXBpbGVkIGFuZCBleHBvcnRlZCBhcyBhIENvbXBvbmVudCBjbGFzcy4gWW91IGNhbiBhbHNvIG1hbnVhbGx5IGF0dGFjaCB0aGUgc2NyaXB0IHRocm91Z2ggdGhlIFByb3BlcnRpZXMgcGFuZWwgaW4gdGhlIGVkaXRvci4nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBdmFpbGFibGVDb21wb25lbnRzKGNhdGVnb3J5OiBzdHJpbmcgPSAnYWxsJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50Q2F0ZWdvcmllczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xyXG4gICAgICAgICAgICByZW5kZXJlcjogWydjYy5TcHJpdGUnLCAnY2MuTGFiZWwnLCAnY2MuUmljaFRleHQnLCAnY2MuTWFzaycsICdjYy5HcmFwaGljcyddLFxyXG4gICAgICAgICAgICB1aTogWydjYy5CdXR0b24nLCAnY2MuVG9nZ2xlJywgJ2NjLlNsaWRlcicsICdjYy5TY3JvbGxWaWV3JywgJ2NjLkVkaXRCb3gnLCAnY2MuUHJvZ3Jlc3NCYXInXSxcclxuICAgICAgICAgICAgcGh5c2ljczogWydjYy5SaWdpZEJvZHkyRCcsICdjYy5Cb3hDb2xsaWRlcjJEJywgJ2NjLkNpcmNsZUNvbGxpZGVyMkQnLCAnY2MuUG9seWdvbkNvbGxpZGVyMkQnXSxcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBbJ2NjLkFuaW1hdGlvbicsICdjYy5BbmltYXRpb25DbGlwJywgJ2NjLlNrZWxldGFsQW5pbWF0aW9uJ10sXHJcbiAgICAgICAgICAgIGF1ZGlvOiBbJ2NjLkF1ZGlvU291cmNlJ10sXHJcbiAgICAgICAgICAgIGxheW91dDogWydjYy5MYXlvdXQnLCAnY2MuV2lkZ2V0JywgJ2NjLlBhZ2VWaWV3JywgJ2NjLlBhZ2VWaWV3SW5kaWNhdG9yJ10sXHJcbiAgICAgICAgICAgIGVmZmVjdHM6IFsnY2MuTW90aW9uU3RyZWFrJywgJ2NjLlBhcnRpY2xlU3lzdGVtMkQnXSxcclxuICAgICAgICAgICAgY2FtZXJhOiBbJ2NjLkNhbWVyYSddLFxyXG4gICAgICAgICAgICBsaWdodDogWydjYy5MaWdodCcsICdjYy5EaXJlY3Rpb25hbExpZ2h0JywgJ2NjLlBvaW50TGlnaHQnLCAnY2MuU3BvdExpZ2h0J11cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgY29tcG9uZW50czogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoY2F0ZWdvcnkgPT09ICdhbGwnKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2F0IGluIGNvbXBvbmVudENhdGVnb3JpZXMpIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudHMgPSBjb21wb25lbnRzLmNvbmNhdChjb21wb25lbnRDYXRlZ29yaWVzW2NhdF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnRDYXRlZ29yaWVzW2NhdGVnb3J5XSkge1xyXG4gICAgICAgICAgICBjb21wb25lbnRzID0gY29tcG9uZW50Q2F0ZWdvcmllc1tjYXRlZ29yeV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogY2F0ZWdvcnksXHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzOiBjb21wb25lbnRzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaXNWYWxpZFByb3BlcnR5RGVzY3JpcHRvcihwcm9wRGF0YTogYW55KTogYm9vbGVhbiB7XHJcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5piv5pyJ5pWI55qE5bGe5oCn5o+P6L+w5a+56LGhXHJcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9wRGF0YSAhPT0gJ29iamVjdCcgfHwgcHJvcERhdGEgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcERhdGEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g6YG/5YWN6YGN5Y6G566A5Y2V55qE5pWw5YC85a+56LGh77yI5aaCIHt3aWR0aDogMjAwLCBoZWlnaHQ6IDE1MH3vvIlcclxuICAgICAgICAgICAgY29uc3QgaXNTaW1wbGVWYWx1ZU9iamVjdCA9IGtleXMuZXZlcnkoa2V5ID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcERhdGFba2V5XTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzU2ltcGxlVmFsdWVPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5YyF5ZCr5bGe5oCn5o+P6L+w56ym55qE54m55b6B5a2X5q6177yM5LiN5L2/55SoJ2luJ+aTjeS9nOesplxyXG4gICAgICAgICAgICBjb25zdCBoYXNOYW1lID0ga2V5cy5pbmNsdWRlcygnbmFtZScpO1xyXG4gICAgICAgICAgICBjb25zdCBoYXNWYWx1ZSA9IGtleXMuaW5jbHVkZXMoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhc1R5cGUgPSBrZXlzLmluY2x1ZGVzKCd0eXBlJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhc0Rpc3BsYXlOYW1lID0ga2V5cy5pbmNsdWRlcygnZGlzcGxheU5hbWUnKTtcclxuICAgICAgICAgICAgY29uc3QgaGFzUmVhZG9ubHkgPSBrZXlzLmluY2x1ZGVzKCdyZWFkb25seScpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5b+F6aG75YyF5ZCrbmFtZeaIlnZhbHVl5a2X5q6177yM5LiU6YCa5bi46L+Y5pyJdHlwZeWtl+autVxyXG4gICAgICAgICAgICBjb25zdCBoYXNWYWxpZFN0cnVjdHVyZSA9IChoYXNOYW1lIHx8IGhhc1ZhbHVlKSAmJiAoaGFzVHlwZSB8fCBoYXNEaXNwbGF5TmFtZSB8fCBoYXNSZWFkb25seSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyDpop3lpJbmo4Dmn6XvvJrlpoLmnpzmnIlkZWZhdWx05a2X5q615LiU57uT5p6E5aSN5p2C77yM6YG/5YWN5rex5bqm6YGN5Y6GXHJcbiAgICAgICAgICAgIGlmIChrZXlzLmluY2x1ZGVzKCdkZWZhdWx0JykgJiYgcHJvcERhdGEuZGVmYXVsdCAmJiB0eXBlb2YgcHJvcERhdGEuZGVmYXVsdCA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRLZXlzID0gT2JqZWN0LmtleXMocHJvcERhdGEuZGVmYXVsdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGVmYXVsdEtleXMuaW5jbHVkZXMoJ3ZhbHVlJykgJiYgdHlwZW9mIHByb3BEYXRhLmRlZmF1bHQudmFsdWUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6L+Z56eN5oOF5Ya15LiL77yM5oiR5Lus5Y+q6L+U5Zue6aG25bGC5bGe5oCn77yM5LiN5rex5YWl6YGN5Y6GZGVmYXVsdC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoYXNWYWxpZFN0cnVjdHVyZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGhhc1ZhbGlkU3RydWN0dXJlO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW2lzVmFsaWRQcm9wZXJ0eURlc2NyaXB0b3JdIEVycm9yIGNoZWNraW5nIHByb3BlcnR5IGRlc2NyaXB0b3I6YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYW5hbHl6ZVByb3BlcnR5KGNvbXBvbmVudDogYW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZyk6IHsgZXhpc3RzOiBib29sZWFuOyB0eXBlOiBzdHJpbmc7IGF2YWlsYWJsZVByb3BlcnRpZXM6IHN0cmluZ1tdOyBvcmlnaW5hbFZhbHVlOiBhbnkgfSB7XHJcbiAgICAgICAgLy8g5LuO5aSN5p2C55qE57uE5Lu257uT5p6E5Lit5o+Q5Y+W5Y+v55So5bGe5oCnXHJcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlUHJvcGVydGllczogc3RyaW5nW10gPSBbXTtcclxuICAgICAgICBsZXQgcHJvcGVydHlWYWx1ZTogYW55ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGxldCBwcm9wZXJ0eUV4aXN0cyA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOWwneivleWkmuenjeaWueW8j+afpeaJvuWxnuaAp++8mlxyXG4gICAgICAgIC8vIDEuIOebtOaOpeWxnuaAp+iuv+mXrlxyXG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoY29tcG9uZW50LCBwcm9wZXJ0eU5hbWUpKSB7XHJcbiAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBjb21wb25lbnRbcHJvcGVydHlOYW1lXTtcclxuICAgICAgICAgICAgcHJvcGVydHlFeGlzdHMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyAyLiDku47ltYzlpZfnu5PmnoTkuK3mn6Xmib4gKOWmguS7jua1i+ivleaVsOaNrueci+WIsOeahOWkjeadgue7k+aehClcclxuICAgICAgICBpZiAoIXByb3BlcnR5RXhpc3RzICYmIGNvbXBvbmVudC5wcm9wZXJ0aWVzICYmIHR5cGVvZiBjb21wb25lbnQucHJvcGVydGllcyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgLy8g6aaW5YWI5qOA5p+lcHJvcGVydGllcy52YWx1ZeaYr+WQpuWtmOWcqO+8iOi/meaYr+aIkeS7rOWcqGdldENvbXBvbmVudHPkuK3nnIvliLDnmoTnu5PmnoTvvIlcclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5wcm9wZXJ0aWVzLnZhbHVlICYmIHR5cGVvZiBjb21wb25lbnQucHJvcGVydGllcy52YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlT2JqID0gY29tcG9uZW50LnByb3BlcnRpZXMudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHByb3BEYXRhXSBvZiBPYmplY3QuZW50cmllcyh2YWx1ZU9iaikpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6Vwcm9wRGF0YeaYr+WQpuaYr+S4gOS4quacieaViOeahOWxnuaAp+aPj+i/sOWvueixoVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIOehruS/nXByb3BEYXRh5piv5a+56LGh5LiU5YyF5ZCr6aKE5pyf55qE5bGe5oCn57uT5p6EXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNWYWxpZFByb3BlcnR5RGVzY3JpcHRvcihwcm9wRGF0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcEluZm8gPSBwcm9wRGF0YSBhcyBhbnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVByb3BlcnRpZXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS8mOWFiOS9v+eUqHZhbHVl5bGe5oCn77yM5aaC5p6c5rKh5pyJ5YiZ5L2/55SocHJvcERhdGHmnKzouqtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcEtleXMgPSBPYmplY3Qua2V5cyhwcm9wSW5mbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IHByb3BLZXlzLmluY2x1ZGVzKCd2YWx1ZScpID8gcHJvcEluZm8udmFsdWUgOiBwcm9wSW5mbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5qOA5p+l5aSx6LSl77yM55u05o6l5L2/55SocHJvcEluZm9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gcHJvcEluZm87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUV4aXN0cyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyDlpIfnlKjmlrnmoYjvvJrnm7TmjqXku45wcm9wZXJ0aWVz5p+l5om+XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHByb3BEYXRhXSBvZiBPYmplY3QuZW50cmllcyhjb21wb25lbnQucHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1ZhbGlkUHJvcGVydHlEZXNjcmlwdG9yKHByb3BEYXRhKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wSW5mbyA9IHByb3BEYXRhIGFzIGFueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlUHJvcGVydGllcy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LyY5YWI5L2/55SodmFsdWXlsZ7mgKfvvIzlpoLmnpzmsqHmnInliJnkvb/nlKhwcm9wRGF0YeacrOi6q1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wS2V5cyA9IE9iamVjdC5rZXlzKHByb3BJbmZvKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gcHJvcEtleXMuaW5jbHVkZXMoJ3ZhbHVlJykgPyBwcm9wSW5mby52YWx1ZSA6IHByb3BJbmZvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmo4Dmn6XlpLHotKXvvIznm7TmjqXkvb/nlKhwcm9wSW5mb1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBwcm9wSW5mbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyAzLiDku47nm7TmjqXlsZ7mgKfkuK3mj5Dlj5bnroDljZXlsZ7mgKflkI1cclxuICAgICAgICBpZiAoYXZhaWxhYmxlUHJvcGVydGllcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoY29tcG9uZW50KSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFrZXkuc3RhcnRzV2l0aCgnXycpICYmICFbJ19fdHlwZV9fJywgJ2NpZCcsICdub2RlJywgJ3V1aWQnLCAnbmFtZScsICdlbmFibGVkJywgJ3R5cGUnLCAncmVhZG9ubHknLCAndmlzaWJsZSddLmluY2x1ZGVzKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVQcm9wZXJ0aWVzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIXByb3BlcnR5RXhpc3RzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBleGlzdHM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Vua25vd24nLFxyXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlUHJvcGVydGllcyxcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsVmFsdWU6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgdHlwZSA9ICd1bmtub3duJztcclxuICAgICAgICBcclxuICAgICAgICAvLyDmmbrog73nsbvlnovmo4DmtYtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9wZXJ0eVZhbHVlKSkge1xyXG4gICAgICAgICAgICAvLyDmlbDnu4Tnsbvlnovmo4DmtYtcclxuICAgICAgICAgICAgaWYgKHByb3BlcnR5TmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdub2RlJykpIHtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSAnbm9kZUFycmF5JztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eU5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY29sb3InKSkge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdjb2xvckFycmF5JztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSAnYXJyYXknO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvcGVydHlWYWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcHJvcGVydHkgbmFtZSBzdWdnZXN0cyBpdCdzIGFuIGFzc2V0XHJcbiAgICAgICAgICAgIGlmIChbJ3Nwcml0ZUZyYW1lJywgJ3RleHR1cmUnLCAnbWF0ZXJpYWwnLCAnZm9udCcsICdjbGlwJywgJ3ByZWZhYiddLmluY2x1ZGVzKHByb3BlcnR5TmFtZS50b0xvd2VyQ2FzZSgpKSkge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdhc3NldCc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gJ3N0cmluZyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9wZXJ0eVZhbHVlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0eXBlID0gJ251bWJlcic7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvcGVydHlWYWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSAnYm9vbGVhbic7XHJcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVZhbHVlICYmIHR5cGVvZiBwcm9wZXJ0eVZhbHVlID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnR5VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGtleXMuaW5jbHVkZXMoJ3InKSAmJiBrZXlzLmluY2x1ZGVzKCdnJykgJiYga2V5cy5pbmNsdWRlcygnYicpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdjb2xvcic7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleXMuaW5jbHVkZXMoJ3gnKSAmJiBrZXlzLmluY2x1ZGVzKCd5JykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gcHJvcGVydHlWYWx1ZS56ICE9PSB1bmRlZmluZWQgPyAndmVjMycgOiAndmVjMic7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleXMuaW5jbHVkZXMoJ3dpZHRoJykgJiYga2V5cy5pbmNsdWRlcygnaGVpZ2h0JykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gJ3NpemUnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChrZXlzLmluY2x1ZGVzKCd1dWlkJykgfHwga2V5cy5pbmNsdWRlcygnX191dWlkX18nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaYr+iKgueCueW8leeUqO+8iOmAmui/h+WxnuaAp+WQjeaIll9faWRfX+WxnuaAp+WIpOaWre+8iVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnbm9kZScpIHx8IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndGFyZ2V0JykgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5cy5pbmNsdWRlcygnX19pZF9fJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdub2RlJztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gJ2Fzc2V0JztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleXMuaW5jbHVkZXMoJ19faWRfXycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6IqC54K55byV55So54m55b6BXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdub2RlJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdvYmplY3QnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBbYW5hbHl6ZVByb3BlcnR5XSBFcnJvciBjaGVja2luZyBwcm9wZXJ0eSB0eXBlIGZvcjogJHtKU09OLnN0cmluZ2lmeShwcm9wZXJ0eVZhbHVlKX1gKTtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSAnb2JqZWN0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlWYWx1ZSA9PT0gbnVsbCB8fCBwcm9wZXJ0eVZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gRm9yIG51bGwvdW5kZWZpbmVkIHZhbHVlcywgY2hlY2sgcHJvcGVydHkgbmFtZSB0byBkZXRlcm1pbmUgdHlwZVxyXG4gICAgICAgICAgICBpZiAoWydzcHJpdGVGcmFtZScsICd0ZXh0dXJlJywgJ21hdGVyaWFsJywgJ2ZvbnQnLCAnY2xpcCcsICdwcmVmYWInXS5pbmNsdWRlcyhwcm9wZXJ0eU5hbWUudG9Mb3dlckNhc2UoKSkpIHtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSAnYXNzZXQnO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5TmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdub2RlJykgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygndGFyZ2V0JykpIHtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSAnbm9kZSc7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlOYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ2NvbXBvbmVudCcpKSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gJ2NvbXBvbmVudCc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gJ3Vua25vd24nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGV4aXN0czogdHJ1ZSxcclxuICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgYXZhaWxhYmxlUHJvcGVydGllcyxcclxuICAgICAgICAgICAgb3JpZ2luYWxWYWx1ZTogcHJvcGVydHlWYWx1ZVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzbWFydENvbnZlcnRWYWx1ZShpbnB1dFZhbHVlOiBhbnksIHByb3BlcnR5SW5mbzogYW55KTogYW55IHtcclxuICAgICAgICBjb25zdCB7IHR5cGUsIG9yaWdpbmFsVmFsdWUgfSA9IHByb3BlcnR5SW5mbztcclxuICAgICAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyhgW3NtYXJ0Q29udmVydFZhbHVlXSBDb252ZXJ0aW5nICR7SlNPTi5zdHJpbmdpZnkoaW5wdXRWYWx1ZSl9IHRvIHR5cGU6ICR7dHlwZX1gKTtcclxuICAgICAgICBcclxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoaW5wdXRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoaW5wdXRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0VmFsdWUgPT09ICdib29sZWFuJykgcmV0dXJuIGlucHV0VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0VmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0VmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gJ3RydWUnIHx8IGlucHV0VmFsdWUgPT09ICcxJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBCb29sZWFuKGlucHV0VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNhc2UgJ2NvbG9yJzpcclxuICAgICAgICAgICAgICAgIC8vIOS8mOWMlueahOminOiJsuWkhOeQhu+8jOaUr+aMgeWkmuenjei+k+WFpeagvOW8j1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWtl+espuS4suagvOW8j++8muWNgeWFrei/m+WItuOAgeminOiJsuWQjeensOOAgXJnYigpL3JnYmEoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ29sb3JTdHJpbmcoaW5wdXRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnb2JqZWN0JyAmJiBpbnB1dFZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5wdXRLZXlzID0gT2JqZWN0LmtleXMoaW5wdXRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOi+k+WFpeaYr+minOiJsuWvueixoe+8jOmqjOivgeW5tui9rOaNolxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXRLZXlzLmluY2x1ZGVzKCdyJykgfHwgaW5wdXRLZXlzLmluY2x1ZGVzKCdnJykgfHwgaW5wdXRLZXlzLmluY2x1ZGVzKCdiJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaW5wdXRWYWx1ZS5yKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZzogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaW5wdXRWYWx1ZS5nKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYjogTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaW5wdXRWYWx1ZS5iKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYTogaW5wdXRWYWx1ZS5hICE9PSB1bmRlZmluZWQgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpbnB1dFZhbHVlLmEpKSkgOiAyNTVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzbWFydENvbnZlcnRWYWx1ZV0gSW52YWxpZCBjb2xvciBvYmplY3Q6ICR7SlNPTi5zdHJpbmdpZnkoaW5wdXRWYWx1ZSl9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5Y6f5YC877yM5L+d5oyB5Y6f5YC857uT5p6E5bm25pu05paw5o+Q5L6b55qE5YC8XHJcbiAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxWYWx1ZSAmJiB0eXBlb2Ygb3JpZ2luYWxWYWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnB1dEtleXMgPSB0eXBlb2YgaW5wdXRWYWx1ZSA9PT0gJ29iamVjdCcgJiYgaW5wdXRWYWx1ZSA/IE9iamVjdC5rZXlzKGlucHV0VmFsdWUpIDogW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByOiBpbnB1dEtleXMuaW5jbHVkZXMoJ3InKSA/IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGlucHV0VmFsdWUucikpKSA6IChvcmlnaW5hbFZhbHVlLnIgfHwgMjU1KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGc6IGlucHV0S2V5cy5pbmNsdWRlcygnZycpID8gTWF0aC5taW4oMjU1LCBNYXRoLm1heCgwLCBOdW1iZXIoaW5wdXRWYWx1ZS5nKSkpIDogKG9yaWdpbmFsVmFsdWUuZyB8fCAyNTUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYjogaW5wdXRLZXlzLmluY2x1ZGVzKCdiJykgPyBNYXRoLm1pbigyNTUsIE1hdGgubWF4KDAsIE51bWJlcihpbnB1dFZhbHVlLmIpKSkgOiAob3JpZ2luYWxWYWx1ZS5iIHx8IDI1NSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhOiBpbnB1dEtleXMuaW5jbHVkZXMoJ2EnKSA/IE1hdGgubWluKDI1NSwgTWF0aC5tYXgoMCwgTnVtYmVyKGlucHV0VmFsdWUuYSkpKSA6IChvcmlnaW5hbFZhbHVlLmEgfHwgMjU1KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgW3NtYXJ0Q29udmVydFZhbHVlXSBFcnJvciBwcm9jZXNzaW5nIGNvbG9yIHdpdGggb3JpZ2luYWwgdmFsdWU6ICR7ZXJyb3J9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8g6buY6K6k6L+U5Zue55m96ImyXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtzbWFydENvbnZlcnRWYWx1ZV0gVXNpbmcgZGVmYXVsdCB3aGl0ZSBjb2xvciBmb3IgaW52YWxpZCBpbnB1dDogJHtKU09OLnN0cmluZ2lmeShpbnB1dFZhbHVlKX1gKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHI6IDI1NSwgZzogMjU1LCBiOiAyNTUsIGE6IDI1NSB9O1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZlYzInOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnb2JqZWN0JyAmJiBpbnB1dFZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeDogTnVtYmVyKGlucHV0VmFsdWUueCkgfHwgb3JpZ2luYWxWYWx1ZS54IHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IE51bWJlcihpbnB1dFZhbHVlLnkpIHx8IG9yaWdpbmFsVmFsdWUueSB8fCAwXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZlYzMnOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnb2JqZWN0JyAmJiBpbnB1dFZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeDogTnVtYmVyKGlucHV0VmFsdWUueCkgfHwgb3JpZ2luYWxWYWx1ZS54IHx8IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IE51bWJlcihpbnB1dFZhbHVlLnkpIHx8IG9yaWdpbmFsVmFsdWUueSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiBOdW1iZXIoaW5wdXRWYWx1ZS56KSB8fCBvcmlnaW5hbFZhbHVlLnogfHwgMFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxWYWx1ZTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXRWYWx1ZSA9PT0gJ29iamVjdCcgJiYgaW5wdXRWYWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBOdW1iZXIoaW5wdXRWYWx1ZS53aWR0aCkgfHwgb3JpZ2luYWxWYWx1ZS53aWR0aCB8fCAxMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogTnVtYmVyKGlucHV0VmFsdWUuaGVpZ2h0KSB8fCBvcmlnaW5hbFZhbHVlLmhlaWdodCB8fCAxMDBcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSAnbm9kZSc6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0VmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g6IqC54K55byV55So6ZyA6KaB54m55q6K5aSE55CGXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnb2JqZWN0JyAmJiBpbnB1dFZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5bey57uP5piv5a+56LGh5b2i5byP77yM6L+U5ZueVVVJROaIluWujOaVtOWvueixoVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnB1dFZhbHVlLnV1aWQgfHwgaW5wdXRWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNhc2UgJ2Fzc2V0JzpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXRWYWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzovpPlhaXmmK/lrZfnrKbkuLLot6/lvoTvvIzovazmjaLkuLphc3NldOWvueixoVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHV1aWQ6IGlucHV0VmFsdWUgfTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0VmFsdWUgPT09ICdvYmplY3QnICYmIGlucHV0VmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAvLyDlr7nkuo7mnKrnn6XnsbvlnovvvIzlsL3ph4/kv53mjIHljp/mnInnu5PmnoRcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaW5wdXRWYWx1ZSA9PT0gdHlwZW9mIG9yaWdpbmFsVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5wdXRWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBwYXJzZUNvbG9yU3RyaW5nKGNvbG9yU3RyOiBzdHJpbmcpOiB7IHI6IG51bWJlcjsgZzogbnVtYmVyOyBiOiBudW1iZXI7IGE6IG51bWJlciB9IHtcclxuICAgICAgICBjb25zdCBzdHIgPSBjb2xvclN0ci50cmltKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5Y+q5pSv5oyB5Y2B5YWt6L+b5Yi25qC85byPICNSUkdHQkIg5oiWICNSUkdHQkJBQVxyXG4gICAgICAgIGlmIChzdHIuc3RhcnRzV2l0aCgnIycpKSB7XHJcbiAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoID09PSA3KSB7IC8vICNSUkdHQkJcclxuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBwYXJzZUludChzdHIuc3Vic3RyaW5nKDEsIDMpLCAxNik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gcGFyc2VJbnQoc3RyLnN1YnN0cmluZygzLCA1KSwgMTYpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYiA9IHBhcnNlSW50KHN0ci5zdWJzdHJpbmcoNSwgNyksIDE2KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHIsIGcsIGIsIGE6IDI1NSB9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0ci5sZW5ndGggPT09IDkpIHsgLy8gI1JSR0dCQkFBXHJcbiAgICAgICAgICAgICAgICBjb25zdCByID0gcGFyc2VJbnQoc3RyLnN1YnN0cmluZygxLCAzKSwgMTYpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IHBhcnNlSW50KHN0ci5zdWJzdHJpbmcoMywgNSksIDE2KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBwYXJzZUludChzdHIuc3Vic3RyaW5nKDUsIDcpLCAxNik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhID0gcGFyc2VJbnQoc3RyLnN1YnN0cmluZyg3LCA5KSwgMTYpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgciwgZywgYiwgYSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOWmguaenOS4jeaYr+acieaViOeahOWNgeWFrei/m+WItuagvOW8j++8jOi/lOWbnumUmeivr+aPkOekulxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjb2xvciBmb3JtYXQ6IFwiJHtjb2xvclN0cn1cIi4gT25seSBoZXhhZGVjaW1hbCBmb3JtYXQgaXMgc3VwcG9ydGVkIChlLmcuLCBcIiNGRjAwMDBcIiBvciBcIiNGRjAwMDBGRlwiKWApO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgdmVyaWZ5UHJvcGVydHlDaGFuZ2Uobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCBvcmlnaW5hbFZhbHVlOiBhbnksIGV4cGVjdGVkVmFsdWU6IGFueSk6IFByb21pc2U8eyB2ZXJpZmllZDogYm9vbGVhbjsgYWN0dWFsVmFsdWU6IGFueTsgZnVsbERhdGE6IGFueSB9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gU3RhcnRpbmcgdmVyaWZpY2F0aW9uIGZvciAke2NvbXBvbmVudFR5cGV9LiR7cHJvcGVydHl9YCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gRXhwZWN0ZWQgdmFsdWU6YCwgSlNPTi5zdHJpbmdpZnkoZXhwZWN0ZWRWYWx1ZSkpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbdmVyaWZ5UHJvcGVydHlDaGFuZ2VdIE9yaWdpbmFsIHZhbHVlOmAsIEpTT04uc3RyaW5naWZ5KG9yaWdpbmFsVmFsdWUpKTtcclxuICAgICAgICBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyDph43mlrDojrflj5bnu4Tku7bkv6Hmga/ov5vooYzpqozor4FcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gQ2FsbGluZyBnZXRDb21wb25lbnRJbmZvLi4uYCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudEluZm8gPSBhd2FpdCB0aGlzLmdldENvbXBvbmVudEluZm8obm9kZVV1aWQsIGNvbXBvbmVudFR5cGUpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBnZXRDb21wb25lbnRJbmZvIHN1Y2Nlc3M6YCwgY29tcG9uZW50SW5mby5zdWNjZXNzKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGFsbENvbXBvbmVudHMgPSBhd2FpdCB0aGlzLmdldENvbXBvbmVudHMobm9kZVV1aWQpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBnZXRDb21wb25lbnRzIHN1Y2Nlc3M6YCwgYWxsQ29tcG9uZW50cy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnRJbmZvLnN1Y2Nlc3MgJiYgY29tcG9uZW50SW5mby5kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBDb21wb25lbnQgZGF0YSBhdmFpbGFibGUsIGV4dHJhY3RpbmcgcHJvcGVydHkgJyR7cHJvcGVydHl9J2ApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxsUHJvcGVydHlOYW1lcyA9IE9iamVjdC5rZXlzKGNvbXBvbmVudEluZm8uZGF0YS5wcm9wZXJ0aWVzIHx8IHt9KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdmVyaWZ5UHJvcGVydHlDaGFuZ2VdIEF2YWlsYWJsZSBwcm9wZXJ0aWVzOmAsIGFsbFByb3BlcnR5TmFtZXMpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHlEYXRhID0gY29tcG9uZW50SW5mby5kYXRhLnByb3BlcnRpZXM/Lltwcm9wZXJ0eV07XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBSYXcgcHJvcGVydHkgZGF0YSBmb3IgJyR7cHJvcGVydHl9JzpgLCBKU09OLnN0cmluZ2lmeShwcm9wZXJ0eURhdGEpKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8g5LuO5bGe5oCn5pWw5o2u5Lit5o+Q5Y+W5a6e6ZmF5YC8XHJcbiAgICAgICAgICAgICAgICBsZXQgYWN0dWFsVmFsdWUgPSBwcm9wZXJ0eURhdGE7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBJbml0aWFsIGFjdHVhbFZhbHVlOmAsIEpTT04uc3RyaW5naWZ5KGFjdHVhbFZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eURhdGEgJiYgdHlwZW9mIHByb3BlcnR5RGF0YSA9PT0gJ29iamVjdCcgJiYgJ3ZhbHVlJyBpbiBwcm9wZXJ0eURhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxWYWx1ZSA9IHByb3BlcnR5RGF0YS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBFeHRyYWN0ZWQgYWN0dWFsVmFsdWUgZnJvbSAudmFsdWU6YCwgSlNPTi5zdHJpbmdpZnkoYWN0dWFsVmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gTm8gLnZhbHVlIHByb3BlcnR5IGZvdW5kLCB1c2luZyByYXcgZGF0YWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyDkv67lpI3pqozor4HpgLvovpHvvJrmo4Dmn6Xlrp7pmYXlgLzmmK/lkKbljLnphY3mnJ/mnJvlgLxcclxuICAgICAgICAgICAgICAgIGxldCB2ZXJpZmllZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGVkVmFsdWUgPT09ICdvYmplY3QnICYmIGV4cGVjdGVkVmFsdWUgIT09IG51bGwgJiYgJ3V1aWQnIGluIGV4cGVjdGVkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlr7nkuo7lvJXnlKjnsbvlnovvvIjoioLngrkv57uE5Lu2L+i1hOa6kO+8ie+8jOavlOi+g1VVSURcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3R1YWxVdWlkID0gYWN0dWFsVmFsdWUgJiYgdHlwZW9mIGFjdHVhbFZhbHVlID09PSAnb2JqZWN0JyAmJiAndXVpZCcgaW4gYWN0dWFsVmFsdWUgPyBhY3R1YWxWYWx1ZS51dWlkIDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWRVdWlkID0gZXhwZWN0ZWRWYWx1ZS51dWlkIHx8ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIHZlcmlmaWVkID0gYWN0dWFsVXVpZCA9PT0gZXhwZWN0ZWRVdWlkICYmIGV4cGVjdGVkVXVpZCAhPT0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gUmVmZXJlbmNlIGNvbXBhcmlzb246YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgLSBFeHBlY3RlZCBVVUlEOiBcIiR7ZXhwZWN0ZWRVdWlkfVwiYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgLSBBY3R1YWwgVVVJRDogXCIke2FjdHVhbFV1aWR9XCJgKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAtIFVVSUQgbWF0Y2g6ICR7YWN0dWFsVXVpZCA9PT0gZXhwZWN0ZWRVdWlkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIC0gVVVJRCBub3QgZW1wdHk6ICR7ZXhwZWN0ZWRVdWlkICE9PSAnJ31gKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAtIEZpbmFsIHZlcmlmaWVkOiAke3ZlcmlmaWVkfWApO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyDlr7nkuo7lhbbku5bnsbvlnovvvIznm7TmjqXmr5TovoPlgLxcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBWYWx1ZSBjb21wYXJpc29uOmApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIC0gRXhwZWN0ZWQgdHlwZTogJHt0eXBlb2YgZXhwZWN0ZWRWYWx1ZX1gKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAtIEFjdHVhbCB0eXBlOiAke3R5cGVvZiBhY3R1YWxWYWx1ZX1gKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFjdHVhbFZhbHVlID09PSB0eXBlb2YgZXhwZWN0ZWRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFjdHVhbFZhbHVlID09PSAnb2JqZWN0JyAmJiBhY3R1YWxWYWx1ZSAhPT0gbnVsbCAmJiBleHBlY3RlZFZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlr7nosaHnsbvlnovnmoTmt7Hluqbmr5TovoNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWVkID0gSlNPTi5zdHJpbmdpZnkoYWN0dWFsVmFsdWUpID09PSBKU09OLnN0cmluZ2lmeShleHBlY3RlZFZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIC0gT2JqZWN0IGNvbXBhcmlzb24gKEpTT04pOiAke3ZlcmlmaWVkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Z+65pys57G75Z6L55qE55u05o6l5q+U6L6DXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJpZmllZCA9IGFjdHVhbFZhbHVlID09PSBleHBlY3RlZFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgLSBEaXJlY3QgY29tcGFyaXNvbjogJHt2ZXJpZmllZH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOexu+Wei+S4jeWMuemFjeaXtueahOeJueauiuWkhOeQhu+8iOWmguaVsOWtl+WSjOWtl+espuS4su+8iVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHJpbmdNYXRjaCA9IFN0cmluZyhhY3R1YWxWYWx1ZSkgPT09IFN0cmluZyhleHBlY3RlZFZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbnVtYmVyTWF0Y2ggPSBOdW1iZXIoYWN0dWFsVmFsdWUpID09PSBOdW1iZXIoZXhwZWN0ZWRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmlmaWVkID0gc3RyaW5nTWF0Y2ggfHwgbnVtYmVyTWF0Y2g7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIC0gU3RyaW5nIG1hdGNoOiAke3N0cmluZ01hdGNofWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAtIE51bWJlciBtYXRjaDogJHtudW1iZXJNYXRjaH1gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgLSBUeXBlIG1pc21hdGNoIHZlcmlmaWVkOiAke3ZlcmlmaWVkfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gRmluYWwgdmVyaWZpY2F0aW9uIHJlc3VsdDogJHt2ZXJpZmllZH1gKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdmVyaWZ5UHJvcGVydHlDaGFuZ2VdIEZpbmFsIGFjdHVhbFZhbHVlOmAsIEpTT04uc3RyaW5naWZ5KGFjdHVhbFZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB2ZXJpZmllZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBmdWxsRGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlj6rov5Tlm57kv67mlLnnmoTlsZ7mgKfkv6Hmga/vvIzkuI3ov5Tlm57lrozmlbTnu4Tku7bmlbDmja5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZWRQcm9wZXJ0eToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvcGVydHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZWZvcmU6IG9yaWdpbmFsVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJpZmllZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TWV0YWRhdGE6IHByb3BlcnR5RGF0YSAvLyDlj6rljIXlkKvov5nkuKrlsZ7mgKfnmoTlhYPmlbDmja5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g566A5YyW55qE57uE5Lu25L+h5oGvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudFN1bW1hcnk6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVVdWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUHJvcGVydGllczogT2JqZWN0LmtleXMoY29tcG9uZW50SW5mby5kYXRhPy5wcm9wZXJ0aWVzIHx8IHt9KS5sZW5ndGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbdmVyaWZ5UHJvcGVydHlDaGFuZ2VdIFJldHVybmluZyByZXN1bHQ6YCwgSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAyKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gQ29tcG9uZW50SW5mbyBmYWlsZWQgb3Igbm8gZGF0YTpgLCBjb21wb25lbnRJbmZvKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1t2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gVmVyaWZpY2F0aW9uIGZhaWxlZCB3aXRoIGVycm9yOicsIGVycm9yKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3ZlcmlmeVByb3BlcnR5Q2hhbmdlXSBFcnJvciBzdGFjazonLCBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiAnTm8gc3RhY2sgdHJhY2UnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc29sZS5sb2coYFt2ZXJpZnlQcm9wZXJ0eUNoYW5nZV0gUmV0dXJuaW5nIGZhbGxiYWNrIHJlc3VsdGApO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHZlcmlmaWVkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWN0dWFsVmFsdWU6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZnVsbERhdGE6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5qOA5rWL5piv5ZCm5Li66IqC54K55bGe5oCn77yM5aaC5p6c5piv5YiZ6YeN5a6a5ZCR5Yiw5a+55bqU55qE6IqC54K55pa55rOVXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgYXN5bmMgY2hlY2tBbmRSZWRpcmVjdE5vZGVQcm9wZXJ0aWVzKGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlIHwgbnVsbD4ge1xyXG4gICAgICAgIGNvbnN0IHsgbm9kZVV1aWQsIGNvbXBvbmVudFR5cGUsIHByb3BlcnR5LCBwcm9wZXJ0eVR5cGUsIHZhbHVlIH0gPSBhcmdzO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIOajgOa1i+aYr+WQpuS4uuiKgueCueWfuuehgOWxnuaAp++8iOW6lOivpeS9v+eUqCBzZXRfbm9kZV9wcm9wZXJ0ee+8iVxyXG4gICAgICAgIGNvbnN0IG5vZGVCYXNpY1Byb3BlcnRpZXMgPSBbXHJcbiAgICAgICAgICAgICduYW1lJywgJ2FjdGl2ZScsICdsYXllcicsICdtb2JpbGl0eScsICdwYXJlbnQnLCAnY2hpbGRyZW4nLCAnaGlkZUZsYWdzJ1xyXG4gICAgICAgIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8g5qOA5rWL5piv5ZCm5Li66IqC54K55Y+Y5o2i5bGe5oCn77yI5bqU6K+l5L2/55SoIHNldF9ub2RlX3RyYW5zZm9ybe+8iVxyXG4gICAgICAgIGNvbnN0IG5vZGVUcmFuc2Zvcm1Qcm9wZXJ0aWVzID0gW1xyXG4gICAgICAgICAgICAncG9zaXRpb24nLCAncm90YXRpb24nLCAnc2NhbGUnLCAnZXVsZXJBbmdsZXMnLCAnYW5nbGUnXHJcbiAgICAgICAgXTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBEZXRlY3QgYXR0ZW1wdHMgdG8gc2V0IGNjLk5vZGUgcHJvcGVydGllcyAoY29tbW9uIG1pc3Rha2UpXHJcbiAgICAgICAgaWYgKGNvbXBvbmVudFR5cGUgPT09ICdjYy5Ob2RlJyB8fCBjb21wb25lbnRUeXBlID09PSAnTm9kZScpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVCYXNpY1Byb3BlcnRpZXMuaW5jbHVkZXMocHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogYFByb3BlcnR5ICcke3Byb3BlcnR5fScgaXMgYSBub2RlIGJhc2ljIHByb3BlcnR5LCBub3QgYSBjb21wb25lbnQgcHJvcGVydHlgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246IGBQbGVhc2UgdXNlIHNldF9ub2RlX3Byb3BlcnR5IG1ldGhvZCB0byBzZXQgbm9kZSBwcm9wZXJ0aWVzOiBzZXRfbm9kZV9wcm9wZXJ0eSh1dWlkPVwiJHtub2RlVXVpZH1cIiwgcHJvcGVydHk9XCIke3Byb3BlcnR5fVwiLCB2YWx1ZT0ke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYFxyXG4gICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZVRyYW5zZm9ybVByb3BlcnRpZXMuaW5jbHVkZXMocHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyBpcyBhIG5vZGUgdHJhbnNmb3JtIHByb3BlcnR5LCBub3QgYSBjb21wb25lbnQgcHJvcGVydHlgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgaW5zdHJ1Y3Rpb246IGBQbGVhc2UgdXNlIHNldF9ub2RlX3RyYW5zZm9ybSBtZXRob2QgdG8gc2V0IHRyYW5zZm9ybSBwcm9wZXJ0aWVzOiBzZXRfbm9kZV90cmFuc2Zvcm0odXVpZD1cIiR7bm9kZVV1aWR9XCIsICR7cHJvcGVydHl9PSR7SlNPTi5zdHJpbmdpZnkodmFsdWUpfSlgXHJcbiAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBEZXRlY3QgY29tbW9uIGluY29ycmVjdCB1c2FnZVxyXG4gICAgICAgICAgaWYgKG5vZGVCYXNpY1Byb3BlcnRpZXMuaW5jbHVkZXMocHJvcGVydHkpIHx8IG5vZGVUcmFuc2Zvcm1Qcm9wZXJ0aWVzLmluY2x1ZGVzKHByb3BlcnR5KSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSBub2RlVHJhbnNmb3JtUHJvcGVydGllcy5pbmNsdWRlcyhwcm9wZXJ0eSkgPyAnc2V0X25vZGVfdHJhbnNmb3JtJyA6ICdzZXRfbm9kZV9wcm9wZXJ0eSc7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgIGVycm9yOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyBpcyBhIG5vZGUgcHJvcGVydHksIG5vdCBhIGNvbXBvbmVudCBwcm9wZXJ0eWAsXHJcbiAgICAgICAgICAgICAgICAgIGluc3RydWN0aW9uOiBgUHJvcGVydHkgJyR7cHJvcGVydHl9JyBzaG91bGQgYmUgc2V0IHVzaW5nICR7bWV0aG9kTmFtZX0gbWV0aG9kLCBub3Qgc2V0X2NvbXBvbmVudF9wcm9wZXJ0eS4gUGxlYXNlIHVzZTogJHttZXRob2ROYW1lfSh1dWlkPVwiJHtub2RlVXVpZH1cIiwgJHtub2RlVHJhbnNmb3JtUHJvcGVydGllcy5pbmNsdWRlcyhwcm9wZXJ0eSkgPyBwcm9wZXJ0eSA6IGBwcm9wZXJ0eT1cIiR7cHJvcGVydHl9XCJgfT0ke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0pYFxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJldHVybiBudWxsOyAvLyDkuI3mmK/oioLngrnlsZ7mgKfvvIznu6fnu63mraPluLjlpITnkIZcclxuICAgICAgfVxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIOeUn+aIkOe7hOS7tuW7uuiuruS/oeaBr1xyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBnZW5lcmF0ZUNvbXBvbmVudFN1Z2dlc3Rpb24ocmVxdWVzdGVkVHlwZTogc3RyaW5nLCBhdmFpbGFibGVUeXBlczogc3RyaW5nW10sIHByb3BlcnR5OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5a2Y5Zyo55u45Ly855qE57uE5Lu257G75Z6LXHJcbiAgICAgICAgICBjb25zdCBzaW1pbGFyVHlwZXMgPSBhdmFpbGFibGVUeXBlcy5maWx0ZXIodHlwZSA9PiBcclxuICAgICAgICAgICAgICB0eXBlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocmVxdWVzdGVkVHlwZS50b0xvd2VyQ2FzZSgpKSB8fCBcclxuICAgICAgICAgICAgICByZXF1ZXN0ZWRUeXBlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModHlwZS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgbGV0IGluc3RydWN0aW9uID0gJyc7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChzaW1pbGFyVHlwZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIGluc3RydWN0aW9uICs9IGBcXG5cXG7wn5SNIEZvdW5kIHNpbWlsYXIgY29tcG9uZW50czogJHtzaW1pbGFyVHlwZXMuam9pbignLCAnKX1gO1xyXG4gICAgICAgICAgICAgIGluc3RydWN0aW9uICs9IGBcXG7wn5KhIFN1Z2dlc3Rpb246IFBlcmhhcHMgeW91IG1lYW50IHRvIHNldCB0aGUgJyR7c2ltaWxhclR5cGVzWzBdfScgY29tcG9uZW50P2A7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFJlY29tbWVuZCBwb3NzaWJsZSBjb21wb25lbnRzIGJhc2VkIG9uIHByb3BlcnR5IG5hbWVcclxuICAgICAgICAgIGNvbnN0IHByb3BlcnR5VG9Db21wb25lbnRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHtcclxuICAgICAgICAgICAgICAnc3RyaW5nJzogWydjYy5MYWJlbCcsICdjYy5SaWNoVGV4dCcsICdjYy5FZGl0Qm94J10sXHJcbiAgICAgICAgICAgICAgJ3RleHQnOiBbJ2NjLkxhYmVsJywgJ2NjLlJpY2hUZXh0J10sXHJcbiAgICAgICAgICAgICAgJ2ZvbnRTaXplJzogWydjYy5MYWJlbCcsICdjYy5SaWNoVGV4dCddLFxyXG4gICAgICAgICAgICAgICdzcHJpdGVGcmFtZSc6IFsnY2MuU3ByaXRlJ10sXHJcbiAgICAgICAgICAgICAgJ2NvbG9yJzogWydjYy5MYWJlbCcsICdjYy5TcHJpdGUnLCAnY2MuR3JhcGhpY3MnXSxcclxuICAgICAgICAgICAgICAnbm9ybWFsQ29sb3InOiBbJ2NjLkJ1dHRvbiddLFxyXG4gICAgICAgICAgICAgICdwcmVzc2VkQ29sb3InOiBbJ2NjLkJ1dHRvbiddLFxyXG4gICAgICAgICAgICAgICd0YXJnZXQnOiBbJ2NjLkJ1dHRvbiddLFxyXG4gICAgICAgICAgICAgICdjb250ZW50U2l6ZSc6IFsnY2MuVUlUcmFuc2Zvcm0nXSxcclxuICAgICAgICAgICAgICAnYW5jaG9yUG9pbnQnOiBbJ2NjLlVJVHJhbnNmb3JtJ11cclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGNvbnN0IHJlY29tbWVuZGVkQ29tcG9uZW50cyA9IHByb3BlcnR5VG9Db21wb25lbnRNYXBbcHJvcGVydHldIHx8IFtdO1xyXG4gICAgICAgICAgY29uc3QgYXZhaWxhYmxlUmVjb21tZW5kZWQgPSByZWNvbW1lbmRlZENvbXBvbmVudHMuZmlsdGVyKGNvbXAgPT4gYXZhaWxhYmxlVHlwZXMuaW5jbHVkZXMoY29tcCkpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBpZiAoYXZhaWxhYmxlUmVjb21tZW5kZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIGluc3RydWN0aW9uICs9IGBcXG5cXG7wn46vIEJhc2VkIG9uIHByb3BlcnR5ICcke3Byb3BlcnR5fScsIHJlY29tbWVuZGVkIGNvbXBvbmVudHM6ICR7YXZhaWxhYmxlUmVjb21tZW5kZWQuam9pbignLCAnKX1gO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBQcm92aWRlIG9wZXJhdGlvbiBzdWdnZXN0aW9uc1xyXG4gICAgICAgICAgaW5zdHJ1Y3Rpb24gKz0gYFxcblxcbvCfk4sgU3VnZ2VzdGVkIEFjdGlvbnM6YDtcclxuICAgICAgICAgIGluc3RydWN0aW9uICs9IGBcXG4xLiBVc2UgZ2V0X2NvbXBvbmVudHMobm9kZVV1aWQ9XCIke3JlcXVlc3RlZFR5cGUuaW5jbHVkZXMoJ3V1aWQnKSA/ICdZT1VSX05PREVfVVVJRCcgOiAnbm9kZVV1aWQnfVwiKSB0byB2aWV3IGFsbCBjb21wb25lbnRzIG9uIHRoZSBub2RlYDtcclxuICAgICAgICAgIGluc3RydWN0aW9uICs9IGBcXG4yLiBJZiB5b3UgbmVlZCB0byBhZGQgYSBjb21wb25lbnQsIHVzZSBhZGRfY29tcG9uZW50KG5vZGVVdWlkPVwiLi4uXCIsIGNvbXBvbmVudFR5cGU9XCIke3JlcXVlc3RlZFR5cGV9XCIpYDtcclxuICAgICAgICAgIGluc3RydWN0aW9uICs9IGBcXG4zLiBWZXJpZnkgdGhhdCB0aGUgY29tcG9uZW50IHR5cGUgbmFtZSBpcyBjb3JyZWN0IChjYXNlLXNlbnNpdGl2ZSlgO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBpbnN0cnVjdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOW/q+mAn+mqjOivgei1hOa6kOiuvue9rue7k+aenFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIGFzeW5jIHF1aWNrVmVyaWZ5QXNzZXQobm9kZVV1aWQ6IHN0cmluZywgY29tcG9uZW50VHlwZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByYXdOb2RlRGF0YSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVXVpZCk7XHJcbiAgICAgICAgICAgIGlmICghcmF3Tm9kZURhdGEgfHwgIXJhd05vZGVEYXRhLl9fY29tcHNfXykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOaJvuWIsOe7hOS7tlxyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSByYXdOb2RlRGF0YS5fX2NvbXBzX18uZmluZCgoY29tcDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wVHlwZSA9IGNvbXAuX190eXBlX18gfHwgY29tcC5jaWQgfHwgY29tcC50eXBlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBUeXBlID09PSBjb21wb25lbnRUeXBlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g5o+Q5Y+W5bGe5oCn5YC8XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSB0aGlzLmV4dHJhY3RDb21wb25lbnRQcm9wZXJ0aWVzKGNvbXBvbmVudCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5RGF0YSA9IHByb3BlcnRpZXNbcHJvcGVydHldO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHByb3BlcnR5RGF0YSAmJiB0eXBlb2YgcHJvcGVydHlEYXRhID09PSAnb2JqZWN0JyAmJiAndmFsdWUnIGluIHByb3BlcnR5RGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5RGF0YS52YWx1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eURhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbcXVpY2tWZXJpZnlBc3NldF0gRXJyb3I6YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iXX0=