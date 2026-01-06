import React, { createContext, useContext, useMemo, useState } from "react";
import { Booking } from "../types";
import { bookings as initialBookings } from "../data";

type BookingContextValue = {
  bookings: Booking[];
  createBooking: (coachId: string, clientId: string, date: string) => Booking;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([...initialBookings]);

  const value = useMemo<BookingContextValue>(() => {
    return {
      bookings,

      createBooking: (coachId, clientId, date) => {
        // 🔴 RÈGLE MÉTIER : pas de double réservation
        const alreadyBooked = bookings.some(
          (b) =>
            b.coachId === coachId &&
            b.date === date &&
            b.status !== "cancelled"
        );

        if (alreadyBooked) {
          throw new Error("Créneau déjà réservé");
        }

        const newBooking: Booking = {
          id: `b${Date.now()}`,
          coachId,
          clientId,
          date,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        setBookings((prev) => [...prev, newBooking]);
        return newBooking;
      },
    };
  }, [bookings]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBookings must be used within BookingProvider");
  }
  return ctx;
}
