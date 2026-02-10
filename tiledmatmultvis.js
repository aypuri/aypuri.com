const TILE_SIZE = 4; // 4x4 for vis 
const MATRIX_SIZE = 8;

let matrixA = [];
let matrixB = [];
let matrixC = [];
let currentTileX = 0;
let currentTileY = 0;
let currentK = 0;
let animationInterval = null;
let animationSteps = [];
let currentStepIndex = 0;

// Initialize matrices
function initializeMatrices() {
    for (let i = 0; i < MATRIX_SIZE; i++) {
        matrixA[i] = [];
        matrixB[i] = [];
        matrixC[i] = [];
        for (let j = 0; j < MATRIX_SIZE; j++) {
            matrixA[i][j] = Math.floor(Math.random() * 9) + 1;
            matrixB[i][j] = Math.floor(Math.random() * 9) + 1;
            matrixC[i][j] = 0;
        }
    }
}

// Generate animation steps
function generateSteps() {
    animationSteps = [];
    const numTiles = MATRIX_SIZE / TILE_SIZE;
    
    // For each output tile
    for (let tileRow = 0; tileRow < numTiles; tileRow++) {
        for (let tileCol = 0; tileCol < numTiles; tileCol++) {
            // For each tile along K dimension
            for (let tileK = 0; tileK < numTiles; tileK++) {
                // Step 1: Load tiles
                animationSteps.push({
                    type: 'load',
                    tileRow, tileCol, tileK,
                    description: `Loading tiles: A[${tileRow*TILE_SIZE}:${(tileRow+1)*TILE_SIZE}, ${tileK*TILE_SIZE}:${(tileK+1)*TILE_SIZE}] and B[${tileK*TILE_SIZE}:${(tileK+1)*TILE_SIZE}, ${tileCol*TILE_SIZE}:${(tileCol+1)*TILE_SIZE}] into local memory`
                });
                
                // Step 2: Compute
                for (let i = 0; i < TILE_SIZE; i++) {
                    for (let j = 0; j < TILE_SIZE; j++) {
                        const globalRow = tileRow * TILE_SIZE + i;
                        const globalCol = tileCol * TILE_SIZE + j;
                        
                        animationSteps.push({
                            type: 'compute',
                            tileRow, tileCol, tileK,
                            localRow: i, localCol: j,
                            globalRow, globalCol,
                            description: `Computing C[${globalRow}][${globalCol}] using row ${i} of Asub and column ${j} of Bsub`
                        });
                    }
                }
            }
        }
    }
}

function createMatrix(data, id) {
    const container = document.createElement('div');
    container.className = 'matrix-container';
    
    const label = document.createElement('div');
    label.className = 'matrix-label';
    label.textContent = `Matrix ${id}`;
    container.appendChild(label);
    
    const matrix = document.createElement('div');
    matrix.className = 'matrix';
    matrix.id = `matrix${id}`;
    matrix.style.gridTemplateColumns = `repeat(${MATRIX_SIZE}, 35px)`;
    
    for (let i = 0; i < MATRIX_SIZE; i++) {
        for (let j = 0; j < MATRIX_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `${id}-${i}-${j}`;
            cell.textContent = id === 'C' ? '' : data[i][j];
            matrix.appendChild(cell);
        }
    }
    
    container.appendChild(matrix);
    return container;
}

function renderVisualization() {
    const viz = document.getElementById('visualization');
    viz.innerHTML = '';
    
    viz.appendChild(createMatrix(matrixA, 'A'));
    
    const op1 = document.createElement('div');
    op1.className = 'operator';
    op1.textContent = '×';
    viz.appendChild(op1);
    
    viz.appendChild(createMatrix(matrixB, 'B'));
    
    const op2 = document.createElement('div');
    op2.className = 'operator';
    op2.textContent = '=';
    viz.appendChild(op2);
    
    viz.appendChild(createMatrix(matrixC, 'C'));
}

function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('tile-highlight', 'active-row', 'active-col', 'result-cell');
    });
}

function visualizeStep(step) {
    clearHighlights();
    
    if (step.type === 'load') {
        // Highlight A tile
        for (let i = 0; i < TILE_SIZE; i++) {
            for (let j = 0; j < TILE_SIZE; j++) {
                const row = step.tileRow * TILE_SIZE + i;
                const col = step.tileK * TILE_SIZE + j;
                document.getElementById(`A-${row}-${col}`).classList.add('tile-highlight');
            }
        }
        
        // Highlight B tile
        for (let i = 0; i < TILE_SIZE; i++) {
            for (let j = 0; j < TILE_SIZE; j++) {
                const row = step.tileK * TILE_SIZE + i;
                const col = step.tileCol * TILE_SIZE + j;
                document.getElementById(`B-${row}-${col}`).classList.add('tile-highlight');
            }
        }
        
        document.getElementById('stepInfo').innerHTML = `
            <strong>Step: Load Tiles</strong><br>
            ${step.description}<br><br>
            <span class="code-highlight">barrier(CLK_LOCAL_MEM_FENCE)</span> - All ${TILE_SIZE}×${TILE_SIZE}=${TILE_SIZE*TILE_SIZE} threads cooperatively load data into local memory.
        `;
        
        document.getElementById('computation').textContent = 'Loading tiles into __local memory (Asub and Bsub)...';
    } else if (step.type === 'compute') {
        // Highlight A tile
        for (let i = 0; i < TILE_SIZE; i++) {
            for (let j = 0; j < TILE_SIZE; j++) {
                const row = step.tileRow * TILE_SIZE + i;
                const col = step.tileK * TILE_SIZE + j;
                document.getElementById(`A-${row}-${col}`).classList.add('tile-highlight');
            }
        }
        
        // Highlight B tile
        for (let i = 0; i < TILE_SIZE; i++) {
            for (let j = 0; j < TILE_SIZE; j++) {
                const row = step.tileK * TILE_SIZE + i;
                const col = step.tileCol * TILE_SIZE + j;
                document.getElementById(`B-${row}-${col}`).classList.add('tile-highlight');
            }
        }
        
        // Highlight active row in A
        for (let j = 0; j < TILE_SIZE; j++) {
            const col = step.tileK * TILE_SIZE + j;
            document.getElementById(`A-${step.globalRow}-${col}`).classList.add('active-row');
        }
        
        // Highlight active column in B
        for (let i = 0; i < TILE_SIZE; i++) {
            const row = step.tileK * TILE_SIZE + i;
            document.getElementById(`B-${row}-${step.globalCol}`).classList.add('active-col');
        }
        
        // Highlight result cell
        document.getElementById(`C-${step.globalRow}-${step.globalCol}`).classList.add('result-cell');
        
        // Calculate partial sum
        let computation = '';
        let sum = 0;
        for (let k = 0; k < TILE_SIZE; k++) {
            const aRow = step.globalRow;
            const aCol = step.tileK * TILE_SIZE + k;
            const bRow = step.tileK * TILE_SIZE + k;
            const bCol = step.globalCol;
            const product = matrixA[aRow][aCol] * matrixB[bRow][bCol];
            sum += product;
            if (k > 0) computation += ' + ';
            computation += `(${matrixA[aRow][aCol]}×${matrixB[bRow][bCol]})`;
        }
        
        // Update C matrix
        matrixC[step.globalRow][step.globalCol] += sum;
        document.getElementById(`C-${step.globalRow}-${step.globalCol}`).textContent = matrixC[step.globalRow][step.globalCol];
        
        document.getElementById('stepInfo').innerHTML = `
            <strong>Step: Compute</strong><br>
            ${step.description}<br><br>
            Thread (${step.globalRow}, ${step.globalCol}) computes: <span class="code-highlight">sum += Asub[${step.localRow}][k] * Bsub[k][${step.localCol}]</span><br>
            Partial result for this tile: ${sum}
        `;
        
        document.getElementById('computation').innerHTML = `<strong>C[${step.globalRow}][${step.globalCol}] +=</strong> ${computation} = ${sum}`;
    }
}

function startAnimation() {
    if (animationInterval) return;
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    const speed = parseInt(document.getElementById('speedSlider').value);
    animationInterval = setInterval(() => {
        if (currentStepIndex < animationSteps.length) {
            visualizeStep(animationSteps[currentStepIndex]);
            currentStepIndex++;
        } else {
            pauseAnimation();
            document.getElementById('stepInfo').innerHTML = '<strong>Animation Complete!</strong><br>All elements of matrix C have been computed using tiled matrix multiplication.';
        }
    }, speed);
}

function pauseAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
}

function resetAnimation() {
    pauseAnimation();
    currentStepIndex = 0;
    initializeMatrices();
    renderVisualization();
    clearHighlights();
    document.getElementById('computation').textContent = 'Click "Start Animation" to begin';
    document.getElementById('stepInfo').textContent = 'Ready to start. The animation will show how threads cooperatively load tiles into local memory and compute partial results.';
}

function stepForward() {
    pauseAnimation();
    if (currentStepIndex < animationSteps.length) {
        visualizeStep(animationSteps[currentStepIndex]);
        currentStepIndex++;
    }
}

function stepBackward() {
    pauseAnimation();
    if (currentStepIndex > 0) {
        currentStepIndex--;
        // Reset C matrix to recompute
        resetAnimation();
        for (let i = 0; i < currentStepIndex; i++) {
            if (animationSteps[i].type === 'compute') {
                const step = animationSteps[i];
                let sum = 0;
                for (let k = 0; k < TILE_SIZE; k++) {
                    const aRow = step.globalRow;
                    const aCol = step.tileK * TILE_SIZE + k;
                    const bRow = step.tileK * TILE_SIZE + k;
                    const bCol = step.globalCol;
                    sum += matrixA[aRow][aCol] * matrixB[bRow][bCol];
                }
                matrixC[step.globalRow][step.globalCol] += sum;
                document.getElementById(`C-${step.globalRow}-${step.globalCol}`).textContent = matrixC[step.globalRow][step.globalCol];
            }
        }
        if (currentStepIndex > 0) {
            visualizeStep(animationSteps[currentStepIndex - 1]);
        }
    }
}

document.getElementById('speedSlider').addEventListener('input', function() {
    const speed = parseInt(this.value);
    document.getElementById('speedLabel').textContent = (speed / 1000).toFixed(1) + 's';
    if (animationInterval) {
        pauseAnimation();
        startAnimation();
    }
});

// Initialize
initializeMatrices();
generateSteps();
renderVisualization();