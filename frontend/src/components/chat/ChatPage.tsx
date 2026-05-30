import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  AttachFile,
  LocalHospital,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Message {
  id: number;
  consultation_id: number;
  sender_type: string;
  sender_id: number;
  message: string;
  created_at: string;
}

interface ConsultationData {
  id: number;
  patient_id: number;
  doctor_id: number;
  symptoms: string;
  predicted_disease?: string;
  diagnosis?: string;
  prescription?: string;
  status: string;
  created_at: string;
  updated_at: string;
  patient?: any;
  doctor?: any;
}

const ChatPage: React.FC = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [consultationData, setConsultationData] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [polling, setPolling] = useState<boolean>(true);

  // Fetch consultation data and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch consultation details
        const consultationResponse = await axios.get(`/chat/consultation/${consultationId}`);
        setConsultationData(consultationResponse.data?.consultation || consultationResponse.data);

        // Fetch messages (align with backend route)
        const messagesResponse = await axios.get(`/chat/consultation/${consultationId}/messages`);
        setMessages(messagesResponse.data?.messages || messagesResponse.data);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      fetchData();
    }
  }, [consultationId]);

  const deriveKeyFromPassphrase = async (passphrase: string) => {
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('healthxpert_salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const encryptMessage = async (plaintext: string, passphrase: string) => {
    const key = await deriveKeyFromPassphrase(passphrase);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipher = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );
    const ivB64 = btoa(String.fromCharCode(...Array.from(iv)));
    const cipherB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(cipher))));
    return `enc:v1:${ivB64}:${cipherB64}`;
  };

  const decryptMessage = async (payload: string, passphrase: string) => {
    try {
      if (!payload.startsWith('enc:v1:')) return payload;
      const [, , ivB64, cipherB64] = payload.split(':');
      const iv = new Uint8Array(atob(ivB64).split('').map(c => c.charCodeAt(0)));
      const cipherBytes = new Uint8Array(atob(cipherB64).split('').map(c => c.charCodeAt(0)));
      const key = await deriveKeyFromPassphrase(passphrase);
      const plainBuf = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
      return new TextDecoder().decode(plainBuf);
    } catch {
      return 'Encrypted message — set correct key to view';
    }
  };

  useEffect(() => {
    let timer: any;
    const poll = async () => {
      try {
        const messagesResponse = await axios.get(`/chat/consultation/${consultationId}/messages`);
        setMessages(messagesResponse.data?.messages || messagesResponse.data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    if (consultationId && polling) {
      timer = setInterval(poll, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [consultationId, polling]);

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const finalText = encryptionKey
        ? await encryptMessage(message.trim(), encryptionKey)
        : message.trim();

      const response = await axios.post(`/chat/consultation/${consultationId}/messages`, {
        message: finalText,
      });

      const newMsg = response.data?.chat_message || response.data;
      setMessages(prev => [...prev, newMsg]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!consultationData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Consultation not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <LocalHospital sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              {user?.user_type === 'patient'
                ? `Doctor (ID: ${consultationData?.doctor_id})`
                : `Patient (ID: ${consultationData?.patient_id})`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Consultation #{consultationData?.id}
            </Typography>
          </Box>
          <Chip
            label={consultationData?.status || 'pending'}
            color={consultationData?.status === 'completed' ? 'success' : 'warning'}
            size="small"
          />
        </Toolbar>
      </AppBar>

      {/* Patient Info Panel (for doctors) */}
      {user?.user_type === 'doctor' && consultationData && (
        <Paper sx={{ m: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Patient Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Symptoms:</strong> {consultationData.symptoms}
          </Typography>
          {consultationData.predicted_disease && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>AI Prediction:</strong> {consultationData.predicted_disease}
            </Typography>
          )}
          {consultationData.diagnosis && (
            <Typography variant="body2">
              <strong>Diagnosis:</strong> {consultationData.diagnosis}
            </Typography>
          )}
        </Paper>
      )}

      {/* Optional Encryption Settings Panel */}
      <Paper sx={{ m: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Encryption Key (shared passphrase)"
            value={encryptionKey}
            onChange={(e) => setEncryptionKey(e.target.value)}
            size="small"
          />
          <Button variant="outlined" onClick={() => setPolling(p => !p)}>
            {polling ? 'Stop Live Updates' : 'Start Live Updates'}
          </Button>
        </Box>
      </Paper>

      {/* Chat Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.sender_type === user?.user_type ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: msg.sender_type === user?.user_type ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: msg.sender_type === 'doctor' ? 'primary.main' : 'secondary.main',
                  }}
                >
                  {msg.sender_type === 'doctor' ? 'D' : 'P'}
                </Avatar>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: msg.sender_type === user?.user_type ? 'primary.main' : 'grey.100',
                    color: msg.sender_type === user?.user_type ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">
                    {msg.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Message Input */}
      <Paper sx={{ p: 2, m: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <IconButton color="primary">
            <AttachFile />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            disabled={sending}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            {sending ? <CircularProgress size={20} /> : <Send />}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatPage;