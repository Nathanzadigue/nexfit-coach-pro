import { Booking } from "../types";
import { bookings as initialBookings } from "../data";

let bookingState: Booking[] = [...initialBookings];

export function getBookings() {
  return bookingState;
}

export function createBooking(coachId: string, clientId: string) {
  const newBooking: Booking = {
    id: `b${Date.now()}`,
    coachId,
    clientId,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  bookingState = [...bookingState, newBooking];

  return newBooking;
}
