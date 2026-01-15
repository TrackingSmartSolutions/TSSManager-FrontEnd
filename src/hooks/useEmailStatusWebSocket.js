import { useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { API_BASE_URL } from '../components/Config/Config';

export const useEmailStatusWebSocket = (tratoId, onStatusUpdate) => {
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!tratoId) return;

    const wsUrl = `${API_BASE_URL}/ws`;
    const socket = new SockJS(wsUrl);
    
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP:', str);
      }
    });

    stompClient.onConnect = () => {      
      stompClient.subscribe('/topic/email-status', (message) => {
        const data = JSON.parse(message.body);
        
        // Solo actualizar si es del trato actual
        if (data.tratoId === parseInt(tratoId)) {
          onStatusUpdate(data);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('Error WebSocket:', frame);
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current) {
        console.log('Desconectando WebSocket');
        stompClientRef.current.deactivate();
      }
    };
  }, [tratoId, onStatusUpdate]);

  return stompClientRef.current;
};