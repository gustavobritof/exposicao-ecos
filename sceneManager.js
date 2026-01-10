const CENAS = {
    1: 'index-simples01.html',
    2: 'index-simples02.html'
};

function irParaCena(numeroCena) {
    if (CENAS[numeroCena]) {
        // Aplica o fade out
        document.body.style.opacity = '0';

        setTimeout(() => {
            // Usa location.assign ou href para permitir que o botão "voltar" funcione
            globalThis.location.href = CENAS[numeroCena];
        }, 500);
    }
}

// Quando a página terminar de carregar, faz o Fade In
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Hover para quando o cursor passar sobre os modelos 3D
AFRAME.registerComponent('cursor-hover', {
    schema: {
        cursorColor: { type: 'string', default: 'green' },
        originalColor: { type: 'string', default: 'white' }
    },
    init: function () {
        const cursor = document.querySelector('a-cursor');
        if (!cursor) return;

        const hoverColor = this.data.cursorColor;
        const originalColor = this.data.originalColor;

        // Garante que o elemento captura eventos
        this.el.classList.add('clickable');

        // Desabilita raycast nos filhos para evitar conflito
        this.el.querySelectorAll('*').forEach(child => {
            if (child.classList && !child.classList.contains('clickable')) {
                child.setAttribute('raycastable', 'false');
            }
        });

        this.el.addEventListener('mouseenter', () => {
            cursor.setAttribute('color', hoverColor);
            cursor.setAttribute('scale', '1.2 1.2 1.2'); // Feedback visual extra
        });

        this.el.addEventListener('mouseleave', () => {
            cursor.setAttribute('color', originalColor);
            cursor.setAttribute('scale', '1 1 1');
        });

        // Mantém hover mesmo com movimento
        this.el.addEventListener('raycaster-intersected', () => {
            cursor.setAttribute('color', hoverColor);
        });

        this.el.addEventListener('raycaster-intersected-cleared', () => {
            cursor.setAttribute('color', originalColor);
        });
    }
});


// Componente para detecção de colisão com paredes (melhorado para círculos e torus)
AFRAME.registerComponent('wall-collision', {
    schema: {
        radius: { type: 'number', default: 0.5 } // Raio de colisão do jogador
    },

    init() {
        this.walls = [];
        this.fences = []; // Array para cercas (torus)
        this.wallsLoaded = false;

        // Configurações específicas para cena 02 (sala circular)
        this.circularRoom = {
            center: { x: 0, z: -2 }, // Centro da sala circular
            outerRadius: 4.5,  // Raio da parede externa (5 - margem de 0.5)
            fenceRadius: 3,    // Raio da cerca (torus)
            fenceMargin: 0.3,  // Margem de colisão da cerca
            active: false
        };
    },

    tick() {
        const player = this.el;
        const playerPos = player.object3D.position;
        const radius = this.data.radius;

        // Detecta se está na scene02 (sala circular)
        const sceneId = document.querySelector('a-scene').id;
        if (sceneId === 'scene02') {
            this.circularRoom.active = true;
        }

        // Colisão com sala circular (Scene02)
        if (this.circularRoom.active) {
            const dx = playerPos.x - this.circularRoom.center.x;
            const dz = playerPos.z - this.circularRoom.center.z;
            const distanceFromCenter = Math.sqrt(dx * dx + dz * dz);

            // ===== COLISÃO COM PAREDE EXTERNA  =====
            // A cerca já impede o jogador de chegar até a parede
            /*
            const maxDistance = this.circularRoom.outerRadius - radius;
            if (distanceFromCenter > maxDistance) {
                const angle = Math.atan2(dz, dx);
                playerPos.x = this.circularRoom.center.x + Math.cos(angle) * maxDistance;
                playerPos.z = this.circularRoom.center.z + Math.sin(angle) * maxDistance;
            }
            */

            // ===== COLISÃO COM CERCA (TORUS) - ATIVA =====
            const fenceInnerRadius = this.circularRoom.fenceRadius - this.circularRoom.fenceMargin;
            const fenceOuterRadius = this.circularRoom.fenceRadius + this.circularRoom.fenceMargin;

            // Se estiver dentro da área da cerca
            if (distanceFromCenter >= fenceInnerRadius - radius && distanceFromCenter <= fenceOuterRadius + radius) {
                const angle = Math.atan2(dz, dx);

                // Se estava fora da cerca, empurra para fora
                if (distanceFromCenter > this.circularRoom.fenceRadius) {
                    playerPos.x = this.circularRoom.center.x + Math.cos(angle) * (fenceOuterRadius + radius);
                    playerPos.z = this.circularRoom.center.z + Math.sin(angle) * (fenceOuterRadius + radius);
                }
                // Se estava dentro, empurra para dentro
                else {
                    playerPos.x = this.circularRoom.center.x + Math.cos(angle) * (fenceInnerRadius - radius);
                    playerPos.z = this.circularRoom.center.z + Math.sin(angle) * (fenceInnerRadius - radius);
                }
            }

            return; // Não verifica colisões AABB na sala circular
        }

        // Colisão AABB normal (Scene01)
        if (!this.wallsLoaded) {
            const wallElements = document.querySelectorAll('.wall');
            if (wallElements.length === 0) return;

            wallElements.forEach(wallEl => {
                const geometry = wallEl.getAttribute('geometry') || {};
                const width = wallEl.getAttribute('width') || geometry.width || 1;
                const height = wallEl.getAttribute('height') || geometry.height || 1;
                const depth = wallEl.getAttribute('depth') || geometry.depth || 1;

                this.walls.push({
                    el: wallEl,
                    width: parseFloat(width),
                    height: parseFloat(height),
                    depth: parseFloat(depth)
                });
            });
            this.wallsLoaded = true;
        }

        // Verifica colisão com cada parede
        this.walls.forEach(wall => {
            const wallPos = wall.el.object3D.position;

            const halfWidth = wall.width / 2;
            const halfDepth = wall.depth / 2;

            const dx = Math.abs(playerPos.x - wallPos.x);
            const dz = Math.abs(playerPos.z - wallPos.z);

            if (dx < (halfWidth + radius) && dz < (halfDepth + radius)) {
                const overlapX = (halfWidth + radius) - dx;
                const overlapZ = (halfDepth + radius) - dz;

                if (overlapX < overlapZ) {
                    if (playerPos.x < wallPos.x) {
                        playerPos.x -= overlapX;
                    } else {
                        playerPos.x += overlapX;
                    }
                } else {
                    if (playerPos.z < wallPos.z) {
                        playerPos.z -= overlapZ;
                    } else {
                        playerPos.z += overlapZ;
                    }
                }
            }
        });
    }
});


// Loader personalizado com barra de progresso
window.addEventListener('load', () => {
    // Gera estrelas aleatórias
    const starsContainer = document.querySelector('.stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }

    const scene = document.querySelector('a-scene');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const loader = document.getElementById('custom-loader');

    // Simula progresso de carregamento
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;

        progressBar.style.width = progress + '%';
        progressText.textContent = Math.floor(progress) + '%';
    }, 200);

    // Quando a cena carregar completamente
    scene.addEventListener('loaded', () => {
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = '100%';

        setTimeout(() => {
            loader.classList.add('fade-out');
            document.body.style.opacity = '1';

            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }, 500);
    });

    // Fallback caso não dispare o evento 'loaded'
    setTimeout(() => {
        if (!loader.classList.contains('fade-out')) {
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
            loader.classList.add('fade-out');
            document.body.style.opacity = '1';

            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }
    }, 8000);
});

// Componente para links VR com fuse
AFRAME.registerComponent('vr-link', {
    schema: {
        href: { type: 'string' },
        fuseTimeout: { type: 'number', default: 2000 }
    },

    init() {
        this.isFusing = false;
        this.startTime = 0;

        this.el.classList.add('clickable');

        this.onEnter = this.onEnter.bind(this);
        this.onLeave = this.onLeave.bind(this);
        this.onClick = this.onClick.bind(this);

        this.el.addEventListener('mouseenter', this.onEnter);
        this.el.addEventListener('mouseleave', this.onLeave);
        this.el.addEventListener('click', this.onClick);
    },

    onEnter() {
        // inicia fuse manual
        if (!this.el.sceneEl.is('vr-mode')) return;
        this.isFusing = true;
        this.startTime = performance.now();
        this.el.emit('vr-fuse-start');
    },

    onLeave() {
        this.isFusing = false;
        this.startTime = 0;
        this.el.emit('vr-fuse-cancel');
    },

    onClick() {
        // desktop / trigger
        this.navigate();
    },

    tick() {
        if (!this.isFusing) return;

        const elapsed = performance.now() - this.startTime;
        if (elapsed >= this.data.fuseTimeout) {
            this.navigate();
            this.isFusing = false;
        }
    },

    navigate() {
        this.el.emit('vr-fuse-complete');
        window.location.href = this.data.href;
    }
});

// Shader personalizado para portal circular
AFRAME.registerShader('portal', {
    schema: {
        pano: { type: 'map', is: 'uniform' }
    },

    vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,

    fragmentShader: `
            uniform sampler2D pano;
            varying vec2 vUv;

            void main() {
                // Mapeia UV do círculo (0 a 1) para centralizar a textura
                vec2 uv = vUv;
                gl_FragColor = texture2D(pano, uv);
            }
            `
});
