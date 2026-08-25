const form = document.getElementById("formAluno");
const lista = document.getElementById("listaAlunos");
const busca = document.getElementById("busca");

let alunos = JSON.parse(localStorage.getItem("academiaPerformance")) || [];

function salvar() {
  localStorage.setItem("academiaPerformance", JSON.stringify(alunos));
}

function dataValidaIso(data) {
  if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return false;
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const dataTeste = new Date(`${data}T00:00:00`);

  return (
    !Number.isNaN(dataTeste.getTime()) &&
    dataTeste.getFullYear() === ano &&
    dataTeste.getMonth() + 1 === mes &&
    dataTeste.getDate() === dia
  );
}

function normalizarData(valor) {
  if (!valor) return null;

  const texto = valor.trim();

  if (dataValidaIso(texto)) {
    return texto;
  }

  const partes = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);

  if (!partes) return null;

  const dia = partes[1].padStart(2, "0");
  const mes = partes[2].padStart(2, "0");
  const ano = partes[3].length === 2 ? `20${partes[3]}` : partes[3];
  const dataIso = `${ano}-${mes}-${dia}`;

  return dataValidaIso(dataIso) ? dataIso : null;
}

function calcularStatus(vencimento) {
  const dataNormalizada = normalizarData(vencimento);

  if (!dataNormalizada) {
    return {
      classe: "amarelo",
      texto: "Sem vencimento"
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataVencimento = new Date(`${dataNormalizada}T00:00:00`);
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
  const dataNormalizada = normalizarData(data);

  if (!dataNormalizada) {
    return "Sem vencimento";
  }

  const [ano, mes, dia] = dataNormalizada.split("-");
  return `${dia}/${mes}/${ano.slice(-2)}`;
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

    if (status.classe === "vermelho") vencidos++;
    if (status.classe === "verde") emDia++;
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
      <span class="status ${status.classe}" title="${status.texto}"></span>

      <div>
        <strong>${aluno.nome}</strong><br>
        <small>${aluno.telefone || "Sem telefone"}</small>
      </div>

      <div>${formatarValor(aluno.valor)}</div>

      <div>
        ${formatarData(aluno.vencimento)}<br>
        <strong>${status.texto}</strong>
      </div>

      <button class="botao-pago" onclick="marcarPago(${aluno.id})">
        Marcar pago
      </button>
    `;

    lista.appendChild(div);
  });

  atualizarPainel();
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const valor = document.getElementById("valor").value;
  const vencimentoDigitado = document.getElementById("vencimento").value;
  const vencimento = normalizarData(vencimentoDigitado);

  if (!nome || !valor || !vencimento) {
    alert("Preencha nome, mensalidade e vencimento no formato 10/10/26.");
    return;
  }

  alunos.push({
    id: Date.now(),
    nome,
    telefone,
    valor,
    vencimento
  });

  salvar();
  mostrarAlunos();
  form.reset();
});

function marcarPago(id) {
  const aluno = alunos.find(a => a.id === id);

  if (!aluno) return;

  const vencimento = normalizarData(aluno.vencimento);

  if (!vencimento) {
    alert("Este aluno não possui uma data de vencimento válida.");
    return;
  }

  const data = new Date(`${vencimento}T00:00:00`);
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