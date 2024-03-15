import * as yaml from 'js-yaml';
import { Binding } from './bindings/Binding';
import { Behaviour } from "./engine/Behaviour";
import { Rectangle } from './engine/math';
import { ResourceManager } from "./engine/ResourceManager";
import { AnimationSystem } from './engine/systems/AnimationSystem';
import { EditorSystem } from './engine/systems/EditorSystem';
import { GameLifeCycleSystem } from './engine/systems/GameLifeCycleSystem';
import { GamePlaySystem } from './engine/systems/GamePlaySystem';
import { MouseControlSystem } from './engine/systems/MouseControlSystem';
import { CanvasContextRenderingSystem } from './engine/systems/RenderingSystem';
import { System } from './engine/systems/System';
import { TransformSystem } from './engine/systems/TransformSystem';
import { Transform } from "./engine/Transform";
import { PhysicsSystem } from './PhysicsSystem';
const canvas = document.getElementById('game') as HTMLCanvasElement;
const context = canvas.getContext('2d')
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;
canvas.style.width = viewportWidth + 'px'
canvas.style.height = viewportHeight + 'px'
canvas.width = viewportWidth;
canvas.height = viewportHeight;
context.font = "40px Arial";
const gameObjects: { [id: string]: GameObject } = {

}




export class Matrix {

    a = 1;
    b = 0;
    c = 0;
    d = 1;
    tx = 0;
    ty = 0;

    constructor(a: number = 1, b: number = 0, c: number = 0, d: number = 1, tx: number = 0, ty: number = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;

    }

    updateFromTransformProperties(x: number, y: number, scaleX: number, scaleY: number, rotation: number) {
        this.tx = x;
        this.ty = y;

        let skewX, skewY;
        skewX = skewY = rotation / 180 * Math.PI;


        this.a = Math.cos(skewY) * scaleX;
        this.b = Math.sin(skewY) * scaleX;
        this.c = -Math.sin(skewX) * scaleY;
        this.d = Math.cos(skewX) * scaleY;

    }
}

function getQuery(): { [key: string]: string } {
    let result = {};
    const search = window.location.search;
    if (search) {
        const queryString = search.substring(1);
        const tempArr = queryString.split('&');
        for (const kv of tempArr) {
            const [k, v] = kv.split('=');
            result[k] = v;
        }

    }
    return result;
}


export class GameEngine {
    defaultSceneName: string = ''
    rootGameObject = new GameObject()
    editorGameObject = new GameObject();
    lastTime: number = 0;
    storeDuringTime: number = 0;
    resourceManager = new ResourceManager();
    systems: System[] = [];

    public mode: "edit" | "preview" | 'play' = 'edit'

    async start() {
        this.rootGameObject.engine = this;
        this.editorGameObject.engine = this;

        const mode = getQuery().mode;
        const prefab = getQuery().prefab;
        if (mode === 'edit' || mode === 'preview' || mode === 'play') {
            this.mode = mode;
        }
        else {
            this.mode = 'preview'
        }
        this.defaultSceneName = decodeURIComponent(prefab);
        if (this.mode === 'edit' || this.mode === 'preview') {
            this.addSystem(new EditorSystem(context));
        }
        else {
            this.addSystem(new GameLifeCycleSystem());
        }
        this.addSystem(new TransformSystem());

        this.addSystem(new AnimationSystem())
        this.addSystem(new CanvasContextRenderingSystem(context));
        this.addSystem(new PhysicsSystem());
        this.addSystem(new MouseControlSystem())
        if (this.mode === 'play') {
            this.addSystem(new GamePlaySystem())
        }
        const assetsYaml = './assets/assets.yaml'
        await this.resourceManager.loadText(assetsYaml)
        const assetsData = this.unserilizeAssetsYaml(assetsYaml);
        const imageList = assetsData.images;
        for (const asset of imageList) {
            await this.resourceManager.loadImage(asset)
        }
        const prefabList = assetsData.prefabs;
        for (const prefab of prefabList) {
            await this.resourceManager.loadText(prefab)
        }
        await this.resourceManager.loadText('./assets/animations/avatar.yaml')
        await this.resourceManager.loadImage('./assets/animations/avatar.jpg')
        await this.resourceManager.loadText(this.defaultSceneName)
        this.rootGameObject.active = true;
        this.startup();
    }

    unserilizeAssetsYaml(yamlUrl: string) {
        const text = this.resourceManager.getText(yamlUrl);
        try {
            let data = yaml.load(text);
            return data;

        }
        catch (e) {
            console.log(e)
            alert('资源清单文件解析失败')
        }
        return null;
    }


    addSystem(system: System) {
        this.systems.push(system);
        system.rootGameObject = this.rootGameObject;
        system.gameEngine = this;
    }

    removeSystem(system: System) {
        const index = this.systems.indexOf(system);
        if (index >= 0) {
            this.systems.splice(index);
        }
    }

    getSystems() {
        return this.systems;
    }

    getSystem<T extends typeof System>(clz: T): InstanceType<T> {
        for (const system of this.systems) {
            if (system.constructor.name === clz.name) {
                return system as any;
            }
        }
        return null;
    }

    private startup() {
        this.rootGameObject.addBehaviour(new Transform());
        this.editorGameObject.addBehaviour(new Transform())
        const text = this.resourceManager.getText(this.defaultSceneName);
        const scene = this.unserilize(text)
        if (scene) {
            this.rootGameObject.addChild(scene);
        }
        for (const system of this.systems) {
            system.onStart();
        }
        this.enterFrame(0);
    }

    createPrefab2(url: string, data?: BehaviourData) {
        const text = this.resourceManager.getText(url);
        const prefabGameObject = this.unserilize(text)
        if (data) {
            const prefabBehaviour = createBehaviour(data)
            prefabGameObject.addBehaviour(prefabBehaviour)
            prefabGameObject.prefabData = prefabBehaviour;
        }
        return prefabGameObject;
    }

    createPrefab<T extends Binding>(prefabBinding: T): GameObject {
        const url = getPrefabBehaviourInfo(prefabBinding.constructor.name);
        const text = this.resourceManager.getText(url);
        const prefabGameObject = this.unserilize(text)
        prefabGameObject.addBehaviour(prefabBinding)
        prefabGameObject.prefabData = prefabBinding;
        return prefabGameObject;
    }

    private unserilize(text: string): GameObject {

        let data: any;
        try {
            data = yaml.load(text);
        }
        catch (e) {
            console.log(e)
            alert('配置文件解析失败')
        }
        if (!data) {
            return null;
        }
        else {
            return createGameObject(data, this);
        }
    }

    serilize(gameObject: GameObject): string {
        const json = extractGameObject(gameObject);
        const text = yaml.dump(json, {
            noCompatMode: true
        });
        console.log(text);
        return text;
    }

    enterFrame(advancedTime: number) {
        let duringTime = advancedTime - this.lastTime + this.storeDuringTime;
        const milesecondPerFrame = 1000 / 60;
        while (duringTime > milesecondPerFrame) {
            for (const system of this.systems) {
                system.onTick(milesecondPerFrame);
            }
            duringTime -= milesecondPerFrame;
        }
        this.storeDuringTime = duringTime
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.clearRect(0, 0, canvas.width, canvas.height)
        for (const system of this.systems) {
            system.onUpdate();
        }
        for (const system of this.systems) {
            system.onLaterUpdate();
        }
        requestAnimationFrame(this.enterFrame.bind(this));
        this.lastTime = advancedTime;
    }

}

export interface Renderer {
    getBounds(): Rectangle
}


export interface GameEngineMouseEvent {
    localX: number,
    localY: number,
    globalX: number,
    globalY: number
}


export class GameObject {

    static CURRENT_UUID = 0;

    static map: { [uuid: number]: GameObject } = {};

    prefabData: Behaviour | null = null;

    uuid: number = 0;
    id: string;
    parent: GameObject;

    onClick?: (event: GameEngineMouseEvent) => void;

    behaviours: Behaviour[] = [];

    renderer: Renderer;

    children: GameObject[] = [];

    _active: boolean = false;
    engine: GameEngine;

    get active() {
        return this._active;
    }

    set active(value: boolean) {
        this._active = value;
        for (const behaviour of this.behaviours) {
            behaviour.active = value;
        }
        for (const child of this.children) {
            child.active = value;
        }
    }

    constructor() {
        this.uuid = GameObject.CURRENT_UUID++;
        GameObject.map[this.uuid] = this;
    }

    addChild(child: GameObject) {
        this.children.push(child);
        child.engine = this.engine;
        child.parent = this;
        if (this.active) {
            child.active = true;
        }
    }

    removeChild(child: GameObject) {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.children.splice(index, 1);
        }
        child.active = false;
    }

    addBehaviour(behaviour: Behaviour) {
        this.behaviours.push(behaviour);
        behaviour.gameObject = this;
        behaviour.engine = this.engine;
        behaviour.onStart()
        if (this.active) {
            behaviour.active = true;
        }
    }

    //泛型
    getBehaviour<T extends typeof Behaviour>(clz: T): InstanceType<T> {
        for (const behaviour of this.behaviours) {
            if (behaviour.constructor.name === clz.name) {
                return behaviour as any;
            }
        }
        return null;
    }

    removeBehaviour(behaviour: Behaviour) {
        const index = this.behaviours.indexOf(behaviour);
        if (index >= 0) {
            this.behaviours.splice(index, 1);
            behaviour.active = false;
        }
    }
}

const behaviourTable = {

}

const prefabBehaviourTable = {

}

export function getAllComponentDefinationNames() {
    return Object.keys(behaviourTable);
}

export function getBehaviourClassByName(name: string) {
    return behaviourTable[name];
}

type GameObjectData = {
    id?: string
    behaviours: BehaviourData[]
    children?: GameObjectData[]
    prefab?: BehaviourData
}

type BehaviourData = {
    type: string,
    properties?: { [index: string]: any }
}

export function registerBehaviourClass(behaviourClass: any) {
    const className = behaviourClass.name;
    behaviourTable[className] = behaviourClass;
    if (behaviourClass.__prefabUrl) {
        prefabBehaviourTable[className] = behaviourClass.__prefabUrl;
    }
}

function getPrefabBehaviourInfo(className: string): string {
    const url = prefabBehaviourTable[className];
    if (!url) {
        alert('未找到PrefabBehaviour' + className)
    }
    return url;
}

function extractBehaviour(behaviour: Behaviour): BehaviourData {
    const behaviourClass = (behaviour as any).__proto__
    const behaviourClassName = (behaviour as any).constructor.name;
    const __metadatas = behaviourClass.__metadatas || [];
    const behaviourData: BehaviourData = { type: behaviourClassName }

    for (const metadata of __metadatas) {
        behaviourData.properties = behaviourData.properties || {};
        behaviourData.properties[metadata.key] = behaviour[metadata.key];
    }
    return behaviourData;
}

export function extractGameObject(gameObject: GameObject): GameObjectData {
    const gameObjectData: GameObjectData = {
        behaviours: [],
    };
    if (gameObject.id) {
        gameObjectData.id = gameObject.id;
    }
    if (gameObject.prefabData) {
        gameObjectData.prefab = extractBehaviour(gameObject.prefabData)
        return gameObjectData;
    }

    for (const behaviour of gameObject.behaviours) {
        const behaviourData = extractBehaviour(behaviour)
        gameObjectData.behaviours.push(behaviourData)
    }
    for (const child of gameObject.children) {
        const childData = extractGameObject(child);
        gameObjectData.children = gameObjectData.children || [];
        gameObjectData.children.push(childData);
    }
    return gameObjectData
}

export function createGameObject(data: GameObjectData, gameEngine: GameEngine): GameObject {
    let gameObject: GameObject;
    if (data.prefab) {
        const url = getPrefabBehaviourInfo(data.prefab.type);
        gameObject = gameEngine.createPrefab2(url, data.prefab)
    }
    else {
        gameObject = new GameObject();
        gameObject.engine = gameEngine;
    }
    if (data.id) {
        gameObjects[data.id] = gameObject;
        gameObject.id = data.id;
    }
    if (data.prefab) {
        return gameObject;
    }
    for (const behaviourData of data.behaviours) {
        const behaviour = createBehaviour(behaviourData)
        gameObject.addBehaviour(behaviour);
    }

    if (data.children) {
        for (const childData of data.children) {
            const child = createGameObject(childData, gameEngine);
            gameObject.addChild(child);
        }
    }

    return gameObject;
}

function createBehaviour(behaviourData: BehaviourData) {
    const behaviourClass = behaviourTable[behaviourData.type];
    if (!behaviourClass) {
        throw new Error('传入的类名不对:' + behaviourData.type);
    }
    const behaviour: Behaviour = new behaviourClass();
    const __metadatas = behaviourClass.prototype.__metadatas || [];
    // 【反序列化】哪些属性，是根据 metadata(decorator) 来决定的
    // 既然如此，【序列化】哪些属性，也应该根据同样的 metadata(decorator) 来确定
    for (const metadata of __metadatas) {
        const key = metadata.key;
        const value = behaviourData.properties[key]
        metadata.validator(value);
        behaviour[key] = value
    }
    return behaviour;
}



export function getGameObjectById(id: string) {
    return gameObjects[id]
}


// rootGameObject
    // A.active:true->false
            //B.active:true->false