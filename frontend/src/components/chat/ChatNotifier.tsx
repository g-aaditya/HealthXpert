import React, { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ChatNotifier: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [targetConsultationId, setTargetConsultationId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('New message received');

  useEffect(() => {
    let timer: any;
    const pollUnread = async () => {
      try {
        const resp = await axios.get('/chat/consultations/unread-summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const total = resp.data?.total_unread || 0;
        const list = resp.data?.consultations || [];
        if (total > 0 && list.length > 0) {
          setTargetConsultationId(list[0].consultation_id);
          setMessage(`${total} unread message${total > 1 ? 's' : ''}`);
          setOpen(true);
        }
      } catch {
        // ignore errors silently
      }
    };
    if (user && token) {
      timer = setInterval(pollUnread, 10000);
    }
    return () => timer && clearInterval(timer);
  }, [user, token]);

  return (
    <Snackbar open={open} onClose={() => setOpen(false)} autoHideDuration={8000}>
      <Alert
        severity="info"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              if (targetConsultationId) navigate(`/chat/${targetConsultationId}`);
              setOpen(false);
            }}
          >
            Open Chat
          </Button>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ChatNotifier;