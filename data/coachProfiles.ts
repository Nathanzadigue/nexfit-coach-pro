import { CoachProfile } from "../types";

export const coachProfiles: CoachProfile[] = [
  {
    id: "c1",
    userId: "u2",
    bio: "Coach diplômé, spécialisé en musculation et remise en forme.",
    specialty: "Musculation",
    pricePerSession: 50,
    city: "Paris",
    isActive: true,
  },
  {
    id: "c2",
    userId: "u3",
    bio: "Professeure de yoga, mobilité et relaxation.",
    specialty: "Yoga",
    pricePerSession: 40,
    city: "Lyon",
    isActive: true,
  },
];
