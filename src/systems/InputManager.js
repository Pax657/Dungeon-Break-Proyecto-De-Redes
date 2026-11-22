import { Balance } from "../config/Balance";
import { Controls } from "../config/Controls";

export class InputManager {
    constructor(scene, actions) {
        const kb = scene.input.keyboard;
        const { keys } = Balance.tetris;

        //teclas que se mantienen
        this.held = [
            { key: kb.addKey(Controls.tetris.left), action: actions.left, repeatAfter: keys.left.repeatAfter, nextAt: null },
            { key: kb.addKey(Controls.tetris.right), action: actions.right, repeatAfter: keys.right.repeatAfter, nextAt: null },
            { key: kb.addKey(Controls.tetris.down), action: actions.down, repeatAfter: keys.down.repeatAfter, nextAt: null }
        ];

        //teclas que sólo se pulsan
        this.pressed = [
            { name: `keydown-${Controls.tetris.rotate}`, handler: (e) => { if (!e.repeat) actions.rotate(); } }
        ];
        this.pressed.forEach(p => kb.on(p.name, p.handler));

        scene.events.once('shutdown', () => {
            this.pressed.forEach(p => kb.off(p.name, p.handler));
        });
    }

    update(time) {
        const { firstRepeatDelay } = Balance.tetris;

        this.held.forEach(h => {
            if (!h.key.isDown) {
                h.nextAt = null;
            } else if (h.nextAt === null) {
                h.action();                              //primera pulsación
                h.nextAt = time + firstRepeatDelay;
            } else if (time >= h.nextAt) {
                h.action();                              //repetición
                h.nextAt = time + h.repeatAfter;
            }
        });
    }
}