export const IMAGES = {
    fondo: { key: 'fondo', path: 'assets/Sprites/Fondo.png' },
    infoJugador1: { key: 'infoJugador1', path: 'assets/Sprites/Info_Box_Amarillo.png' },
    infoJugador2: { key: 'infoJugador2', path: 'assets/Sprites/Info_Box_Naranja.png' },
};

export const AUDIO = {
    gameMusic: { key: 'gameMusic', path: 'assets/audio/music.mp3' },
    rotate: { key: 'protacion', path: 'assets/Sonidos/protacion.mp3' },
    lineClear: { key: 'clinea', path: 'assets/Sonidos/shoosh.mp3' },
};

//Carga todo de una vez desde el preload de cualquier escena
export function loadAssets(scene) {
    Object.values(IMAGES).forEach(({ key, path }) => scene.load.image(key, path));
    Object.values(AUDIO).forEach(({ key, path }) => scene.load.audio(key, path));
}