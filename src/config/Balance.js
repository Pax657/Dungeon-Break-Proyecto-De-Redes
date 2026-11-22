export const Balance = {
    tetris: {
        fallDelay: 350, //ms entre caídas automáticas
        firstRepeatDelay: 200, //ms antes de que una tecla mantenida se repita
        lineClearDelay: 250, //ms que está la línea blanca al hacer línea
        lockDelay: 500, //ms antes de lockearse
        keys: {
            left:  { repeatAfter: 120 },
            right: { repeatAfter: 120 },
            down:  { repeatAfter: 90 },
        },
    },
    j2: {
        speed: 300,
        jumpVelocity: -420,
        maxVelocityX: 1000,
        sizeRatio: 0.7,        //tamaño respecto a una celda
    },
    world: {
        wallThickness: 24,
        floorHeight: 24,
    },
    audioVolume: 0.3,
};