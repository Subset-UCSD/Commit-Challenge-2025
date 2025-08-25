document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const blobCount = 10;
    const blobs = [];

    class Blob {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.radius = Math.random() * 30 + 20;
            this.color = `rgba(255, 0, 0, ${Math.random() * 0.5 + 0.2})`;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x - this.radius < 0 || this.x + this.radius > width) {
                this.vx *= -1;
            }
            if (this.y - this.radius < 0 || this.y + this.radius > height) {
                this.vy *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.filter = 'blur(10px)';
            ctx.fill();
        }
    }

    for (let i = 0; i < blobCount; i++) {
        blobs.push(new Blob());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (const blob of blobs) {
            blob.update();
            blob.draw();
        }

        requestAnimationFrame(animate);
    }

    animate();
});
