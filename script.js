const form = document.getElementById("formTarefa");
const lista = document.getElementById("listaTarefas");
const pesquisa = document.getElementById("pesquisa");
const filtroStatus = document.getElementById("filtroStatus");
const ordenacao = document.getElementById("ordenacao");
const btnTema = document.getElementById("btnTema");

// Mantém as tarefas salvas na versão anterior.
const CHAVE = "minhaRotinaTarefas";
const CHAVE_TEMA = "myQuestTema";

let tarefas = [];
let editandoId = null;

try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE));
    tarefas = Array.isArray(salvas) ? salvas : [];
} catch {
    tarefas = [];
}

function salvarDados() {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(tarefas));
    } catch {
        alert(
            "Não foi possível salvar no navegador. " +
            "As alterações serão mantidas apenas enquanto a página estiver aberta."
        );
    }
}

// Tema claro e escuro
function aplicarTema(escuro) {
    document.body.classList.toggle("tema-escuro", escuro);

    btnTema.textContent = escuro
        ? "☀️ Tema claro"
        : "🌙 Tema escuro";

    btnTema.setAttribute("aria-pressed", String(escuro));
}

try {
    aplicarTema(localStorage.getItem(CHAVE_TEMA) === "escuro");
} catch {
    aplicarTema(false);
}

btnTema.addEventListener("click", () => {
    const escuro = !document.body.classList.contains("tema-escuro");

    aplicarTema(escuro);

    try {
        localStorage.setItem(CHAVE_TEMA, escuro ? "escuro" : "claro");
    } catch {
        // A troca de tema funciona mesmo sem salvar a preferência.
    }
});

function formatarData(data) {
    if (!data) return "";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

function criarElemento(tag, texto, classe) {
    const elemento = document.createElement(tag);

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    if (classe) {
        elemento.className = classe;
    }

    return elemento;
}

function gerarId() {
    return globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cadastrarTarefa(evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    const prioridade = document.getElementById("prioridade").value;
    const status = document.getElementById("status").value;

    if (!nome || !data || !horario) {
        alert("Preencha os campos obrigatórios!");
        return;
    }

    const tarefa = {
        id: editandoId ?? gerarId(),
        nome,
        descricao,
        data,
        horario,
        prioridade,
        status
    };

    if (editandoId !== null) {
        tarefas = tarefas.map(item =>
            item.id === editandoId ? tarefa : item
        );
    } else {
        tarefas.push(tarefa);
    }

    salvarDados();
    cancelarEdicao();
    mostrarTarefas();
}

function cancelarEdicao() {
    editandoId = null;
    form.reset();

    document.getElementById("tituloFormulario").textContent =
        "Cadastrar Nova Tarefa";

    document.getElementById("btnSalvar").textContent =
        "Cadastrar Tarefa";

    document.getElementById("btnCancelar").hidden = true;
}

function editarTarefa(id) {
    const tarefa = tarefas.find(item => item.id === id);
    if (!tarefa) return;

    document.getElementById("nome").value = tarefa.nome;
    document.getElementById("descricao").value = tarefa.descricao;
    document.getElementById("data").value = tarefa.data;
    document.getElementById("horario").value = tarefa.horario;
    document.getElementById("prioridade").value = tarefa.prioridade;
    document.getElementById("status").value = tarefa.status;

    editandoId = id;

    document.getElementById("tituloFormulario").textContent =
        "Editar Tarefa";

    document.getElementById("btnSalvar").textContent =
        "Salvar Alterações";

    document.getElementById("btnCancelar").hidden = false;

    form.scrollIntoView({ behavior: "smooth" });
    document.getElementById("nome").focus({ preventScroll: true });
}

function excluirTarefa(id) {
    if (!confirm("Deseja realmente excluir esta tarefa?")) {
        return;
    }

    tarefas = tarefas.filter(tarefa => tarefa.id !== id);
    salvarDados();

    if (editandoId === id) {
        cancelarEdicao();
    }

    mostrarTarefas();
}

function concluirTarefa(id) {
    const tarefa = tarefas.find(item => item.id === id);

    if (tarefa) {
        tarefa.status = "concluida";

        if (editandoId === id) {
            document.getElementById("status").value = "concluida";
        }

        salvarDados();
        mostrarTarefas();
    }
}

function atualizarResumo() {
    document.getElementById("total").textContent = tarefas.length;

    document.getElementById("pendentes").textContent =
        tarefas.filter(t => t.status === "pendente").length;

    document.getElementById("andamento").textContent =
        tarefas.filter(t => t.status === "andamento").length;

    document.getElementById("concluidas").textContent =
        tarefas.filter(t => t.status === "concluida").length;
}

function adicionarBotao(container, texto, classe, acao) {
    const botao = criarElemento("button", texto, classe);

    botao.type = "button";
    botao.addEventListener("click", acao);
    container.appendChild(botao);
}

function mostrarTarefas() {
    lista.replaceChildren();

    const termo = pesquisa.value.trim().toLowerCase();
    const filtro = filtroStatus.value;

    const resultado = tarefas.filter(tarefa => {
        const correspondePesquisa =
            tarefa.nome.toLowerCase().includes(termo) ||
            tarefa.descricao.toLowerCase().includes(termo);

        const correspondeStatus =
            filtro === "todos" || tarefa.status === filtro;

        return correspondePesquisa && correspondeStatus;
    });

    const ordemPrioridade = { alta: 0, media: 1, baixa: 2 };
    const ordemStatus = { pendente: 0, andamento: 1, concluida: 2 };

    resultado.sort((a, b) => {
        if (ordenacao.value === "prioridade") {
            return ordemPrioridade[a.prioridade] -
                ordemPrioridade[b.prioridade];
        }

        if (ordenacao.value === "status") {
            return ordemStatus[a.status] - ordemStatus[b.status];
        }

        return `${a.data}T${a.horario}`.localeCompare(
            `${b.data}T${b.horario}`
        );
    });

    atualizarResumo();

    if (resultado.length === 0) {
        const mensagem = tarefas.length === 0
            ? "Nenhuma tarefa cadastrada."
            : "Nenhuma tarefa encontrada.";

        lista.appendChild(criarElemento("p", mensagem, "vazio"));
        return;
    }

    const nomesStatus = {
        pendente: "Pendente",
        andamento: "Em andamento",
        concluida: "Concluída"
    };

    const nomesPrioridade = {
        alta: "Alta",
        media: "Média",
        baixa: "Baixa"
    };

    resultado.forEach(tarefa => {
        const artigo = criarElemento("article", undefined, "tarefa");
        const topo = criarElemento("div", undefined, "tarefa-topo");

        topo.appendChild(criarElemento("h3", tarefa.nome));
        artigo.appendChild(topo);

        if (tarefa.descricao) {
            artigo.appendChild(criarElemento("p", tarefa.descricao));
        }

        artigo.appendChild(criarElemento(
            "p",
            `Prazo: ${formatarData(tarefa.data)} às ${tarefa.horario}`
        ));

        const etiquetas = criarElemento("div");

        etiquetas.appendChild(criarElemento(
            "span",
            `Prioridade ${nomesPrioridade[tarefa.prioridade]}`,
            `etiqueta ${tarefa.prioridade}`
        ));

        etiquetas.appendChild(criarElemento(
            "span",
            nomesStatus[tarefa.status],
            "etiqueta status"
        ));

        const prazo = new Date(`${tarefa.data}T${tarefa.horario}`);
        const atrasada =
            prazo < new Date() && tarefa.status !== "concluida";

        if (atrasada) {
            etiquetas.appendChild(
                criarElemento("span", "Atrasada", "etiqueta atrasada")
            );
        }

        artigo.appendChild(etiquetas);

        const acoes = criarElemento("div", undefined, "acoes");

        adicionarBotao(
            acoes,
            "Editar",
            "btn-editar",
            () => editarTarefa(tarefa.id)
        );

        adicionarBotao(
            acoes,
            "Excluir",
            "btn-excluir",
            () => excluirTarefa(tarefa.id)
        );

        if (tarefa.status !== "concluida") {
            adicionarBotao(
                acoes,
                "Concluir",
                "btn-concluir",
                () => concluirTarefa(tarefa.id)
            );
        }

        artigo.appendChild(acoes);
        lista.appendChild(artigo);
    });
}

form.addEventListener("submit", cadastrarTarefa);

document.getElementById("btnCancelar").addEventListener(
    "click",
    cancelarEdicao
);

pesquisa.addEventListener("input", mostrarTarefas);
filtroStatus.addEventListener("change", mostrarTarefas);
ordenacao.addEventListener("change", mostrarTarefas);

mostrarTarefas();

// Atualiza a indicação de atraso a cada minuto.
setInterval(mostrarTarefas, 60000);