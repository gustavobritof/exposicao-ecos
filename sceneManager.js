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
        originalColor: { type: 'string', default: 'black' }
    },
    init: function () {
        const cursor = document.querySelector('a-cursor');
        const hoverColor = this.data.cursorColor;

        this.el.addEventListener('mouseenter', () => {
            cursor.setAttribute('color', hoverColor);
            cursor.setAttribute('radiusInner', '0.005');
            cursor.setAttribute('radiusOuter', '0.015');
        });

        this.el.addEventListener('mouseleave', () => {
            cursor.setAttribute('color', this.data.originalColor);
            cursor.setAttribute('radiusInner', '0.003');
            cursor.setAttribute('radiusOuter', '0.01');
        });
    }

});
