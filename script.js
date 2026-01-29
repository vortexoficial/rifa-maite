import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// SUAS CONFIGURAÇÕES (Mantive as mesmas do arquivo original)
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

// ATUALIZADO PARA 120 NÚMEROS
const totalNumeros = 120; 
const grid = document.getElementById('grid-rifa');
let numeroAtual = null;

// --- LOADER ---
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    }, 2000); // Tempo do loader aparecendo (2 segundos)
});

// --- MÁSCARA DE TELEFONE ---
const inputTelefone = document.getElementById('telefone');
if(inputTelefone) {
    inputTelefone.addEventListener('input', function (e) {
        let x = e.target.value.replace(/\D/g, '').substring(0, 11);
        if (x.length > 10) e.target.value = x.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        else if (x.length > 6) e.target.value = x.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        else if (x.length > 2) e.target.value = x.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        else e.target.value = x;
    });
}

// --- VISUAL E MODAIS ---
window.fecharModais = () => {
    const modal = document.getElementById('modal');
    const modalSucesso = document.getElementById('modal-sucesso');
    if(modal) modal.style.display = 'none';
    if(modalSucesso) modalSucesso.style.display = 'none';
}

function abrirModalSucesso(numero) {
    fecharModais();
    document.getElementById('sucesso-numero').innerText = numero.toString().padStart(3, '0');
    document.getElementById('modal-sucesso').style.display = 'flex'; 
}

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) window.fecharModais();
}

// --- CRIAÇÃO DO GRID ---
function criarGrid() {
    if(!grid) return; 
    grid.innerHTML = ''; 
    for (let i = 1; i <= totalNumeros; i++) {
        const div = document.createElement('div');
        div.classList.add('numero');
        div.id = `num-${i}`;
        div.textContent = i.toString().padStart(3, '0');
        div.onclick = () => abrirModal(i);
        grid.appendChild(div);
    }
}

// Escuta Firebase em tempo real
onSnapshot(collection(db, "rifa"), (snapshot) => {
    snapshot.forEach((doc) => {
        const dados = doc.data();
        const el = document.getElementById(`num-${doc.id}`);
        // Verifica se o ID do documento está dentro do range 1 a 120
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
        alert("Poxa, este número já foi escolhido! Tente outro."); 
        return;
    }
    numeroAtual = n;
    
    // --- LÓGICA DAS FRALDAS ---
    let textoFralda = "";
    if (n >= 1 && n <= 20) {
        textoFralda = "Fralda P + Mimo";
    } else if (n >= 21 && n <= 90) { // Ajustado para fechar a conta com o G começando em 91
        textoFralda = "Fralda M + Mimo";
    } else if (n >= 91 && n <= 120) {
        textoFralda = "Fralda G + Mimo";
    }
    
    document.getElementById('tipo-fralda').innerText = textoFralda;
    document.getElementById('num-selecionado').innerText = n.toString().padStart(3, '0');
    
    // Limpa campos
    document.getElementById('nome').value = '';
    document.getElementById('telefone').value = '';
    
    document.getElementById('modal').style.display = "flex"; 
}

window.confirmarReserva = async () => {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const botao = document.querySelector('#modal .btn-confirmar');

    if (!nome || telefone.length < 14) { 
        alert("Preencha seu nome e WhatsApp (com DDD)!");
        return;
    }

    botao.disabled = true;
    botao.innerText = "Processando...";

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
        alert("Erro ao conectar. Tente novamente.");
    } finally {
        botao.disabled = false;
        botao.innerText = "Confirmar Reserva 💜";
    }
}

criarGrid();