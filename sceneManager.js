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

