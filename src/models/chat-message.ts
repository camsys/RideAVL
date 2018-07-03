export class ChatMessage {
  id: string;
  sender_id: number;
  driver_id: number;
  provider_id: number;
  body: string;
  sender_name: string;
  status: string;
  created_at: number | string;
}