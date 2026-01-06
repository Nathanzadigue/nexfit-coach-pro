import { User } from "../types";

export const users: User[] = [
  {
    id: "u1",
    email: "client@test.com",
    firstName: "Jean",
    lastName: "Dupont",
    role: "client",
    createdAt: "2024-01-01",
  },
  {
    id: "u2",
    email: "coach1@test.com",
    firstName: "Alex",
    lastName: "Martin",
    role: "coach",
    createdAt: "2024-01-01",
  },
  {
    id: "u3",
    email: "coach2@test.com",
    firstName: "Sarah",
    lastName: "Lopez",
    role: "coach",
    createdAt: "2024-01-01",
  },
];
