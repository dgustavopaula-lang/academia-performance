const form = document.getElementById("formAluno");
const lista = document.getElementById("listaAlunos");
const busca = document.getElementById("busca");

let alunos = JSON.parse(localStorage.getItem("academiaPerformance")) || [];

function salvar() {
  localStorage.setItem("academiaPerformance", JSON.stringify(alunos));
}

function calcularStatus(vencimento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataVencimento = new Date(vencimento + "T00:00:00");
  const diferenca = Math.ceil(
    (dataVencimento - hoje) / (1000 * 60 * 60 * 24)
  );

  if (diferenca < 0) {
    return {
      classe: "vermelho",
      texto: "Vencido"
    };
  }

  if (diferenca <= 3) {
    return {
      classe: "amarelo",
      texto: "Vencendo"
    };
  }

  return {
    classe: "verde",
    texto: "Em dia"
  };
}

function formatarData(data) {
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatarValor(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function atualizarPainel() {
  let emDia = 0;
  let vencidos = 0;

  alunos.forEach(aluno => {
    const status = calcularStatus(aluno.vencimento);

    if (status.classe === "vermelho") {
      vencidos++;
    } else {
      emDia++;
    }
  });

  document.getElementById("totalAlunos").textContent = alunos.length;
  document.getElementById("emDia").textContent = emDia;
  document.getElementById("vencidos").textContent = vencidos;
}

function mostrarAlunos(filtro = "") {
  lista.innerHTML = "";

  const filtrados = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  if (filtrados.length === 0) {
    lista.innerHTML = "<p>Nenhum aluno encontrado.</p>";
  }

  filtrados.forEach(aluno => {
    const status = calcularStatus(aluno.vencimento);

    const div = document.createElement("div");
    div.className = "aluno";

    div.innerHTML = `
      <span
        class="status ${status.classe}"
        title="${status.texto}">
      </span>

      <div>
        <strong>${aluno.nome}</strong><br>
        <small>${aluno.telefone || "Sem telefone"}</small>
      </div>

      <div>
        ${formatarValor(aluno.valor)}
      </div>

      <div>
        ${formatarData(aluno.vencimento)}<br>
        <strong>${status.texto}</strong>
      </div>

      <button
        class="botao-pago"
        onclick="marcarPago(${aluno.id})">
        Marcar pago
      </button>
    `;

    lista.appendChild(div);
  });

  atualizarPainel();
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const aluno = {
    id: Date.now(),
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    valor: document.getElementById("valor").value,
    vencimento: document.getElementById("vencimento").value
  };

  alunos.push(aluno);

  salvar();
  mostrarAlunos();

  form.reset();
});

function marcarPago(id) {
  const aluno = alunos.find(a => a.id === id);

  if (!aluno) return;

  const data = new Date(aluno.vencimento + "T00:00:00");

  data.setMonth(data.getMonth() + 1);

  aluno.vencimento =
    data.getFullYear() +
    "-" +
    String(data.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(data.getDate()).padStart(2, "0");

  salvar();
  mostrarAlunos(busca.value);
}

busca.addEventListener("input", function() {
  mostrarAlunos(this.value);
});

mostrarAlunos();