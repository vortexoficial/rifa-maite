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

// --- MÁSCARA DE TELEFONE (WHATSAPP) ---
const inputTelefone = document.getElementById('telefone');
if(inputTelefone) {
    inputTelefone.addEventListener('input', function (e) {
        // Remove tudo que não é dígito
        let x = e.target.value.replace(/\D/g, '');
        // Limita a 11 dígitos (DDD + 9 dígitos)
        x = x.substring(0, 11);
        
        // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        if (x.length > 10) {
             e.target.value = x.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (x.length > 6) {
             e.target.value = x.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (x.length > 2) {
             e.target.value = x.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        } else {
             e.target.value = x;
        }
    });
}

// --- FUNÇÕES VISUAIS ---
window.fecharModais = () => {
    const modal = document.getElementById('modal');
    const modalSucesso = document.getElementById('modal-sucesso');
    if(modal) modal.style.display = 'none';
    if(modalSucesso) modalSucesso.style.display = 'none';
}

function abrirModalSucesso(numero) {
    fecharModais(); // Garante que o de compra fecha
    document.getElementById('sucesso-numero').innerText = numero;
    // Usa flex para centralizar
    document.getElementById('modal-sucesso').style.display = 'flex'; 
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
    
    // Usa flex para centralizar
    document.getElementById('modal').style.display = "flex"; 
}

window.confirmarReserva = async () => {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const botao = document.querySelector('#modal button');

    // Validação simples: nome preenchido e telefone com pelo menos 14 caracteres, ex: (11) 99999-9999
    if (!nome || telefone.length < 14) { 
        alert("Por favor, preencha seu nome e o WhatsApp corretamente (com DDD)!");
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