export class Tablero {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;

        this.grid = []
        for (let i = 0; i < rows; i++) {
            this.grid.push(Array(cols).fill(null));
        }
    }

    //comprobamos si podemos poner los cuadros en la posición que queremos hacerlo
    //matrix = la matriz de la pieza, x e y son la posición
    isValid(matrix, x, y) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {

                //si hay un hueco en la matriz, continuamos recorriendo
                if (!matrix[i][j]) continue;

                //posición del cubo en el tablero
                const posX = x + j;
                const posY = y + i;

                //no válido si se sale del tablero
                if (posX < 0 || posX >= this.cols || posY >= this.rows) return false;

                //no válido si hay algo en esa posición del tablero
                //posY >= 0 evita que retorne válido si se sale por arriba al final
                if (posY >= 0 && this.grid[posY][posX]) return false;

            }
        }
        return true;
    }

    //dejamos la pieza activa y la copiamos en el la matriz grid
    //con y + r >= evitamos que nos lo guarde al salirse por arriba (posiciones no válidas)
    lockPiece(matrix, x, y, type) {
        matrix.forEach((row, r) => row.forEach((cell, c) => {
            if (cell && y + r >= 0) {
                this.grid[y + r][x + c] = type;
            }
        }));
    }

    //borra filas COMPLETAS, baja las que estén arriba y devuelve cuántas borró
    clearLine() {
        //nos quedamos con las filas NO completas
        //filtramos en el grid usando "some" que devuelve true si al menos una casilla está vacía
        const kept = this.grid.filter(row => row.some(cell => !cell));
        const cleared = this.rows - kept.length;

        //crea un array lleno de nulos para después ponerlo por encima de los otros guardados
        const empty = Array.from({ length: cleared }, () => Array(this.cols).fill(null));
        this.grid = [...empty, ...kept]; //los 3 puntos vuelcan todos los elementos, no el array únicamente
        

        return cleared;
    }
}