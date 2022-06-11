const WAVEFORM_FOREGROUND = "rgb(50, 50, 200)";

export const WAVEFORM_PIXELS_PER_SECOND = 100;

export function drawWaveform(canvas, ctx, data, startAt=0) {
    ctx.clearRect(startAt, 0, canvas.width - startAt, canvas.height);

    ctx.fillStyle = WAVEFORM_FOREGROUND;
    // Move origin of y axis to the center of the canvas
    ctx.translate(0, canvas.height/2);

    for (let x = startAt; x < data.length; x++) {
        let y = data[x] * canvas.height/2 + 1;
        ctx.fillRect(x, -y, 1, 2*y);
    }

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
