export type ChatDirection = "in" | "out";
export type ChatMsgType = "text" | "photo" | "document";

export type ChatMessage = {
  id: string;
  conversationId: string;
  direction: ChatDirection;
  type: ChatMsgType;
  text?: string;
  createdAt: Date;
  deleted: boolean;
};

export type ChatPushEvent =
  | { type: "message"; conversationId: string; messageId: string }
  | { type: "delete"; conversationId: string; messageId: string }
  | { type: "read"; conversationId: string }
  | { type: "conversation_deleted"; conversationId: string };

type Listener = (event: ChatPushEvent) => void;

const MENU_BUTTONS = new Set(["info", "ask", "referral"]);

export function isOperatorText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return !MENU_BUTTONS.has(text.trim().toLowerCase());
}

export class SupportChat {
  private seq = 1;
  readonly messages = new Map<string, ChatMessage[]>();
  readonly hidden = new Set<string>();
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private publish(event: ChatPushEvent) {
    for (const listener of this.listeners) listener(event);
  }

  post(conversationId: string, direction: ChatDirection, type: ChatMsgType, text?: string): ChatMessage {
    if (this.hidden.has(conversationId)) throw new Error("conversation_hidden");
    const msg: ChatMessage = {
      id: `m_${this.seq++}`,
      conversationId,
      direction,
      type,
      text,
      createdAt: new Date(),
      deleted: false
    };
    const list = this.messages.get(conversationId) ?? [];
    list.push(msg);
    this.messages.set(conversationId, list);
    this.publish({ type: "message", conversationId, messageId: msg.id });
    return msg;
  }

  hide(conversationId: string) {
    this.hidden.add(conversationId);
  }

  unhide(conversationId: string) {
    this.hidden.delete(conversationId);
  }

  remove(conversationId: string, messageId: string) {
    const list = this.messages.get(conversationId) ?? [];
    const msg = list.find((row) => row.id === messageId);
    if (!msg) return;
    msg.deleted = true;
    this.publish({ type: "delete", conversationId, messageId });
  }

  markRead(conversationId: string) {
    this.publish({ type: "read", conversationId });
  }

  drop(conversationId: string) {
    this.messages.delete(conversationId);
    this.publish({ type: "conversation_deleted", conversationId });
  }

  inbox(): Array<{ conversationId: string; unreadIn: number; last?: ChatMessage }> {
    return [...this.messages.entries()].map(([conversationId, list]) => {
      const live = list.filter((row) => !row.deleted);
      return {
        conversationId,
        unreadIn: live.filter((row) => row.direction === "in").length,
        last: live.at(-1)
      };
    });
  }
}
