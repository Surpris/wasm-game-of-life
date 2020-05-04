mod utils;

use std::fmt; // Display トレイトの呼び出し用
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// #[wasm_bindgen]
// extern "C" {
//     fn alert(s: &str);
// }

// #[wasm_bindgen]
// pub fn greet(name: &str) {
//     alert(&format!("Hello, wasm-game-of-life! from {}", name));
// }

extern crate web_sys;
use web_sys::console;

#[ignore = "unused_macros"]
macro_rules! log {
    ( $( $t:tt )* ) => {
        console::log_1(&format!( $( $t)* ).into());
    }
}

// タイマー構造体
pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
}

// セル構造体
#[wasm_bindgen]
#[repr(u8)] // each cell is represented as a single byte
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    // セルの状態を変更する
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }
}

/// 全体を表す構造体
/// width: 全体の幅
/// height: 全体の高さ
/// cells: 全体を構成するセルのベクター
/// 全体は (height, width) の格子状セルである
#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
impl Universe {
    /// Constructor
    pub fn new() -> Universe {
        // panic! が起こったときのフックを設定する
        utils::set_panic_hook();

        let width: u32 = 64;
        let height: u32 = 64;

        // width * height 分のイテレータを Cell に変換（map）して
        // ベクターに変換（collect）
        let cells = (0..width * height)
            .map(|i| {
                if i % 2 == 0 || i % 7 == 0 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();

        Universe {
            width,
            height,
            cells,
        }
    }

    /// 全体を初期化する
    pub fn reset(&mut self) {
        self.cells = (0..self.width * self.height)
            .map(|i| {
                if i % 2 == 0 || i % 7 == 0 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();
    }

    /// 全体を Dead にする
    pub fn set_all_dead(&mut self) {
        self.cells = (0..self.width * self.height).map(|_i| Cell::Dead).collect();
    }

    /// 全体を Alive にする
    pub fn set_all_alive(&mut self) {
        self.cells = (0..self.width * self.height)
            .map(|_i| Cell::Alive)
            .collect();
    }

    /// 幅を返す
    pub fn width(&self) -> u32 {
        self.width
    }

    /// 幅を設定する
    ///
    /// 幅を設定後にリセットする
    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.reset();
        // self.cells = (0..width * self.height).map(|_i| Cell::Dead).collect();
    }

    /// 高さを返す
    pub fn height(&self) -> u32 {
        self.height
    }

    /// 高さを設定する
    ///
    /// 高さを設定後にリセットする
    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.reset();
        // self.cells = (0..self.width * height).map(|_i| Cell::Dead).collect();
    }

    /// セルを返す
    ///
    /// メモリ上にある Cell を参照するため生のポインタを返すようにしている
    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    /// レンダリング
    pub fn render(&self) -> String {
        // fmt::Display を実装しているので to_string() が使える？
        self.to_string()
    }

    /// (row, column) に位置するセルのインデックスを返す
    fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    /// (row, column) に位置するセルの隣にあるセルで生きているものを数える
    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;

        // (row, col) の東西南北に対応する１セルの座標を計算する
        let north = if row == 0 { self.height - 1 } else { row - 1 };
        let south = if row == self.height - 1 { 0 } else { row + 1 };
        let west = if column == 0 {
            self.width - 1
        } else {
            column - 1
        };
        let east = if column == self.width - 1 {
            0
        } else {
            column + 1
        };

        // 東西南北の各セルで生きているものをカウントする
        let nw = self.get_index(north, west);
        count += self.cells[nw] as u8;
        let n = self.get_index(north, column);
        count += self.cells[n] as u8;
        let ne = self.get_index(north, east);
        count += self.cells[ne] as u8;
        let w = self.get_index(row, west);
        count += self.cells[w] as u8;
        let e = self.get_index(row, east);
        count += self.cells[e] as u8;
        let sw = self.get_index(south, west);
        count += self.cells[sw] as u8;
        let s = self.get_index(south, column);
        count += self.cells[s] as u8;
        let se = self.get_index(south, east);
        count += self.cells[se] as u8;
        count
    }

    /// (row, column) に位置するセルの隣にあるセルで生きているものを数える
    #[allow(dead_code)]
    fn live_neighbor_count_slow(&self, row: u32, column: u32) -> u8 {
        let mut count: u8 = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_col in [self.width - 1, 0, 1].iter().cloned() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells[idx] as u8;
            }
        }
        count
    }

    /// 全体（Universe）を更新する
    pub fn tick(&mut self) {
        // let _timer = Timer::new("Universe::tick");
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);
                // log!(
                //     "cell[{}, {}] is initially {:?} and has {} live neighbors",
                //     row,
                //     col,
                //     cell,
                //     live_neighbors
                // );
                let next_cell = match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbors
                    // dies. as if caused by under-population.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // Rule 2: Any live cel with two or three live neighbors
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // Rule 3: Any live cell with more than three live neighbors
                    // dies, as if by over-population.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // Rule 4; Any dead cell with exactly three live neighbors
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };

                // log!("    it becomes {:?}", next_cell);

                next[idx] = next_cell;
            }
        }
        self.cells = next;
        // println!("tick");
    }

    /// (row, col) に対応するセルの状態を変更する
    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        let idx = self.get_index(row, col);
        self.cells[idx].toggle();
    }
}

impl Universe {
    /// セルの状態を含む配列への参照を返す
    pub fn get_cells(&self) -> &[Cell] {
        &self.cells
    }

    /// セルを alive にする
    pub fn set_cells(&mut self, cells: &[(u32, u32)]) {
        for (row, col) in cells.iter().cloned() {
            let idx = self.get_index(row, col);
            self.cells[idx] = Cell::Alive;
        }
    }
}

/// 表示用
impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == Cell::Dead { '□' } else { '■' };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}
