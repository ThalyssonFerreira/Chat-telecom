"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
  Slider,
  Tooltip,
  Avatar,
  Divider,
  List,
} from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import RouterIcon from "@mui/icons-material/Router";
import BoltIcon from "@mui/icons-material/Bolt";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import PersonIcon from "@mui/icons-material/Person";
import TelegramIcon from "@mui/icons-material/Telegram";

type Msg = { role: "user" | "assistant"; content: string };

const TELEGRAM_GROUP_URL = "https://t.me/+g2B5UXLXiaU0MGFh";

const FEATURES_INTERNAL = [
  { icon: <WifiIcon />, title: "Suporte internet", desc: "Diagnóstico de lentidão, quedas e orientações de roteador." },
  { icon: <RouterIcon />, title: "Wi-Fi & Roteador", desc: "Troca de senha, posicionamento e boas práticas para melhor sinal." },
  { icon: <SupportAgentIcon />, title: "Atendimento 24/7", desc: "Respostas com IA e memória (Telegram e Web)." }
];

const INTENTS = [
  "Quais são os planos de internet?",
  "Minha internet está lenta, o que faço?",
  "Como trocar a senha do Wi-Fi?",
  "Qual o horário de atendimento?"
];

type WebSpeechRecognitionAlternative = { transcript: string };
type WebSpeechRecognitionResult = { 0: WebSpeechRecognitionAlternative; isFinal: boolean };
type WebSpeechRecognitionEvent = { resultIndex: number; results: WebSpeechRecognitionResult[] };
type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: WebSpeechRecognitionEvent) => void;
  onerror: ((this: WebSpeechRecognition, ev: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function cleanForTTS(s: string) {
  let t = s;
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`[^`]*`/g, " ");
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1");
  t = t.replace(/https?:\/\/\S+/g, " ");
  t = t.replace(/[@#*_~`>|=]|^-|\|/gm, " ");
  t = t.replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿçãõáéíóúâêîôûàèìòùüñÇÃÕÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÜÑ .,!?:;()]/g, " ");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<WebSpeechRecognition | null>(null);
  const [mikrotikMode, setMikrotikMode] = React.useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = React.useState<boolean>(true);
  const [ttsSpeaking, setTtsSpeaking] = React.useState<boolean>(false);
  const [ttsVolume, setTtsVolume] = React.useState<number>(100);

  React.useEffect(() => {
    const savedId = typeof window !== "undefined" ? localStorage.getItem("telecom_conversation_id") : null;
    if (savedId) setConversationId(savedId);
    const savedTts = typeof window !== "undefined" ? localStorage.getItem("telecom_tts_enabled") : null;
    if (savedTts !== null) setTtsEnabled(savedTts === "true");
    const savedVol = typeof window !== "undefined" ? localStorage.getItem("telecom_tts_volume") : null;
    if (savedVol !== null) setTtsVolume(Number(savedVol));
    const savedMode = typeof window !== "undefined" ? localStorage.getItem("telecom_domain_mode") : null;
    if (savedMode) setMikrotikMode(savedMode === "mikrotik");
  }, []);

  React.useEffect(() => {
    if (conversationId) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Web chat", domainMode: mikrotikMode ? "mikrotik" : "generic" })
        });
        const json = await res.json();
        setConversationId(json.id);
        localStorage.setItem("telecom_conversation_id", json.id);
      } catch {
        setError("Falha ao criar conversa");
      }
    })();
  }, [apiBase, conversationId, mikrotikMode]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("telecom_tts_enabled", String(ttsEnabled));
      localStorage.setItem("telecom_tts_volume", String(ttsVolume));
      localStorage.setItem("telecom_domain_mode", mikrotikMode ? "mikrotik" : "generic");
    }
    if (!ttsEnabled) {
      try { window.speechSynthesis?.cancel(); } catch {}
      setTtsSpeaking(false);
    }
  }, [ttsEnabled, ttsVolume, mikrotikMode]);

  const scrollToChat = () => {
    if (typeof window === "undefined") return;
    document.getElementById("chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  function toggleMic() { listening ? stopListening() : startListening(); }

  function startListening() {
    type SRConstructor = new () => WebSpeechRecognition;
    const w = window as typeof window & { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor; };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { setError("Seu navegador não suporta reconhecimento de voz."); return; }
    stopTTS();
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: WebSpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
      }
      if (finalTranscript) sendText(finalTranscript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopListening() { recognitionRef.current?.stop?.(); setListening(false); }

  function speak(text: string) {
    if (!("speechSynthesis" in window) || !ttsEnabled) return;
    try {
      const readable = cleanForTTS(text);
      if (!readable) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(readable);
      utter.lang = "pt-BR";
      utter.volume = Math.max(0, Math.min(1, ttsVolume / 100));
      utter.onstart = () => { setTtsSpeaking(true); if (listening) stopListening(); };
      utter.onend = () => setTtsSpeaking(false);
      utter.onerror = () => setTtsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {}
  }

  function stopTTS() { try { window.speechSynthesis?.cancel(); } catch {} setTtsSpeaking(false); }

  async function sendText(text: string) {
    if (!conversationId || !text.trim()) return;
    setLoading(true); setError(null);
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text, domainMode: mikrotikMode ? "mikrotik" : "generic" })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const answer: string = json.answer ?? "Sem resposta.";
      setMessages((p) => [...p, { role: "assistant", content: answer }]);
      speak(answer);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const MsgBubble = ({ m }: { m: Msg }) => {
    const isUser = m.role === "user";
    return (
      <Stack direction="row" spacing={1} justifyContent={isUser ? "flex-end" : "flex-start"}>
        {!isUser && <Avatar sx={{ bgcolor: "primary.main" }}><SupportAgentIcon /></Avatar>}
        <Box
          sx={{
            maxWidth: "75%",
            p: 1.25,
            px: 1.75,
            borderRadius: 3,
            borderTopLeftRadius: isUser ? 3 : 0,
            borderTopRightRadius: isUser ? 0 : 3,
            color: isUser ? "grey.900" : "text.primary",
            background: isUser
              ? "linear-gradient(135deg, #e2f2ff, #c7e6ff)"
              : "linear-gradient(135deg, rgba(14,165,255,0.12), rgba(124,58,237,0.10))",
            border: "1px solid rgba(148,163,184,0.18)",
            whiteSpace: "pre-wrap",
          }}
        >
          <Typography variant="body2">{m.content}</Typography>
        </Box>
        {isUser && <Avatar sx={{ bgcolor: "grey.700" }}><PersonIcon /></Avatar>}
      </Stack>
    );
  };

  return (
    <Stack spacing={6}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <Chip label="IA aplicada a telecom" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        <Typography variant="h2" sx={{ wordBreak: "break-word" }}>
          Atenda clientes com o <Box component="span" sx={{ color: "primary.main" }}>Tatione Telecom bot</Box>
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth={720}>
          Chat inteligente especialista em <b>planos</b>, <b>suporte de internet</b> e muito mais.
          Integração com Telegram, voz no navegador e memória de conversas.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button variant="contained" size="large" startIcon={<SupportAgentIcon />} onClick={scrollToChat}>
            Abrir chat agora
          </Button>
          <Button variant="outlined" size="large" startIcon={<BoltIcon />} onClick={scrollToChat}>
            Testar voz
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          alignItems: "stretch",
        }}
      >
        <Card
          sx={{
            height: "100%",
            cursor: "pointer",
            textDecoration: "none",
            color: "inherit",
            "& *": { textDecoration: "none" }
          }}
          component="a"
          href={TELEGRAM_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box sx={{ fontSize: 28, color: "primary.main" }}><TelegramIcon /></Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Grupo no Telegram</Typography>
                <Typography variant="body2" color="text.secondary">Entre no grupo para novidades e suporte rápido.</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {FEATURES_INTERNAL.map((f, i) => (
          <Card key={i} sx={{ height: "100%", cursor: "pointer" }} onClick={scrollToChat}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ fontSize: 28, color: "primary.main" }}>{f.icon}</Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box id="chat">
        <Stack spacing={2} mb={1}>
          <Typography variant="h4" fontWeight={800}>Tatione Telecom bot</Typography>
          <Typography variant="body1" color="text.secondary">
            Especialista em telecom: planos, suporte de internet, Wi-Fi e muito mais.
          </Typography>
          <FormControlLabel
            control={<Switch checked={mikrotikMode} onChange={(e) => setMikrotikMode(e.target.checked)} />}
            label="Modo especialista MikroTik"
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {INTENTS.map((q) => (
              <Chip key={q} label={q} onClick={() => sendText(q)} sx={{ mb: 1 }} />
            ))}
          </Stack>
        </Stack>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel
                    control={<Switch checked={ttsEnabled} onChange={(e) => setTtsEnabled(e.target.checked)} />}
                    label="Ler resposta (voz)"
                  />
                  <Box width={180} display="flex" alignItems="center" gap={1}>
                    {ttsEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                    <Slider
                      size="small" min={0} max={100} value={ttsVolume}
                      onChange={(_, v) => setTtsVolume(v as number)} aria-label="Volume da voz"
                    />
                  </Box>
                  <Tooltip title="Parar fala atual">
                    <span>
                      <Button variant="outlined" startIcon={<StopIcon />} onClick={() => { try { window.speechSynthesis?.cancel(); } catch {} setTtsSpeaking(false); }} disabled={!ttsSpeaking}>
                        Parar fala
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Dica: use o microfone para ditar perguntas.
                </Typography>
              </Stack>

              <Divider />

              <List dense sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {messages.map((m, i) => <MsgBubble key={i} m={m} />)}
              </List>

              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth size="small" placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(input); }
                  }}
                />
                <Tooltip title={listening ? "Parar de ouvir" : "Falar"}>
                  <IconButton onClick={() => (listening ? stopListening() : startListening())} aria-label="microfone" color={listening ? "error" : "default"}>
                    {listening ? <StopIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
                <Button variant="contained" onClick={() => sendText(input)} disabled={loading || !conversationId}>
                  Enviar
                </Button>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
