import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Formato de mensagens inválido.' });
  }

  const MODELO_CHAT = 'openai/gpt-oss-20b';

  console.log('\n===========================================');
  console.log('>>> [REQUISIÇÃO RECEBIDA DO FLUTTER]');
  console.log(`>>> Conectando com o modelo: "${MODELO_CHAT}"`);
  console.log('===========================================');

  try {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: MODELO_CHAT,
    });

    console.log('✅ RESPOSTA GERADA COM SUCESSO!');
    const reply = completion.choices[0]?.message?.content || 'Sem resposta da IA.';

    let medicationData = null;

    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action === 'add_medication') {
          medicationData = {
            id: Date.now().toString(),
            name: parsed.name,
            schedule: parsed.schedule,
            stock: Number(parsed.stock) || 0,
            dailyDose: Number(parsed.dailyDose) || 1,
          };
        }
      }
    } catch (e) {
    }

    if (medicationData) {
      const parsedJson = JSON.parse(reply.match(/\{[\s\S]*\}/)[0]);
      return res.json({
        response: parsedJson.reply || `Medicamento ${medicationData.name} cadastrado com sucesso!`,
        medication: medicationData,
      });
    }

    res.json({ response: reply });

  } catch (error) {
    console.error('❌ ERRO NA CHAMADA GROQ:', error.message);
    res.status(500).json({ error: 'Erro interno ao processar a resposta da IA.' });
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Servidor GlicoCare rodando na porta ${port}!`);
  console.log('Aguardando mensagens do Flutter...\n');
});