export type BotUpdate =
  | { kind: "command"; chatId: string; from: string; command: string; args: string }
  | { kind: "callback"; chatId: string; from: string; data: string }
  | { kind: "text"; chatId: string; from: string; text: string }
  | { kind: "webapp"; chatId: string; from: string; payload: string };

export type BotReply = { chatId: string; text: string; buttons?: string[][] };

const START = `Register as a courier. Open the Mini App, send documents, and wait for partner confirmation.`;

export function parseCommand(text: string): { command: string; args: string } | null {
  const match = text.trim().match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?(?:\s+([\s\S]+))?$/);
  if (!match) return null;
  return { command: match[1].toLowerCase(), args: match[2]?.trim() ?? "" };
}

export function routeBotUpdate(update: BotUpdate): BotReply {
  if (update.kind === "command") {
    if (update.command === "start") {
      return { chatId: update.chatId, text: START, buttons: [["Open Mini App"], ["Status", "Support"]] };
    }
    if (update.command === "status") {
      return { chatId: update.chatId, text: "Open the Mini App to see application status." };
    }
    if (update.command === "help") {
      return { chatId: update.chatId, text: "/start /status /help" };
    }
    return { chatId: update.chatId, text: "Unknown command." };
  }
  if (update.kind === "callback") {
    if (update.data === "status") return routeBotUpdate({ kind: "command", chatId: update.chatId, from: update.from, command: "status", args: "" });
    if (update.data === "support") return { chatId: update.chatId, text: "Write your question. An operator will reply in this chat." };
    return { chatId: update.chatId, text: "Ignored callback." };
  }
  if (update.kind === "webapp") {
    return { chatId: update.chatId, text: "Mini App data received. Application queued." };
  }
  if (/^(info|ask|referral)$/i.test(update.text.trim())) {
    return { chatId: update.chatId, text: "Menu shortcuts stay in the Mini App." };
  }
  return { chatId: update.chatId, text: "Forwarded to support." };
}
