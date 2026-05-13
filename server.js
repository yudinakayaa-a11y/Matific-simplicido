const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Função auxiliar para criar pausas e simular comportamento humano
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/rodar-bot', async (req, res) => {
    const { ra, digito, senha } = req.body;

    try {
        // 1. Faz o login do estudante no sistema (Simulação HTTP)
        // Substitua 'plataforma.com' pela URL real de autenticação do Matific/escola
        const loginResponse = await axios.post('plataforma.com', {
            username: `${ra}${digito}`,
            password: senha
        });

        const token = loginResponse.data.token; 
        if (!token) {
            return res.status(401).json({ error: "RA ou Senha rejeitados pela plataforma." });
        }

        const headersAutenticacao = { 'Authorization': `Bearer ${token}` };

        // 2. Coleta as tarefas ativas do estudante
        // Substitua pelo endpoint real que lista os exercícios da conta
        const listaTarefas = await axios.get('plataforma.com', {
            headers: headersAutenticacao
        });

        const atividadesDisponiveis = listaTarefas.data.activities || [];

        if (atividadesDisponiveis.length === 0) {
            return res.json({ message: "Nenhuma atividade pendente encontrada nesta conta!" });
        }

        // Limita o robô para fazer o menor valor entre: 5 tarefas ou o total que ele tem disponível
        const totalParaFazer = Math.min(5, atividadesDisponiveis.length);
        let concluidasComSucesso = 0;

        // 3. Execução sequencial das atividades injetando as 5 estrelas
        for (let i = 0; i < totalParaFazer; i++) {
            const atividadeAtual = atividadesDisponiveis[i];
            const idDaAtividade = atividadeAtual.id; 

            // Requisição simulando a conclusão forçada com pontuação máxima
            // Substitua pelo endpoint correto onde o jogo salva a nota do aluno
            await axios.post('plataforma.com', {
                activity_id: idDaAtividade,
                stars: 5,
                score: 100,
                duration_seconds: 900 // Simulação de segurança de 15 minutos de resolução
            }, {
                headers: headersAutenticacao
            });

            concluidasComSucesso++;

            // Aguarda 3 segundos antes de pular para o próximo exercício para não dar erro de spam
            if (concluidasComSucesso < totalParaFazer) {
                await esperar(3000); 
            }
        }

        return res.json({ 
            message: `Automação concluída! Exatamente ${concluidasComSucesso} tarefas foram fechadas com 5 estrelas.` 
        });

    } catch (error) {
        console.error("Erro interno do Bot Cloud:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "O servidor falhou ao tentar processar as atividades." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor Cloud iniciado com sucesso na porta ${PORT}`));
