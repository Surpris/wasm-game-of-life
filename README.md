<div align="center">

  <h1><code>wasm-game-of-life</code></h1>

  <strong>A test project using <a href="https://github.com/rustwasm/wasm-pack">wasm-pack</a> with the <a href="https://travis-ci.org/github/rustwasm/wasm-pack-template">wasm-pack-template</a>.</strong>

  <p>
    <a href="https://travis-ci.org/rustwasm/wasm-pack-template"><img src="https://img.shields.io/travis/rustwasm/wasm-pack-template.svg?style=flat-square" alt="Build Status" /></a>
  </p>

  <sub>Built with 🦀🕸 by <a href="https://rustwasm.github.io/">The Rust and WebAssembly Working Group</a></sub>
</div>

# About
This project aims to getting used to using WebAssembly (WASM) with Rust.   
The contents of this project were build by following [The Rust and WebAssembly Book](https://github.com/rustwasm/book).

# What was implemented
This project implemented [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life).   
In addition to the implementation by the original tutorial, `index.js` in `www` directory is revised so that this project utilizes the advantage of `WebGL` on the Web browser.

# How to play with this project
## Tested OS
* Windows 10 (1909) Home 64 bit

## Prerequisites
* nodejs >= 10.13.0
  * npm >= 6.4.1
* rustc >= 1.42.0
* wasm-pack >= 0.9.1

## Build this project and run
1. clone this project.
1. move to the project directory and run `wasm-pack build`.
1. move to `www` directory and run `npm install`.
1. run `npm run start` in `www` directory and open `locaohost:XXXX`.
  * `XXXX` is the port number shown in the command line after running.

# Some tips on this project
Some tips on this project are described in `docs/main.md` (in Japanese).
