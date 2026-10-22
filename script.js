const form = document.getElementById("formTarefa");
const lista = document.getElementById("listaTarefas");
const pesquisa = document.getElementById("pesquisa");
const filtroStatus = document.getElementById("filtroStatus");
const ordenacao = document.getElementById("ordenacao");
const btnTema = document.getElementById("btnTema");

const horarioNotificacao =
    document.getElementById("horarioNotificacao");

const btnNotificacao =
    document.getElementById("btnNotificacao");

const statusNotificacao =
    document.getElementById("statusNotificacao");

// Mantém a chave anterior para preservar tarefas já cadastradas.
const CHAVE = "minhaRotinaTarefas";
const CHAVE_TEMA = "myQuestTema";
const CHAVE_LEMBRETE = "myQuestLembreteDiario";

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

let tarefas = [];
let editandoId = null;
let verificandoLembrete = false;

let lembrete = {
    ativo: false,
    horario: "08:00",
    ultimaData: ""
};

// Carregamento dos dados

try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE));

    if (Array.isArray(salvas)) {
        tarefas = salvas
            .filter(item =>
                item &&
                typeof item.nome === "string" &&
                typeof item.data === "string" &&
                typeof item.horario === "string" &&
                Object.hasOwn(nomesPrioridade, item.prioridade) &&
                Object.hasOwn(nomesStatus, item.status)
            )
            .map(item => ({
                ...item,
                id: item.id ?? gerarId(),
                descricao:
                    typeof item.descricao === "string"
                        ? item.descricao
                        : "",
                repetirDiariamente: item.repetirDiariamente === true
            }));
    }
} catch {
    tarefas = [];
}

try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_LEMBRETE));

    if (salvo && typeof salvo === "object") {
        lembrete.ativo = salvo.ativo === true;

        if (
            typeof salvo.horario === "string" &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(salvo.horario)
        ) {
            lembrete.horario = salvo.horario;
        }

        if (typeof salvo.ultimaData === "string") {
            lembrete.ultimaData = salvo.ultimaData;
        }
    }
} catch {
    // Mantém as configurações iniciais.
}

horarioNotificacao.value = lembrete.horario;

// Funções auxiliares

function gerarId() {
    return globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function obterDataLocal(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

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

function salvarLembrete() {
    try {
        localStorage.setItem(
            CHAVE_LEMBRETE,
            JSON.stringify(lembrete)
        );
    } catch {
        statusNotificacao.textContent =
            "A configuração funcionará apenas enquanto esta página estiver aberta.";
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
    const escuro =
        !document.body.classList.contains("tema-escuro");

    aplicarTema(escuro);

    try {
        localStorage.setItem(
            CHAVE_TEMA,
            escuro ? "escuro" : "claro"
        );
    } catch {
        // O tema continua funcionando sem salvar a preferência.
    }
});

// Cadastro e edição

function cadastrarTarefa(evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const descricao =
        document.getElementById("descricao").value.trim();

    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    const prioridade = document.getElementById("prioridade").value;
    const status = document.getElementById("status").value;

    const repetirDiariamente =
        document.getElementById("repetirDiariamente").checked;

    if (!nome || !data || !horario) {
        alert("Preencha os campos obrigatórios!");
        return;
    }

    if (repetirDiariamente && status === "concluida") {
        alert(
            "Para uma tarefa diária, escolha Pendente ou Em andamento. " +
            "Depois, use o botão Concluir para agendar o próximo dia."
        );
        return;
    }

    const tarefa = {
        id: editandoId ?? gerarId(),
        nome,
        descricao,
        data,
        horario,
        prioridade,
        status,
        repetirDiariamente
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

    document.getElementById("repetirDiariamente").checked =
        tarefa.repetirDiariamente === true;

    editandoId = id;

    document.getElementById("tituloFormulario").textContent =
        "Editar Tarefa";

    document.getElementById("btnSalvar").textContent =
        "Salvar Alterações";

    document.getElementById("btnCancelar").hidden = false;

    form.scrollIntoView({ behavior: "smooth" });

    document.getElementById("nome").focus({
        preventScroll: true
    });
}

function excluirTarefa(id) {
    if (!confirm("Deseja realmente excluir esta tarefa?")) {
        return;
    }

    tarefas = tarefas.filter(tarefa => tarefa.id !== id);

    if (editandoId === id) {
        cancelarEdicao();
    }

    salvarDados();
    mostrarTarefas();
}

// Conclusão e repetição diária

function concluirTarefa(id) {
    const tarefa = tarefas.find(item => item.id === id);

    if (!tarefa || tarefa.status === "concluida") return;

    if (tarefa.repetirDiariamente) {
        const [ano, mes, dia] = tarefa.data.split("-").map(Number);
        const proximaData = new Date(ano, mes - 1, dia, 12);

        proximaData.setDate(proximaData.getDate() + 1);

        const hoje = new Date();
        hoje.setHours(12, 0, 0, 0);

        // Evita manter a próxima ocorrência no passado ou hoje.
        if (proximaData <= hoje) {
            proximaData.setTime(hoje.getTime());
            proximaData.setDate(proximaData.getDate() + 1);
        }

        tarefa.data = obterDataLocal(proximaData);
        tarefa.status = "pendente";
    } else {
        tarefa.status = "concluida";
    }

    if (editandoId === id) {
        document.getElementById("data").value = tarefa.data;
        document.getElementById("status").value = tarefa.status;
    }

    salvarDados();
    mostrarTarefas();
}

// Exibição das tarefas

function atualizarResumo() {
    document.getElementById("total").textContent =
        tarefas.length;

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

    const ordemPrioridade = {
        alta: 0,
        media: 1,
        baixa: 2
    };

    const ordemStatus = {
        pendente: 0,
        andamento: 1,
        concluida: 2
    };

    resultado.sort((a, b) => {
        const porData = `${a.data}T${a.horario}`.localeCompare(
            `${b.data}T${b.horario}`
        );

        if (ordenacao.value === "prioridade") {
            return (
                ordemPrioridade[a.prioridade] -
                ordemPrioridade[b.prioridade]
            ) || porData;
        }

        if (ordenacao.value === "status") {
            return (
                ordemStatus[a.status] -
                ordemStatus[b.status]
            ) || porData;
        }

        return porData;
    });

    atualizarResumo();

    if (resultado.length === 0) {
        const mensagem = tarefas.length === 0
            ? "Nenhuma tarefa cadastrada."
            : "Nenhuma tarefa encontrada.";

        lista.appendChild(
            criarElemento("p", mensagem, "vazio")
        );

        return;
    }

    resultado.forEach(tarefa => {
        const artigo = criarElemento(
            "article",
            undefined,
            "tarefa"
        );

        const topo = criarElemento(
            "div",
            undefined,
            "tarefa-topo"
        );

        topo.appendChild(criarElemento("h3", tarefa.nome));
        artigo.appendChild(topo);

        if (tarefa.descricao) {
            artigo.appendChild(
                criarElemento("p", tarefa.descricao)
            );
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

        const prazo = new Date(
            `${tarefa.data}T${tarefa.horario}`
        );

        if (
            prazo < new Date() &&
            tarefa.status !== "concluida"
        ) {
            etiquetas.appendChild(criarElemento(
                "span",
                "Atrasada",
                "etiqueta atrasada"
            ));
        }

        if (tarefa.repetirDiariamente) {
            etiquetas.appendChild(criarElemento(
                "span",
                "🔁 Todos os dias",
                "etiqueta recorrente"
            ));
        }

        artigo.appendChild(etiquetas);

        const acoes = criarElemento(
            "div",
            undefined,
            "acoes"
        );

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
                tarefa.repetirDiariamente
                    ? "Concluir e agendar próximo dia"
                    : "Concluir",
                "btn-concluir",
                () => concluirTarefa(tarefa.id)
            );
        }

        artigo.appendChild(acoes);
        lista.appendChild(artigo);
    });
}

// Lembrete diário

function notificacoesPermitidas() {
    return (
        "Notification" in window &&
        Notification.permission === "granted"
    );
}

function atualizarInterfaceLembrete() {
    const ativo = lembrete.ativo && notificacoesPermitidas();

    btnNotificacao.textContent = ativo
        ? "Desativar lembrete diário"
        : "Ativar lembrete diário";

    btnNotificacao.setAttribute(
        "aria-pressed",
        String(ativo)
    );

    statusNotificacao.textContent = ativo
        ? `Lembrete ativado para ${lembrete.horario}. Mantenha o MyQuest aberto.`
        : "Lembrete desativado.";
}

btnNotificacao.addEventListener("click", async () => {
    if (lembrete.ativo && notificacoesPermitidas()) {
        lembrete.ativo = false;

        atualizarInterfaceLembrete();
        salvarLembrete();
        return;
    }

    if (!("Notification" in window)) {
        statusNotificacao.textContent =
            "Este navegador não oferece suporte a notificações.";
        return;
    }

    if (!window.isSecureContext) {
        statusNotificacao.textContent =
            "Abra o MyQuest por HTTPS ou localhost para permitir notificações.";
        return;
    }

    if (!horarioNotificacao.value) {
        statusNotificacao.textContent =
            "Escolha um horário para o lembrete.";
        return;
    }

    btnNotificacao.disabled = true;

    try {
        let permissao = Notification.permission;

        if (permissao === "default") {
            permissao = await Notification.requestPermission();
        }

        if (permissao !== "granted") {
            lembrete.ativo = false;
            salvarLembrete();

            statusNotificacao.textContent =
                "Permita as notificações nas configurações do navegador.";
            return;
        }

        lembrete.ativo = true;
        lembrete.horario = horarioNotificacao.value;

        atualizarInterfaceLembrete();
        salvarLembrete();
        verificarLembrete();
    } catch {
        statusNotificacao.textContent =
            "Não foi possível ativar as notificações neste navegador.";
    } finally {
        btnNotificacao.disabled = false;
    }
});

horarioNotificacao.addEventListener("change", () => {
    if (!horarioNotificacao.value) return;

    lembrete.horario = horarioNotificacao.value;

    atualizarInterfaceLembrete();
    salvarLembrete();
    verificarLembrete();
});

function verificarLembrete() {
    if (
        verificandoLembrete ||
        !lembrete.ativo ||
        !notificacoesPermitidas()
    ) {
        return;
    }

    const agora = new Date();
    const hoje = obterDataLocal(agora);

    const horarioAtual =
        `${String(agora.getHours()).padStart(2, "0")}:` +
        `${String(agora.getMinutes()).padStart(2, "0")}`;

    if (
        horarioAtual < lembrete.horario ||
        lembrete.ultimaData === hoje
    ) {
        return;
    }

    verificandoLembrete = true;

    try {
        // Considera um lembrete já enviado por outra aba.
        try {
            const salvo = JSON.parse(
                localStorage.getItem(CHAVE_LEMBRETE)
            );

            if (salvo?.ultimaData === hoje) {
                lembrete.ultimaData = hoje;
                return;
            }
        } catch {
            // Continua com a configuração em memória.
        }

        const abertas = tarefas.filter(
            tarefa => tarefa.status !== "concluida"
        ).length;

        const mensagem = abertas > 0
            ? `Você tem ${abertas} tarefa(s) não concluída(s). Confira seus prazos!`
            : "Que tal conferir sua rotina e planejar suas próximas tarefas?";

        const notificacao = new Notification(
            "MyQuest — Lembrete diário",
            {
                body: mensagem,
                tag: "myquest-lembrete-diario"
            }
        );

        notificacao.onclick = () => {
            window.focus();

            lista.scrollIntoView({
                behavior: "smooth"
            });

            notificacao.close();
        };

        lembrete.ultimaData = hoje;
        salvarLembrete();
    } catch {
        statusNotificacao.textContent =
            "Não foi possível exibir o lembrete neste navegador.";
    } finally {
        verificandoLembrete = false;
    }
}

// Eventos

form.addEventListener("submit", cadastrarTarefa);

document.getElementById("btnCancelar").addEventListener(
    "click",
    cancelarEdicao
);

pesquisa.addEventListener("input", mostrarTarefas);
filtroStatus.addEventListener("change", mostrarTarefas);
ordenacao.addEventListener("change", mostrarTarefas);

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        mostrarTarefas();
        atualizarInterfaceLembrete();
        verificarLembrete();
    }
});

// Inicialização

mostrarTarefas();
atualizarInterfaceLembrete();
verificarLembrete();

setInterval(verificarLembrete, 30000);
setInterval(mostrarTarefas, 60000);
