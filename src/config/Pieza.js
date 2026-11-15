//cada pieza consta de un espacio en el mundo
export const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};

//registramos colores para poner, y visualmente distinguir las piezas
//cambiar luego por sprites
export const COLORS = {
    I: { key: 'bloque_I', path: 'assets/Sprites/Cubo_Azul.png' },
    O: { key: 'bloque_O', path: 'assets/Sprites/Cubo_Naranja.png' },
    T: { key: 'bloque_T', path: 'assets/Sprites/Cubo_Morado.png' },
    S: { key: 'bloque_S', path: 'assets/Sprites/Cubo_Verde.png' },
    Z: { key: 'bloque_Z', path: 'assets/Sprites/Cubo_Verde.png' },
    J: { key: 'bloque_J', path: 'assets/Sprites/Cubo_Verde.png' },
    L: { key: 'bloque_L', path: 'assets/Sprites/Cubo_Verde.png' },
};

//Rotación 90 grados
export const rotateCW = (m) => m[0].map((_, c) => m.map(row => row[c]).reverse());