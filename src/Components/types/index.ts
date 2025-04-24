export interface Todo {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  userId: string;
}

export interface User {
  id: string;
  email: string;
}