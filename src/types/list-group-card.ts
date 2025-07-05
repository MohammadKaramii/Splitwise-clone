export interface ListState {
  data: {
    message: string;
    cost: number;
    createdAt: string;
    id: string;
    whoPaid: string;
    sharedWith: string[];
  };
  members: string[];
  totalAmount: number;
}

export interface Spent {
  id: string;
}
