import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCSessionDescription,
  RTCIceCandidate,
} from "react-native-webrtc";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type CallDoc = {
  callerId: string;
  receiverId: string;
  status: "ringing" | "accepted" | "declined" | "ended";
  offer?: any;
  answer?: any;
  createdAt?: any;
  updatedAt?: any;
};

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // conversationId
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("connecting");
  const [remoteReady, setRemoteReady] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<any>(null);

  const [localStreamURL, setLocalStreamURL] = useState<string | null>(null);
  const [remoteStreamURL, setRemoteStreamURL] = useState<string | null>(null);

  const callRef = useMemo(() => (id ? doc(db, "calls", id) : null), [id]);

  const isCallerRef = useRef<boolean>(false);
  const otherUserIdRef = useRef<string | null>(null);

  // ---------- HELPERS ----------
  const cleanup = async () => {
    try {
      if (pcRef.current) {
        pcRef.current.onicecandidate = null as any;
        pcRef.current.ontrack = null as any;
        pcRef.current.close();
        pcRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t: any) => t.stop());
        localStreamRef.current = null;
      }

      setLocalStreamURL(null);
      setRemoteStreamURL(null);
    } catch {}
  };

  const hangup = async () => {
    try {
      if (callRef) {
        await updateDoc(callRef, {
          status: "ended",
          updatedAt: serverTimestamp(),
        });
      }
    } catch {}
    await cleanup();
    router.back();
  };

  // ---------- MAIN ----------
  useEffect(() => {
    if (!id || !user || !callRef) return;

    let unsubCall: any = null;
    let unsubOfferCandidates: any = null;
    let unsubAnswerCandidates: any = null;

    const start = async () => {
      try {
        setLoading(true);
        setStatus("starting");

        // 1) Lire le call doc (déjà créé par startCall)
        const callSnap = await getDoc(callRef);
        if (!callSnap.exists()) {
          Alert.alert("Error", "Call document not found.");
          router.back();
          return;
        }

        const callData = callSnap.data() as CallDoc;

        // Déterminer rôle
        const isCaller = callData.callerId === user.uid;
        isCallerRef.current = isCaller;

        const otherUserId = isCaller ? callData.receiverId : callData.callerId;
        otherUserIdRef.current = otherUserId;

        // 2) Créer PeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        // 3) Local media
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = stream;
        setLocalStreamURL(stream.toURL());

        stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

        // 4) Remote track
        pc.ontrack = (event: any) => {
          const [remoteStream] = event.streams;
          if (remoteStream) {
            setRemoteStreamURL(remoteStream.toURL());
            setRemoteReady(true);
          }
        };

        // 5) ICE handling
        const offerCandidatesRef = collection(db, "calls", id, "offerCandidates");
        const answerCandidatesRef = collection(db, "calls", id, "answerCandidates");

        pc.onicecandidate = async (event: any) => {
          if (!event.candidate) return;

          const data = event.candidate.toJSON();
          if (isCallerRef.current) {
            await addDoc(offerCandidatesRef, data);
          } else {
            await addDoc(answerCandidatesRef, data);
          }
        };

        // 6) Realtime call doc changes
        unsubCall = onSnapshot(callRef, async (snap) => {
          if (!snap.exists()) return;
          const d = snap.data() as CallDoc;

          setStatus(d.status);

          // Si l'autre refuse/termine
          if (d.status === "declined") {
            Alert.alert("Call declined");
            await cleanup();
            router.back();
            return;
          }

          if (d.status === "ended") {
            Alert.alert("Call ended");
            await cleanup();
            router.back();
            return;
          }

          // RECEIVER: on attend l'offer
          if (!isCallerRef.current && d.offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDoc(callRef, {
              answer: {
                type: answer.type,
                sdp: answer.sdp,
              },
              status: "accepted",
              updatedAt: serverTimestamp(),
            });
          }

          // CALLER: on attend l'answer
          if (isCallerRef.current && d.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(d.answer));
          }
        });

        // 7) ICE candidates listeners
        if (isCaller) {
          // Caller écoute answerCandidates
          unsubAnswerCandidates = onSnapshot(answerCandidatesRef, (snap) => {
            snap.docChanges().forEach((change) => {
              if (change.type === "added") {
                const data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
              }
            });
          });

          // Caller crée offer immédiatement
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          await updateDoc(callRef, {
            offer: { type: offer.type, sdp: offer.sdp },
            status: "ringing",
            updatedAt: serverTimestamp(),
          });
        } else {
          // Receiver écoute offerCandidates
          unsubOfferCandidates = onSnapshot(offerCandidatesRef, (snap) => {
            snap.docChanges().forEach((change) => {
              if (change.type === "added") {
                const data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
              }
            });
          });

          // Receiver : le status devient accepted quand il met l'answer
        }

        setLoading(false);
        setStatus(callData.status);
      } catch (e) {
        console.error("Video call error:", e);
        Alert.alert("Error", "Unable to start video call");
        await cleanup();
        router.back();
      }
    };

    start();

    return () => {
      try {
        if (unsubCall) unsubCall();
        if (unsubOfferCandidates) unsubOfferCandidates();
        if (unsubAnswerCandidates) unsubAnswerCandidates();
      } catch {}
      cleanup();
    };
  }, [id, user?.uid]);

  // Optional: clean candidates when leaving (safe)
  const hardCleanupFirestore = async () => {
    if (!id) return;
    try {
      const oc = await getDocs(collection(db, "calls", id, "offerCandidates"));
      const ac = await getDocs(collection(db, "calls", id, "answerCandidates"));
      await Promise.all(oc.docs.map((d) => deleteDoc(d.ref)));
      await Promise.all(ac.docs.map((d) => deleteDoc(d.ref)));
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Starting call…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Remote video */}
        <View style={styles.remoteBox}>
          {remoteStreamURL ? (
            <RTCView streamURL={remoteStreamURL} style={styles.video} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                {status === "ringing"
                  ? "Ringing…"
                  : "Waiting for video…"}
              </Text>
            </View>
          )}
        </View>

        {/* Local preview */}
        {localStreamURL && (
          <View style={styles.localBox}>
            <RTCView streamURL={localStreamURL} style={styles.localVideo} />
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.hangup} onPress={async () => {
            await hardCleanupFirestore();
            await hangup();
          }}>
            <Text style={styles.hangupText}>End</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },

  remoteBox: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1 },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  placeholderText: { color: "#FFF", fontSize: 16, opacity: 0.8 },

  localBox: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 120,
    height: 170,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#111",
  },
  localVideo: { width: "100%", height: "100%" },

  controls: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hangup: {
    backgroundColor: "#E53935",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
  },
  hangupText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#FFF", opacity: 0.8 },
});
