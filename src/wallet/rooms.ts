export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function cashierRoom(): string {
  return "cashier";
}

export function supportRoom(ticketId: string): string {
  return `support:${ticketId}`;
}
