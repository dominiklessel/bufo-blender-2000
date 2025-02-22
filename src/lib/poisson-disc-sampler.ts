export function poissonDiscSampler(
  width: number,
  height: number,
  radius: number,
) {
  const k = 30; // maximum number of samples before rejection
  const radius2 = radius * radius;
  const R = 3 * radius2;
  const cellSize = radius * Math.SQRT1_2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);

  const grid: [number, number][] = new Array(gridWidth * gridHeight);
  const queue: [number, number][] = [];
  let queueSize = 0;
  let sampleSize = 0;

  return () => {
    if (!sampleSize) return sample(width / 2, height / 2);

    while (queueSize) {
      const i = (Math.random() * queueSize) | 0;
      const s = queue[i];

      for (let j = 0; j < k; ++j) {
        const a = 2 * Math.PI * Math.random();
        const r = Math.sqrt(Math.random() * R + radius2);
        const x = s[0] + r * Math.cos(a);
        const y = s[1] + r * Math.sin(a);

        if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) {
          return sample(x, y);
        }
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  function far(x: number, y: number) {
    const i = (x / cellSize) | 0;
    const j = (y / cellSize) | 0;
    const i0 = Math.max(i - 2, 0);
    const j0 = Math.max(j - 2, 0);
    const i1 = Math.min(i + 3, gridWidth);
    const j1 = Math.min(j + 3, gridHeight);

    for (let j = j0; j < j1; ++j) {
      const o = j * gridWidth;
      for (let i = i0; i < i1; ++i) {
        const s = grid[o + i];
        if (s) {
          const dx = s[0] - x;
          const dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }

    return true;
  }

  function sample(x: number, y: number): [number, number] {
    const s: [number, number] = [x, y];
    queue.push(s);
    grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = s;
    ++sampleSize;
    ++queueSize;
    return s;
  }
}
