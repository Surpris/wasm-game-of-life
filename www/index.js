// import * as wasm from "wasm-game-of-life";

// var str = "user";
// wasm.greet(str);

import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
import FPS from "./fps.js";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const TICKS_MAX = 128;
const TICKS_MIN = 64;
const TICKS_STEP = 32;

// var CONTEXT_TYPE = "2d";
// get parameter in url
const params = (new URL(document.location)).searchParams;
var CONTEXT_TYPE = params.get("context");
if (CONTEXT_TYPE === null) {
    CONTEXT_TYPE = "webgl";
} else {
    CONTEXT_TYPE = CONTEXT_TYPE.toLowerCase();
}

function main() {
    // const pre = document.getElementById("game-of-life-canvas");

    // Initialize the universe, and get its width and height.
    const universe = Universe.new();
    universe.set_width(TICKS_MIN);
    universe.set_height(TICKS_MIN);
    let width = universe.width();
    let height = universe.height();

    /* Setting of the main canvas */
    // Give the canvas room for all of our cells and a 1px border
    // around each of them.
    const canvas = document.getElementById("game-of-life-canvas");
    let context_type = CONTEXT_TYPE;
    let ctx;
    let buffer;
    let color_uniform_location;

    /* Setting of the context-type form and its elements */
    // const contextTypeForm = document.getElementById("context-type");
    // const contextTypeRadios = document.getElementsByName("type_name");
    // contextTypeRadios.forEach((e) => {
    //     e.addEventListener("click", () => {
    //         initCanvasContext();
    //     })
    // });

    // context type の取得
    // const getContextType = () => {
    //     let radioNodeList = contextTypeForm.type_name
    //     let value = radioNodeList.value;
    //     if (value === "") {
    //         throw "Context must be selected.";
    //     } else {
    //         context_type = value.toLowerCase();
    //     }
    //     console.log(context_type);
    // };

    // context の初期化
    const initCanvasContext = () => {
        // getContextType();
        ctx = canvas.getContext(context_type);
        if (!ctx) {
            alert(`No capability of using ${context_type}.`);
            return;
        }

        // WebGL の場合に初期化が必要
        if (context_type == "webgl") {
            // clear canvas
            ctx.clearColor(1.0, 0.0, 1.0, 1.0);
            ctx.clear(ctx.COLOR_BUFFER_BIT);

            // set a buffer
            ctx.deleteBuffer(buffer);
            buffer = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);

            // set a vertex shader
            var vSource = [
                "precision mediump float;",
                "attribute vec2 vertex;",
                "void main(void) {",
                "gl_Position = vec4(vertex, 0.0, 1.0);",
                "}"
            ].join("\n");

            var vShader = ctx.createShader(ctx.VERTEX_SHADER);
            ctx.shaderSource(vShader, vSource);
            ctx.compileShader(vShader);
            ctx.getShaderParameter(vShader, ctx.COMPILE_STATUS);

            // set a fragment shader
            var fSource = [
                "precision mediump float;",
                "uniform vec4 u_color;",
                "void main(void) {",
                "gl_FragColor = u_color;",
                "}"
            ].join("\n");

            var fShader = ctx.createShader(ctx.FRAGMENT_SHADER);
            ctx.shaderSource(fShader, fSource);
            ctx.compileShader(fShader);
            ctx.getShaderParameter(fShader, ctx.COMPILE_STATUS);

            // generate a program object
            var program = ctx.createProgram();
            ctx.attachShader(program, vShader);
            ctx.attachShader(program, fShader);
            ctx.linkProgram(program);
            ctx.getProgramParameter(program, ctx.LINK_STATUS);
            ctx.useProgram(program);

            color_uniform_location = ctx.getUniformLocation(program, "u_color");

            // receive variables from shaders
            var vertex = ctx.getAttribLocation(program, "vertex");
            ctx.enableVertexAttribArray(vertex);
            ctx.vertexAttribPointer(vertex, 2, ctx.FLOAT, false, 0, 0);
        }
    };

    // Context が持つ canvas のサイズを変更する
    // この操作は WebGL の場合に必要
    // 参考：https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    const resizeContextCanvas = (ctx) => {
        if (context_type == "webgl") {
            let displayWidth = ctx.canvas.clientWidth;
            let displayHeight = ctx.canvas.clientHeight;

            if (ctx.canvas.width != displayWidth) {
                ctx.canvas.width = displayWidth;
            }

            if (ctx.canvas.height != displayHeight) {
                ctx.canvas.height = displayHeight;
            }

            ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    };

    // canvas のサイズを変更する
    const setCanvasSize = (width, height) => {
        canvas.height = (CELL_SIZE + 1) * height + 1;
        canvas.width = (CELL_SIZE + 1) * width + 1;
        resizeContextCanvas(ctx);
    };

    // canvas にセル用のグリッドを描画する
    const drawGrids = () => {
        if (context_type == "webgl") {
        } else if (context_type == "2d") {
            ctx.beginPath();
            ctx.strokeStyle = GRID_COLOR;

            // Vertical lines.
            for (let i = 0; i <= width; i++) {
                ctx.moteTo(i * (CELL_SIZE + 1) + 1, 0);
                ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
            }

            // Horizontal lines.
            for (let j = 0; j <= height; j++) {
                ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
                ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
            }
            ctx.stroke();
        }
    };

    const getIndex = (row, column) => {
        return row * width + column;
    };

    // (x, y, width, height) -> edges for triangles constructing a rectangle
    const getRectangle = (x, y, w, h) => {
        let x1 = (x - canvas.width / 2.0) / (canvas.width / 2.0);
        let x2 = (x + w - canvas.width / 2.0) / (canvas.width / 2.0);
        let y1 = (y - canvas.height / 2.0) / (canvas.height / 2.0);
        let y2 = (y + h - canvas.height / 2.0) / (canvas.height / 2.0);
        return [
            x1, y1, x2, y1, x1, y2,
            x1, y2, x2, y1, x2, y2
        ];
    };

    var rgba = [1.0, 0.0, 0.0, 1.0];
    // canvas にセルを描画する
    const drawCells = () => {
        const cellsPtr = universe.cells();
        const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

        if (context_type == "webgl") {
            // Alive cells.
            let vertices = [];

            ctx.uniform4f(color_uniform_location, 0.0, 0.0, 0.0, 1.0);
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const idx = getIndex(row, col);
                    if (cells[idx] !== Cell.Alive) {
                        continue;
                    }
                    let rect_edges = getRectangle(
                        col * (CELL_SIZE + 1) + 1,
                        row * (CELL_SIZE + 1) + 1,
                        CELL_SIZE,
                        CELL_SIZE
                    );
                    vertices.push(...rect_edges);
                }
            }

            // ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
            ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.DYNAMIC_DRAW);
            ctx.drawArrays(ctx.TRIANGLES, 0, vertices.length / 2);

            // Dead cells.
            vertices = [];
            ctx.uniform4f(color_uniform_location, 1.0, 1.0, 1.0, 1.0);
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const idx = getIndex(row, col);
                    if (cells[idx] !== Cell.Dead) {
                        continue;
                    }
                    let rect_edges = getRectangle(
                        col * (CELL_SIZE + 1) + 1,
                        row * (CELL_SIZE + 1) + 1,
                        CELL_SIZE,
                        CELL_SIZE
                    );
                    vertices.push(...rect_edges);
                }
            }
            // ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
            ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.DYNAMIC_DRAW);
            ctx.drawArrays(ctx.TRIANGLES, 0, vertices.length / 2);
        } else if (context_type == "2d") {
            ctx.beginPath();

            // Alive cells.
            ctx.fillStyle = ALIVE_COLOR;
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const idx = getIndex(row, col);
                    if (cells[idx] !== Cell.Alive) {
                        continue;
                    }
                    ctx.fillRect(
                        col * (CELL_SIZE + 1) + 1,
                        row * (CELL_SIZE + 1) + 1,
                        CELL_SIZE,
                        CELL_SIZE
                    );
                }
            }

            // Dead cells.
            ctx.fillStyle = DEAD_COLOR;
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const idx = getIndex(row, col);
                    if (cells[idx] !== Cell.Dead) {
                        continue;
                    }
                    ctx.fillRect(
                        col * (CELL_SIZE + 1) + 1,
                        row * (CELL_SIZE + 1) + 1,
                        CELL_SIZE,
                        CELL_SIZE
                    );
                }
            }

            ctx.stroke();
        }
    };

    // canvas に動作の追加
    canvas.addEventListener("click", event => {
        const boundingRect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / boundingRect.width;
        const scaleY = canvas.height / boundingRect.height;

        const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
        const canvasTop = (event.clientY - boundingRect.top) * scaleY;

        const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
        const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

        universe.toggle_cell(row, col);

        drawCells();
    });

    // アニメーションの ID
    let animationId = null;

    // ID に対応するアニメーションが停止しているかどうかを返す
    const isPaused = (id) => {
        return id == null;
    }

    /* Setting of the number-width and number-height inputs */
    // number-width
    const widthInput = document.getElementById("number-width");
    widthInput.setAttribute("min", TICKS_MIN);
    widthInput.setAttribute("max", TICKS_MAX);
    widthInput.setAttribute("step", TICKS_STEP);
    widthInput.setAttribute("value", "64");
    widthInput.oninput = () => {
        width = widthInput.value;
        setCanvasSize(width, height);
        universe.set_width(width);
    };

    // number-height
    const heightInput = document.getElementById("number-height");
    heightInput.setAttribute("min", TICKS_MIN);
    heightInput.setAttribute("max", TICKS_MAX);
    heightInput.setAttribute("step", TICKS_STEP);
    heightInput.setAttribute("value", "64");
    heightInput.oninput = () => {
        height = heightInput.value;
        setCanvasSize(width, height);
        universe.set_height(height);
    };

    /* Setting of the update-ticks input */
    // update-ticks input の取得と設定
    const updateTicksInput = document.getElementById("update-ticks");
    updateTicksInput.setAttribute("min", "1");
    updateTicksInput.setAttribute("max", "10");
    updateTicksInput.setAttribute("value", "1");
    updateTicksInput.setAttribute("step", "1");

    // ticks-value span の取得と設定
    const ticksValueSpan = document.getElementById("ticks-value");
    ticksValueSpan.innerHTML = updateTicksInput.value;

    // ticks が更新されたときの処理の追加
    updateTicksInput.oninput = () => {
        ticksValueSpan.innerHTML = updateTicksInput.value;
    }

    /* Setting of the reset-universe input */
    const resetUniverseButton = document.getElementById("reset-universe");
    resetUniverseButton.addEventListener("click", event => {
        universe.reset();
        drawCells();
    });

    /* Setting of the set-all-dead button */
    const setAllDeadButton = document.getElementById("set-all-dead");
    setAllDeadButton.addEventListener("click", event => {
        universe.set_all_dead();
        drawCells();
    });

    /* Setting of the play-pause button */
    // play-pause button の取得
    const playPauseButton = document.getElementById("play-pause");

    // play の動作
    const play = () => {
        playPauseButton.textContent = "Pause";
        renderLoop();
    }

    // pause の動作
    const pause = () => {
        playPauseButton.textContent = "Start";
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // play-pause button への動作の実装
    playPauseButton.addEventListener("click", event => {
        if (isPaused(animationId)) {
            play();
        } else {
            pause();
        }
    });

    const fps1 = new FPS("fps");

    /* Main loop function */
    // レンダリングループ関数
    const renderLoop = () => {
        // debugger;
        // pre.textContent = universe.render();
        fps1.render();

        for (let ii = 0; ii < updateTicksInput.value; ii++) {
            universe.tick();
        }

        // drawGrid();
        drawCells();

        // レンダリングループ関数を実行する関数
        // 再帰的にレンダリングを行う
        animationId = requestAnimationFrame(renderLoop);
    };

    /* Start up */
    initCanvasContext(ctx);
    setCanvasSize(width, height);
    // 描画が必要
    // drawGrid();
    drawCells();
    // requestAnimationFrame(renderLoop);
    // play();
}

main();