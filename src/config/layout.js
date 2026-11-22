export const Layout = {
    infoBox: {
        widthRatio: 0.25,   //ancho de la caja respecto al ancho del juego
        boxP1: { x: 0.16, y: 0.58 },
        boxP2: { x: 0.84, y: 0.37 },
        nextPieces: {
            offsetsX: [70, 250],
            offsetY: 40,
        },
    },



    board: {
        cols: 15,
        rows: 22,
        x: 0.337, //guardamos fracciones para que funcione con otras resoluciones
        y: 0.1, //esperemos que funcione, todo para tenerlo más junto
        cellRatio: 0.038 //tamaño de cada cubo
    },
};