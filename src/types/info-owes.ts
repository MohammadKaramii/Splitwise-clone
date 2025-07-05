export interface Paid {
  whoPaid: string;
  toWho: string;
  groupName: string;
  groupId?: string; // Add unique group identifier (optional for backwards compatibility)
  howMuchPaid: number;
}
