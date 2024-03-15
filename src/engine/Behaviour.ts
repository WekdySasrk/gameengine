import { GameEngine, GameObject } from "../engine";

/**
 * Game-root
 *  |-- Container1 ; parent = undefined
 *          |-- Container2 ; parent = Container1;
 *                  |-- TextField ;parent = Container2
 */


export class Behaviour {

    gameObject: GameObject;

    engine: GameEngine;

    _active: boolean = false;


    get active() {
        return this._active;
    }

    set active(value: boolean) {
        if (value === this._active) {
            return;
        }
        this._active = value;
        const allSystems = this.engine.getSystems();
        for (const system of allSystems) {
            if (value) {
                system.onAddComponent(this.gameObject, this)
            }
            else {
                system.onRemoveComponent(this.gameObject, this);
            }
        }
    }

    onStart() {
    }

    onTick(duringTime: number) {
    }

    onUpdate() {
    }

    onEnd() {
    }
}
