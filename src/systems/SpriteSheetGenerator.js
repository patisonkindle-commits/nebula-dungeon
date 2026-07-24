// SpriteSheetGenerator — Runtime sprite sheet builder (ported from spritebrew)
// Features:
//   - Auto-detect frame grid from sprite sheet images
//   - Extract individual frames
//   - Assemble frames into grid/strip sprite sheets
//   - Pixel-art–safe nearest-neighbor resizing
//   - Build Phaser textures at runtime

export class SpriteSheetGenerator {
  constructor(scene) {
    this.scene = scene;
  }

  // ── Auto-detect frame grid (ported from spritebrew spriteUtils) ──

  detectFrameGrid(imageData) {
    const { width, height, data } = imageData;

    // 1) Try transparent gutter detection
    const isTransparentColumn = (col) => {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + col) * 4;
        if (data[idx + 3] > 10) return false;
      }
      return true;
    };

    const isTransparentRow = (row) => {
      for (let x = 0; x < width; x++) {
        const idx = (row * width + x) * 4;
        if (data[idx + 3] > 10) return false;
      }
      return true;
    };

    const vGutters = [];
    for (let x = 1; x < width - 1; x++) {
      if (isTransparentColumn(x)) vGutters.push(x);
    }

    const hGutters = [];
    for (let y = 1; y < height - 1; y++) {
      if (isTransparentRow(y)) hGutters.push(y);
    }

    const gutterW = this._detectConsistentSpacing(vGutters, width);
    const gutterH = this._detectConsistentSpacing(hGutters, height);

    if (gutterW && gutterH) {
      return {
        width: gutterW,
        height: gutterH,
        columns: Math.floor(width / gutterW),
        rows: Math.floor(height / gutterH),
      };
    }

    // 2) Try standard square sizes
    const standardSizes = [8, 12, 16, 20, 24, 26, 32, 48, 64, 80];
    for (const size of standardSizes) {
      if (width % size === 0 && height % size === 0) {
        return {
          width: size,
          height: size,
          columns: width / size,
          rows: height / size,
        };
      }
    }

    // 3) Try any even divisor
    for (let s = Math.min(width, height); s >= 8; s--) {
      if (width % s === 0 && height % s === 0 && s % 2 === 0) {
        return {
          width: s,
          height: s,
          columns: width / s,
          rows: height / s,
        };
      }
    }

    // Fallback: whole image as one frame
    return { width, height, columns: 1, rows: 1 };
  }

  _detectConsistentSpacing(gutters, totalSize) {
    if (gutters.length === 0) return null;

    // Group consecutive gutters into bands
    const bands = [];
    let bandStart = gutters[0];
    let bandEnd = gutters[0];

    for (let i = 1; i < gutters.length; i++) {
      if (gutters[i] === bandEnd + 1) {
        bandEnd = gutters[i];
      } else {
        bands.push({ start: bandStart, end: bandEnd });
        bandStart = gutters[i];
        bandEnd = gutters[i];
      }
    }
    bands.push({ start: bandStart, end: bandEnd });

    if (bands.length < 1) return null;

    // Single gutter → frame size = gutter position
    if (bands.length === 1) {
      if (bands[0].start > 4 && totalSize % bands[0].start < 4) {
        return bands[0].start;
      }
      return null;
    }

    // Check consistent spacing
    const spacings = [bands[0].start];
    for (let i = 1; i < bands.length; i++) {
      spacings.push(bands[i].start - bands[i - 1].start);
    }

    const mode = this._findMode(spacings);
    if (mode && mode > 4) {
      const tolerance = 2;
      const consistent = spacings.filter((s) => Math.abs(s - mode) <= tolerance);
      if (consistent.length >= spacings.length * 0.6) {
        return mode;
      }
    }

    return null;
  }

  _findMode(arr) {
    if (arr.length === 0) return null;
    const freq = new Map();
    for (const v of arr) freq.set(v, (freq.get(v) || 0) + 1);
    let maxCount = 0;
    let mode = null;
    for (const [val, count] of freq) {
      if (count > maxCount) {
        maxCount = count;
        mode = val;
      }
    }
    return mode;
  }

  // ── Frame extraction ──

  extractFrame(sourceCanvas, x, y, width, height) {
    const frame = document.createElement('canvas');
    frame.width = width;
    frame.height = height;
    const ctx = frame.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
    return frame;
  }

  // ── Assemble frames into grid sheet ──

  assembleGridSheet(frames, columns = null, padding = 0, powerOfTwo = false) {
    if (frames.length === 0) {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      return c;
    }

    if (!columns) columns = Math.ceil(Math.sqrt(frames.length));

    const fw = frames[0].width;
    const fh = frames[0].height;
    const rows = Math.ceil(frames.length / columns);

    let sheetW = columns * fw + (columns - 1) * padding;
    let sheetH = rows * fh + (rows - 1) * padding;

    if (powerOfTwo) {
      sheetW = this._nextPowerOfTwo(sheetW);
      sheetH = this._nextPowerOfTwo(sheetH);
    }

    const canvas = document.createElement('canvas');
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frames.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = col * (fw + padding);
      const y = row * (fh + padding);
      ctx.drawImage(frames[i], x, y);
    }

    return canvas;
  }

  // ── Strip sheet (horizontal) ──

  assembleStripSheet(frames) {
    if (frames.length === 0) {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      return c;
    }

    const fw = frames[0].width;
    const fh = frames[0].height;
    const canvas = document.createElement('canvas');
    canvas.width = fw * frames.length;
    canvas.height = fh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < frames.length; i++) {
      ctx.drawImage(frames[i], i * fw, 0);
    }
    return canvas;
  }

  // ── Pixel-art-safe resizing ──

  resizePixelArt(source, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    return canvas;
  }

  scaleCanvas(source, scale) {
    return this.resizePixelArt(
      source,
      Math.floor(source.width * scale),
      Math.floor(source.height * scale)
    );
  }

  // ── Fit to square canvas (preserve aspect ratio) ──

  fitToSquare(source, targetSize, bgColor = null) {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
    }

    const srcW = source.naturalWidth || source.width;
    const srcH = source.naturalHeight || source.height;
    const scale = Math.min(targetSize / srcW, targetSize / srcH);
    const scaledW = Math.max(1, Math.round(srcW * scale));
    const scaledH = Math.max(1, Math.round(srcH * scale));
    const offsetX = Math.round((targetSize - scaledW) / 2);
    const offsetY = Math.round((targetSize - scaledH) / 2);

    ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH);
    return canvas;
  }

  // ── Canvas to data URL ──

  canvasToDataURL(canvas) {
    return canvas.toDataURL('image/png');
  }

  // ── Data URL to Phaser texture ──

  addCanvasAsTexture(key, canvas) {
    const dataURL = canvas.toDataURL('image/png');
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (this.scene.textures.exists(key)) {
          this.scene.textures.remove(key);
        }
        this.scene.textures.addSpriteSheet(key, img, {
          frameWidth: canvas.width,
          frameHeight: canvas.height,
        });
        resolve(key);
      };
      img.onerror = () => {
        console.warn(`SprSheetGen: Failed to load canvas as texture "${key}"`);
        resolve(null);
      };
      img.src = dataURL;
    });
  }

  // ── Auto-slice a sprite sheet image into Phaser animation frames ──

  async autoSliceImage(imageUrl, sheetKey, animKey, frameRate = 8) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Draw to canvas for pixel data access
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const grid = this.detectFrameGrid(imageData);

        if (!grid) {
          console.warn(`SprSheetGen: Could not detect frame grid for "${imageUrl}"`);
          resolve(null);
          return;
        }

        // Add as spritesheet
        if (this.scene.textures.exists(sheetKey)) {
          this.scene.textures.remove(sheetKey);
        }
        this.scene.textures.addSpriteSheet(sheetKey, img, {
          frameWidth: grid.width,
          frameHeight: grid.height,
        });

        const totalFrames = grid.columns * grid.rows;
        if (totalFrames > 1) {
          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(sheetKey, {
              start: 0,
              end: totalFrames - 1,
            }),
            frameRate,
            repeat: -1,
          });
        }

        resolve({ sheetKey, animKey, grid, totalFrames });
      };
      img.onerror = () => {
        console.warn(`SprSheetGen: Failed to load "${imageUrl}"`);
        resolve(null);
      };
      img.src = imageUrl;
    });
  }

  _nextPowerOfTwo(n) {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
  }
}
