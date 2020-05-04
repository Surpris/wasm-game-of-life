/* fps class */
module.exports = class FPS {
    constructor(id) {
        this.fps = document.getElementById(id);
        this.frames = [];
        this.lastFrameTImeStamp = performance.now();
    }

    render() {
        // Convert the delta time since the last frame render into a 
        // measure of FPS.
        const now = performance.now();
        const delta = now - this.lastFrameTImeStamp;
        this.lastFrameTImeStamp = now;
        const fps = 1 / delta * 1000;

        // Save only the latest 100 timing.
        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        // Find the max, min, and mean of our 100 latest timings.
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let ii = 0; ii < this.frames.length; ii++) {
            sum += this.frames[ii];
            min = Math.min(this.frames[ii], min);
            max = Math.max(this.frames[ii], max);
        }
        let mean = sum / this.frames.length;

        // Render the statistics.
        this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
    }
};

// export default FPS;