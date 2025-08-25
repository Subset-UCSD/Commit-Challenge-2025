document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const convertButton = document.getElementById('convert-button');
    const svgOutput = document.getElementById('svg-output');
    const svgSize = document.getElementById('svg-size');
    const downloadButton = document.getElementById('download-button');

    let imageUrl = null;

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            imageUrl = event.target.result;
            imagePreview.src = imageUrl;
        };
        reader.readAsDataURL(file);
    });

    convertButton.addEventListener('click', () => {
        if (!imageUrl) {
            alert('Bitte wählen Sie zuerst ein Bild aus!');
            return;
        }

        const img = new Image();
        img.onload = () => {
            const svg = convertImageToSvg(img);
            svgOutput.value = svg;
            svgSize.textContent = new Blob([svg]).size;
            downloadButton.disabled = false;
        };
        img.src = imageUrl;
    });

    downloadButton.addEventListener('click', () => {
        const svg = svgOutput.value;
        if (!svg) return;

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixel-art.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function convertImageToSvg(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const visited = new Array(width * height).fill(false);
        const rectangles = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x);
                if (visited[index]) continue;

                const color = getColorAt(x, y, width, data);
                if (color.a === 0) continue; // Skip transparent pixels

                let rectWidth = 1;
                while (x + rectWidth < width && !visited[index + rectWidth] && isSameColor(color, getColorAt(x + rectWidth, y, width, data))) {
                    rectWidth++;
                }

                let rectHeight = 1;
                let canExtend = true;
                while (y + rectHeight < height && canExtend) {
                    for (let i = 0; i < rectWidth; i++) {
                        if (visited[(y + rectHeight) * width + x + i] || !isSameColor(color, getColorAt(x + i, y + rectHeight, width, data))) {
                            canExtend = false;
                            break;
                        }
                    }
                    if (canExtend) {
                        rectHeight++;
                    }
                }

                for (let ry = 0; ry < rectHeight; ry++) {
                    for (let rx = 0; rx < rectWidth; rx++) {
                        visited[(y + ry) * width + (x + rx)] = true;
                    }
                }

                rectangles.push({ x, y, width: rectWidth, height: rectHeight, color: `rgb(${color.r},${color.g},${color.b})` });
            }
        }

        return generateSvgString(width, height, rectangles);
    }

    function getColorAt(x, y, width, data) {
        const index = (y * width + x) * 4;
        return { r: data[index], g: data[index + 1], b: data[index + 2], a: data[index + 3] };
    }

    function isSameColor(c1, c2) {
        return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
    }

    function generateSvgString(width, height, rectangles) {
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        rectangles.forEach(rect => {
            svg += `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${rect.color}" />`;
        });
        svg += `</svg>`;
        return svg;
    }
});
