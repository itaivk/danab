const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const CELL_SIZE = 40;
const PACMAN_SPEED = 5;
const GHOST_SPEED = 3;
const DOT_SIZE = 8;

// Colors
const BLACK = '#000000';
const GREEN = '#00FF00';
const BLUE = '#0000FF';
const WHITE = '#FFFFFF';
const RED = '#FF0000';

class Pacman {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = [0, 0];
        this.radius = CELL_SIZE / 2;
        this.speed = PACMAN_SPEED;
    }

    move(walls) {
        // Handle movement
        if (keys.ArrowLeft) {
            this.direction = [-1, 0];
        } else if (keys.ArrowRight) {
            this.direction = [1, 0];
        } else if (keys.ArrowUp) {
            this.direction = [0, -1];
        } else if (keys.ArrowDown) {
            this.direction = [0, 1];
        }

        // Move in current direction
        const newX = this.x + this.direction[0] * this.speed;
        const newY = this.y + this.direction[1] * this.speed;
        
        // Check for wall collisions
        let canMove = true;
        for (const wall of walls) {
            if (newX + this.radius > wall.x && 
                newX - this.radius < wall.x + wall.width &&
                newY + this.radius > wall.y && 
                newY - this.radius < wall.y + wall.height) {
                canMove = false;
                break;
            }
        }
        
        if (canMove) {
            this.x = newX;
            this.y = newY;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = GREEN;
        ctx.fill();
        ctx.closePath();
    }
}

class Ghost {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = [0, 0];
        this.speed = GHOST_SPEED;
        this.radius = CELL_SIZE / 2;
        this.color = RED;
    }

    move(walls, pacman) {
        // Simple ghost AI: move towards Pac-Man
        const dx = pacman.x - this.x;
        const dy = pacman.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.direction = [dx/distance * this.speed, dy/distance * this.speed];
        }
        
        const newX = this.x + this.direction[0];
        const newY = this.y + this.direction[1];
        
        // Check for wall collisions
        let canMove = true;
        for (const wall of walls) {
            if (newX + this.radius > wall.x && 
                newX - this.radius < wall.x + wall.width &&
                newY + this.radius > wall.y && 
                newY - this.radius < wall.y + wall.height) {
                canMove = false;
                break;
            }
        }
        
        if (canMove) {
            this.x = newX;
            this.y = newY;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Game {
    constructor() {
        this.pacman = new Pacman(canvas.width / 2, canvas.height / 2);
        this.ghost = new Ghost(100, 100);
        this.walls = this.createMaze();
        this.dots = this.createDots();
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
    }

    createMaze() {
        const walls = [];
        // Outer walls
        walls.push(
            { x: 0, y: 0, width: canvas.width, height: 20 },
            { x: 0, y: canvas.height - 20, width: canvas.width, height: 20 },
            { x: 0, y: 0, width: 20, height: canvas.height },
            { x: canvas.width - 20, y: 0, width: 20, height: canvas.height }
        );
        // Inner walls
        walls.push(
            { x: 200, y: 100, width: 20, height: 200 },
            { x: 400, y: 100, width: 20, height: 200 },
            { x: 600, y: 100, width: 20, height: 200 },
            { x: 200, y: 300, width: 20, height: 200 },
            { x: 400, y: 300, width: 20, height: 200 },
            { x: 600, y: 300, width: 20, height: 200 }
        );
        return walls;
    }

    createDots() {
        const dots = [];
        for (let x = 50; x < canvas.width - 50; x += 40) {
            for (let y = 50; y < canvas.height - 50; y += 40) {
                // Check if dot is not inside walls
                let dotInWall = false;
                for (const wall of this.walls) {
                    if (x > wall.x && x < wall.x + wall.width &&
                        y > wall.y && y < wall.y + wall.height) {
                        dotInWall = true;
                        break;
                    }
                }
                if (!dotInWall) {
                    dots.push({ x, y });
                }
            }
        }
        return dots;
    }

    checkCollisions() {
        // Check dot collisions
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            const dx = this.pacman.x - dot.x;
            const dy = this.pacman.y - dot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < DOT_SIZE) {
                this.dots.splice(i, 1);
                this.score += 10;
            }
        }

        // Check ghost collision
        const dx = this.pacman.x - this.ghost.x;
        const dy = this.pacman.y - this.ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.pacman.radius + this.ghost.radius) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                // Reset positions
                this.pacman.x = canvas.width / 2;
                this.pacman.y = canvas.height / 2;
                this.ghost.x = 100;
                this.ghost.y = 100;
            }
        }
    }

    update() {
        // Update Pac-Man
        this.pacman.move(this.walls);
        
        // Update ghost
        this.ghost.move(this.walls, this.pacman);

        // Check for collisions
        this.checkCollisions();

        // Check win condition
        if (this.dots.length === 0) {
            this.gameOver = true;
        }
    }

    draw() {
        // Clear canvas
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw walls
        ctx.fillStyle = BLUE;
        for (const wall of this.walls) {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
        
        // Draw dots
        ctx.fillStyle = WHITE;
        for (const dot of this.dots) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, DOT_SIZE, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
        
        // Draw Pac-Man
        this.pacman.draw();
        
        // Draw ghost
        this.ghost.draw();
        
        // Draw score and lives
        ctx.fillStyle = WHITE;
        ctx.font = '36px Arial';
        ctx.fillText(`Score: ${this.score}`, 10, 40);
        ctx.fillText(`Lives: ${this.lives}`, canvas.width - 100, 40);
        
        if (this.gameOver) {
            ctx.fillStyle = WHITE;
            ctx.font = '48px Arial';
            ctx.fillText('GAME OVER', canvas.width/2 - 100, canvas.height/2);
        }
    }
}

// Handle keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game loop
const game = new Game();
function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 