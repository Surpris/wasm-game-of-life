Rust and WebAssembly
=====

このプロジェクトでは Rust と WebAssembly (WASM) を組み合わせたウェブページ開発の方法を学習する。   
[Rust and WebAssemnly](https://rustwasm.github.io/docs/book/) を用いて学習を進める。

## 用いるツール
* `wasm-pack`：[こちら](https://rustwasm.github.io/wasm-pack/installer/)からインストールする。
* `cargo-generate`：`cargo install cargo-generate`
* `npm`：Node.js からインストールするか `nodist` を使用する。


## プロジェクトのてにおは
* テンプレートは次のコマンドで入手できる。
    * `cargo generate --git https://github.com/rustwasm/wasm-pack-template --name my-project`
* ビルドは `wasm-pack build` で行う。
    * もし `wasm-opt` 関連でエラーが出た場合は `Cargo.toml` に次を追加する。
        ```Cargo.toml
        [package.metadata.wasm-pack.profile.release]
        wasm-opt = false
        ```
* ウェブページのビルドは `npm init wasm-app www` で行う。
* ウェブページを（ローカルに）インストールする場合は `www` ディレクトリ内で `npm install` を実行する。
* ウェブページを（ローカルで）立ち上げする場合は `www` ディレクトリ内で `npm run start` を実行する。
* テストは `tests` ディレクトリ内にテンプレートが生成されているので、それを利用する。
* `tests` ディレクトリ内で `wasm-pack test --<options>` を実行すればテストできる。
    * `<options>` には例えば次を設定できる。
        * `<web_browser>`
        * `headless`
* `bench` 属性を関数に付けると、 `cargo bench` によって`test` より高度な実行プロファイリングができる。
    * `#![feature(test)]` 属性を付ける必要があり、この機能を使用するには `cargo +nightly bench` という風に nightly 指定が必要。
    * Rust のデフォルトを stable に保った状態で nightly でベンチマークを実行したいときは、次のようにする。
        * `rustup run nightly cargo bench`
        * 参考：https://sioyaki.com/entry/2019/08/29/141805
* コードを作成するときには次の点を考慮する必要がある。
    * パフォーマンス
    * 可読性
    * `~/src/lib.rs` の `live_neighbor_count` と `live_neighbor_count_slow` が一例。

## wasm-pack のあれこれ
* ログをコンソールに表示したい場合に `web-sys` クレートの `console::log` が便利。
    * `lib.rs` には前述のログ関数をラップしたマクロが定義されている。
* `console::time_with_label(&str)` は `str` が表す関数の実行時間ログ機能を提供する？
    * `str` が表す関数内で最初に定義（宣言）すれば使用できる。
* `console::time_end_with_label(&str)` は `str` が表す関数の実行時間ログ機能とログ終了機能を提供する？
    * `str` が表す関数内で最初に定義（宣言）すれば使用できる。
* `web_sys::window().performance().now()` が FPS timer となっている。

## Node.js (JavaScript) のあれこれ
* `requestAnimationFrame(fn)` は `fn` を呼び出してアニメーションを更新する。
    * アニメーションの `id` を返す。
* WASM の linear memory へのアクセスは `<project-name>_bg` モジュール中の `memory` をインポートすることで達成できる。
* `debugger;` をスクリプト内に置くと、サイト内でのスクリプトの動きを調べることができる。
* `cancelAnimationFrame(id)` は `id` に対応するアニメーションを停止する。
* Node.js ではクラスを定義する際に `module.exports` を使用する必要がある。
    * 例：`module.exports = class MyClass {}`
    * 参考：https://qiita.com/kznr_luk/items/e49b9a11872fae606e1a
    * インポートするときは通常の JavaScript と同様。
* JavaScript 内で `performance().now()` が標準的に使用できる。
* 基本的に canvas の context は最初に取り出したものから変更できない。
* 配列の結合・拡張の速度について。
    * プッシュ結合（`a.push(...b);`）の方がスライス結合（`a = [...a, ...b];`）より高速である。
        * 要素数が多くなると速度の違いが顕著になる。

## WebGL のあれこれ
* 参考 URL
    * https://qiita.com/ienaga/items/9f85d127c175bfca0cae
    * https://qiita.com/katsew/items/0b338a508b59be410902
* WebGL では二種類のシェーダを自作してリンクし、コンパイルすることによって図形などを描画する。
    * OpenGL Shading Language (GLSL) を使ってシェーダを記述する。
* 頂点シェーダ：座標系
    * 最初に呼ばれるシェーダ。
    * 頂点の情報（色情報、座標情報）を持ち、フラグメントシェーダに受け渡すことができる。
* フラグメントシェーダ：色彩
    * 頂点シェーダから受け取った情報を元に描画対象の色情報を追加する。
* シェーダで使用する変数には次のようなものがある。
    * vec, vec2, vec3, vec4, ...
    * mat
    * float
    * int
* シェーダで使用する修飾子には次のようなものがある。
    * attribute：頂点ごとに異なる情報を受け取る時に使う。
    * uniform：全ての頂点に一律で適用したい処理に使う。
    * varying：頂点シェーダからフラグメントシェーダに変数を受け渡したいときに使う。
* WebGL でシェーダを使用して描画するまでのステップは次のようになる。
    1. 頂点シェーダとフラグメントシェーダを記述する。
    1. 各シェーダをシェーダソースに入れてコンパイルする。
    1. コンパイルによって生成された二つのシェーダを WebGL のプログラムに入れてリンクする。
    1. JS 内でシェーダプログラムから変数を取り出したり、JS からシェーダプログラムに入れたりする。
    1. 描画する。
* WebGL と Canvas では座標の対応が異なる点に注意。
    * Canvas では top-left を (0, 0) とする実際の px サイズで描画される。
    * WebGL では left-top を (-1, 1)、 center を (0, 0)、 right-bottom を (1, -1) とする比率で描画される。
* WebGL の初期化の前に canvas size が初期化されていないといけない。
    * 正確に述べると、 WebGL context が生成された後で canvas size に変更が入った場合、それを自動的には反映しない。
    * 従って次のサイトで示されているように WebGL の canvas のプロパティを変更しなくてはならない。
        * https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
        * https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html