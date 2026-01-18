import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// SUAS CONFIGURAÇÕES
const firebaseConfig = {
  apiKey: "AIzaSyACBB_r8sPsXaIy7L9k2CkMd2rwk3wUrYc",
  authDomain: "rifa-7c72f.firebaseapp.com",
  projectId: "rifa-7c72f",
  storageBucket: "rifa-7c72f.firebasestorage.app",
  messagingSenderId: "1004880007031",
  appId: "1:1004880007031:web:19746f53c62691d9eb9b72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const totalNumeros = 150; 
const grid = document.getElementById('grid-rifa');
let numeroAtual = null;

// --- NOVO: MÁSCARA DE TELEFONE (WHATSAPP) ---
// Isso faz o (11) 99999-9999 aparecer sozinho enquanto digita
const inputTelefone = document.getElementById('telefone');
if(inputTelefone) {
    inputTelefone.addEventListener('input', function (e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

// --- FUNÇÕES VISUAIS ---
window.fecharModais = () => {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-sucesso').style.display = 'none';
}

function abrirModalSucesso(numero) {
    document.getElementById('modal').style.display = 'none'; // fecha o de compra
    document.getElementById('sucesso-numero').innerText = numero;
    document.getElementById('modal-sucesso').style.display = 'block'; // abre o bonito
}

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) window.fecharModais();
}

// --- LÓGICA DO GRID ---
function criarGrid() {
    if(!grid) return; 
    grid.innerHTML = ''; 
    for (let i = 1; i <= totalNumeros; i++) {
        const div = document.createElement('div');
        div.classList.add('numero');
        div.id = `num-${i}`;
        
        // Formata número (001, 002...)
        let numFormatado = i.toString().padStart(3, '0');
        div.textContent = numFormatado;
        
        div.onclick = () => abrirModal(i);
        grid.appendChild(div);
    }
}

// Escuta o banco de dados
onSnapshot(collection(db, "rifa"), (snapshot) => {
    snapshot.forEach((doc) => {
        const dados = doc.data();
        const el = document.getElementById(`num-${doc.id}`);
        if (el && dados.status !== 'livre') { 
            el.classList.remove('livre', 'reservado', 'pago');
            el.classList.add(dados.status);
        } else if (el && dados.status === 'livre') {
             el.classList.remove('reservado', 'pago');
             el.classList.add('livre');
        }
    });
});

window.abrirModal = (n) => {
    const el = document.getElementById(`num-${n}`);
    if (el.classList.contains('reservado') || el.classList.contains('pago')) {
        alert("Este número já foi escolhido!"); 
        return;
    }
    numeroAtual = n;
    document.getElementById('num-selecionado').innerText = n.toString().padStart(3, '0');
    
    // Limpa os campos ao abrir
    document.getElementById('nome').value = '';
    document.getElementById('telefone').value = '';
    
    document.getElementById('modal').style.display = "block";
}

window.confirmarReserva = async () => {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const botao = document.querySelector('#modal button');

    if (!nome || telefone.length < 14) { // Validação básica do tamanho do telefone
        alert("Por favor, preencha seu nome e o WhatsApp corretamente!");
        return;
    }

    botao.disabled = true;
    botao.innerText = "Reservando...";

    try {
        await setDoc(doc(db, "rifa", String(numeroAtual)), {
            nome: nome,
            telefone: telefone,
            status: "reservado",
            data: new Date().toISOString()
        });
        
        abrirModalSucesso(numeroAtual);

    } catch (e) {
        console.error(e);
        alert("Erro ao reservar. Tente novamente.");
    } finally {
        botao.disabled = false;
        botao.innerText = "Confirmar Reserva";
    }
}

criarGrid();