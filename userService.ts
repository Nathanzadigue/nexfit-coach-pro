import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/firebase/config";

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "coach";
  createdAt?: any;
};

export async function createUserProfile(
  uid: string,
  email: string
) {
  const ref = doc(db, "users", uid);

  await setDoc(ref, {
    email,
    firstName: "",
    lastName: "",
    role: "client",
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: uid,
    ...(snap.data() as Omit<UserProfile, "id">),
  };
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
}
