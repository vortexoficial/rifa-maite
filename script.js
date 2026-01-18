// --- IMPORTAÇÕES (Versão para Navegador) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- SUAS CONFIGURAÇÕES (Já inseridas do histórico) ---
const firebaseConfig = {
  apiKey: "AIzaSyACBB_r8sPsXaIy7L9k2CkMd2rwk3wUrYc",
  authDomain: "rifa-7c72f.firebaseapp.com",
  projectId: "rifa-7c72f",
  storageBucket: "rifa-7c72f.firebasestorage.app",
  messagingSenderId: "1004880007031",
  appId: "1:1004880007031:web:19746f53c62691d9eb9b72"
};

// --- INICIALIZAÇÃO DO FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- LÓGICA DA RIFA ---
// ATUALIZADO PARA 150 NÚMEROS
const totalNumeros = 150; 
const grid = document.getElementById('grid-rifa');
let numeroAtual = null;

// 1. Gera os números na tela
function criarGrid() {
    if(!grid) return; 
    grid.innerHTML = ''; 
    for (let i = 1; i <= totalNumeros; i++) {
        const div = document.createElement('div');
        div.classList.add('numero');
        div.id = `num-${i}`;
        div.textContent = i;
        // Adiciona zero à esquerda para números menores que 100 (opcional, fica mais bonito)
        if (i < 10) div.textContent = '0' + i;
        if (i < 100 && totalNumeros >= 100) div.textContent = (i < 10 ? '00' : '0') + i;

        div.onclick = () => abrirModal(i);
        grid.appendChild(div);
    }
}

// 2. Escuta o banco de dados em Tempo Real
onSnapshot(collection(db, "rifa"), (snapshot) => {
    snapshot.forEach((doc) => {
        const dados = doc.data();
        const numero = doc.id;
        const status = dados.status; 
        
        const el = document.getElementById(`num-${numero}`);
        if (el) {
            el.classList.remove('livre', 'reservado', 'pago');
            el.classList.add(status);
        }
    });
});

// Funções do Modal (Janela de compra)
const modal = document.getElementById("modal");
window.abrirModal = (n) => {
    const el = document.getElementById(`num-${n}`);
    if (el.classList.contains('reservado') || el.classList.contains('pago')) {
        alert("Este número já não está disponível!");
        return;
    }

    numeroAtual = n;
    const spanNumero = document.getElementById('num-selecionado');
    // Formata o número no modal também
    let numeroFormatado = n;
    if (n < 10) numeroFormatado = '0' + n;
    if (n < 100 && totalNumeros >= 100) numeroFormatado = (n < 10 ? '00' : '0') + n;

    if(spanNumero) spanNumero.innerText = numeroFormatado;
    
    // Limpa os campos
    document.getElementById('nome').value = '';
    document.getElementById('telefone').value = '';
    
    if(modal) modal.style.display = "block";
}

// Fechar modal
const spanClose = document.querySelector('.close');
if(spanClose) spanClose.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

// 3. Botão Confirmar Reserva
window.confirmarReserva = async () => {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const botaoConfirmar = document.querySelector('#modal button');

    if (!nome || !telefone) {
        alert("Por favor, preencha seu nome e WhatsApp para que possamos entrar em contato!");
        return;
    }

    // Desabilita botão para evitar duplo clique
    botaoConfirmar.disabled = true;
    botaoConfirmar.innerText = "Reservando...";

    try {
        await setDoc(doc(db, "rifa", String(numeroAtual)), {
            nome: nome,
            telefone: telefone,
            status: "reservado",
            valor: 10.00,
            data: new Date()
        });

        alert(`Sucesso! O número ${numeroAtual} foi reservado. Por favor, faça o PIX de R$ 10,00 e envie o comprovante.`);
        if(modal) modal.style.display = "none";
        
    } catch (e) {
        console.error("Erro ao gravar: ", e);
        alert("Erro ao reservar. Verifique sua conexão e tente novamente.");
    } finally {
        botaoConfirmar.disabled = false;
        botaoConfirmar.innerText = "Confirmar Reserva";
    }
}

// Inicia o grid
criarGrid();