const loadFofocas = async () => {
    try {
        const response = await fetch('http://localhost:3000/fofocas/api'); // Chama a rota que retorna todas as fofocas
        const fofocas = await response.json();

        const timelineDiv = document.getElementById('timeline');
        timelineDiv.innerHTML = '';

        if (fofocas.message) {
            timelineDiv.innerHTML = `<p>${fofocas.message}</p>`;
        } else {
            fofocas.forEach(fofoca => {
                const fofocaElement = document.createElement('div');
                fofocaElement.className = 'fofoca';
                fofocaElement.innerHTML = `
                    <h3>${fofoca.title}</h3>
                    <p>${fofoca.description}</p>
                `;
                timelineDiv.appendChild(fofocaElement);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar fofocas:', error);
    }
};

// Chama a função para carregar as fofocas ao abrir a página
loadFofocas();