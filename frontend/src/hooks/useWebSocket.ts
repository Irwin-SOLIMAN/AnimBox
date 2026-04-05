import { useEffect, useRef, useState } from 'react'
import { Client, type IFrame } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// Dérive l'URL WebSocket depuis VITE_API_URL (ex: http://localhost:8080/api → http://localhost:8080)
const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const WS_BASE = apiUrl ? apiUrl.replace(/\/api$/, '') : 'http://localhost:8080'

interface UseWebSocketOptions<T> {
  topic: string
  onMessage: (data: T) => void
  onError?: (message: string) => void
  onConnect?: (client: Client, frame: IFrame) => void
}

interface UseWebSocketReturn {
  send: (destination: string, body: unknown) => void
  isConnected: boolean
}

function useWebSocket<T>({ topic, onMessage, onError, onConnect }: UseWebSocketOptions<T>): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!topic) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      reconnectDelay: 5000,

      onConnect: (frame: IFrame) => {
        setIsConnected(true)
        client.subscribe(topic, (message) => {
          try {
            onMessage(JSON.parse(message.body) as T)
          } catch {
            onError?.('Erreur de parsing du message WebSocket')
          }
        })
        onConnect?.(client, frame)
      },

      onDisconnect: () => {
        setIsConnected(false)
      },

      onStompError: (frame) => {
        onError?.(frame.headers['message'] ?? 'Erreur WebSocket')
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [topic]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = (destination: string, body: unknown) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      })
    }
  }

  return { send, isConnected }
}

export default useWebSocket
