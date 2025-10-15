// --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
const STORAGE_KEY = 'pontosDeInteresseBH';
const RAIO_DE_BUSCA_METROS = 2000; // Raio de 2km

// Referências aos elementos do DOM
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const addLocationBtn = document.getElementById('add-current-location-btn');
const resultsInfo = document.getElementById('results-info');

// Inicializa o mapa com foco em Belo Horizonte
const map = L.map('map').setView([-19.916667, -43.933333], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variáveis para guardar o marcador e o círculo da busca
let searchMarker = null;
let searchCircle = null;


// --- FUNÇÕES DE DADOS E LOCALSTORAGE ---

function inicializarDados() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const pontosExemplo = [
            { lat: -19.9329, lng: -43.9391, nome: 'Praça da Liberdade', status: 'livre' },
            { lat: -19.9230, lng: -43.9387, nome: 'Mercado Central', status: 'livre' },
            { lat: -19.9208, lng: -43.9355, nome: 'Praça Sete de Setembro', status: 'livre' },
            { lat: -19.8651, lng: -43.9664, nome: 'Estádio Mineirão', status: 'livre' },
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pontosExemplo));
    }
}

function carregarPontos() {
    const pontosJSON = localStorage.getItem(STORAGE_KEY);
    return pontosJSON ? JSON.parse(pontosJSON) : [];
}

// NOVA FUNÇÃO para salvar um novo ponto
function salvarNovoPonto(novoPonto) {
    const pontos = carregarPontos();
    pontos.push(novoPonto);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pontos));
}

// --- FUNÇÕES DE INTERAÇÃO COM O MAPA ---

// NOVA FUNÇÃO para desenhar um único ponto (mais eficiente)
function desenharPontoIndividual(ponto) {
    const corIcone = ponto.status === 'livre' ? 'green' : 'red';
    L.marker([ponto.lat, ponto.lng], {
        icon: L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${corIcone}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        })
    })
    .addTo(map)
    .bindPopup(`<b>${ponto.nome}</b><br>Status: ${ponto.status}`);
}

function desenharTodosOsPontos() {
    const pontos = carregarPontos();
    pontos.forEach(ponto => desenharPontoIndividual(ponto));
}

function processarResultadoBusca(lat, lon, displayName) {
    map.setView([lat, lon], 15);
    if (searchMarker) map.removeLayer(searchMarker);
    if (searchCircle) map.removeLayer(searchCircle);

    searchMarker = L.marker([lat, lon], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup(`Local Buscado: ${displayName}`).openPopup();

    searchCircle = L.circle([lat, lon], { radius: RAIO_DE_BUSCA_METROS, color: '#007bff', fillColor: '#007bff', fillOpacity: 0.1 }).addTo(map);

    contarPontosNaRegiao(lat, lon);
}


// --- FUNÇÕES DE BUSCA E LÓGICA PRINCIPAL ---

async function buscarEndereco() {
    const query = searchInput.value.trim();
    if (query === "") return alert("Por favor, digite um endereço.");

    resultsInfo.innerHTML = `<p>Buscando por "${query}"...</p>`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Belo Horizonte, Brazil`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
            const result = data[0];
            processarResultadoBusca(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        } else {
            resultsInfo.innerHTML = `<p>Endereço não encontrado.</p>`;
        }
    } catch (error) {
        resultsInfo.innerHTML = `<p>Ocorreu um erro ao buscar o endereço.</p>`;
        console.error("Erro na busca:", error);
    }
}

function contarPontosNaRegiao(latCentro, lonCentro) {
    const pontos = carregarPontos();
    let pontosLivres = 0;
    
    pontos.forEach(ponto => {
        if (map.distance([latCentro, lonCentro], [ponto.lat, ponto.lng]) <= RAIO_DE_BUSCA_METROS) {
            if (ponto.status === 'livre') pontosLivres++;
        }
    });

    resultsInfo.innerHTML = `<p>Em um raio de <strong>${RAIO_DE_BUSCA_METROS / 1000} km</strong>, existem <strong>${pontosLivres}</strong> ponto(s) livre(s).</p>`;
}

// NOVA FUNÇÃO para registrar a localização atual
function registrarLocalizacaoAtual() {
    if (!('geolocation' in navigator)) {
        alert("Geolocalização não é suportada pelo seu navegador.");
        return;
    }
    
    resultsInfo.innerHTML = "<p>Obtendo sua localização atual...</p>";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            // Pede ao usuário um nome para o novo ponto
            const nomeDoPonto = prompt("Digite um nome para este local:");

            if (nomeDoPonto && nomeDoPonto.trim() !== "") {
                const novoPonto = {
                    lat: latitude,
                    lng: longitude,
                    nome: nomeDoPonto.trim(),
                    status: 'livre' // Novo ponto sempre é 'livre' por padrão
                };

                salvarNovoPonto(novoPonto);
                desenharPontoIndividual(novoPonto);
                map.setView([latitude, longitude], 16); // Centraliza no novo ponto com mais zoom
                resultsInfo.innerHTML = `<p>Ponto "<strong>${novoPonto.nome}</strong>" salvo com sucesso!</p>`;
            } else {
                resultsInfo.innerHTML = "<p>Criação de ponto cancelada.</p>";
            }
        },
        (error) => {
            resultsInfo.innerHTML = `<p>Não foi possível obter a localização. Erro: ${error.message}</p>`;
        }
    );
}

// --- INICIALIZAÇÃO E EVENTOS ---

searchBtn.addEventListener('click', buscarEndereco);
searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') buscarEndereco();
});

// Adiciona o evento ao novo botão
addLocationBtn.addEventListener('click', registrarLocalizacaoAtual);

document.addEventListener('DOMContentLoaded', () => {
    inicializarDados();
    desenharTodosOsPontos();
});