import { Balance } from "../config/Balance";

export class PhysicalWorld {
    constructor(scene, geometry) {
        this.scene = scene;
        this.geometry = geometry;

        this.walls = scene.physics.add.staticGroup();
        this.ground = scene.physics.add.staticGroup();          //bloques colocados
        this.eternalGround = scene.physics.add.staticGroup();   //suelo del tablero

        this.createEternalGround();
        this.createBoardWalls();
    }

    //agarramos los grupos contra los que chocamos
    get colliders() {
        return [this.eternalGround, this.ground, this.walls];
    }

    addStatic(group, x, y, width, height) {
        const zone = this.scene.add.zone(x, y, width, height);
        this.scene.physics.add.existing(zone, true);   //true = cuerpo estático
        group.add(zone);
    }

    createEternalGround() {
        const { cell, boardX, boardY, cols, rows } = this.geometry;
        const { floorHeight } = Balance.world;
        const boardWidth = cols * cell;

        this.addStatic(
            this.eternalGround,
            boardX + boardWidth / 2,
            boardY + rows * cell + floorHeight / 2,
            boardWidth,
            floorHeight
        );
    }

    createBoardWalls() {
        const { cell, boardX, boardY, cols, rows } = this.geometry;
        const { wallThickness } = Balance.world;
        const boardWidth = cols * cell;
        const boardHeight = rows * cell;
        const centerY = boardY + boardHeight / 2;

        [boardX - wallThickness / 2, boardX + boardWidth + wallThickness / 2].forEach(wallX => {
            this.addStatic(this.walls, wallX, centerY, wallThickness, boardHeight);
        });
    }

    //Recrea una zona estática por cada casilla ocupada del tablero
    updateGroundHitbox(board) {
        const { cell, boardX, boardY } = this.geometry;
        this.ground.clear(true, true);

        board.grid.forEach((row, r) => row.forEach((type, c) => {
            if (type) {
                this.addStatic(
                    this.ground,
                    boardX + c * cell + cell / 2,
                    boardY + r * cell + cell / 2,
                    cell,
                    cell
                );
            }
        }));
    }
}