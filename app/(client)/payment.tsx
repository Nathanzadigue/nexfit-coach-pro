import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/src/firebase/config";
import { useAuth } from "@/src/store/AuthContext";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

// Stripe imports
import {
  CardField,
  initStripe,
  StripeProvider,
  useConfirmPayment,
  useStripe,
} from "@stripe/stripe-react-native";

/* ---------- TYPES ---------- */

type PaymentMethod = "card" | "apple_pay" | "google_pay" | "stripe_sheet";

/* ---------- CONFIG ---------- */

// ⚠️ REPLACE THESE WITH YOUR REAL KEYS
const STRIPE_PUBLISHABLE_KEY = "pk_test_51Slsj1CTf1xrFPj0FRjnzIlezp59N963t3hDeA9S3FXPjZdFiuVZM18iwTaOjlFVF0Az0emQhrw4r1ZL5B35Ttnk00PTt5c28F"; // Your Stripe public key
const BACKEND_URL = "http://192.168.1.X:5001/nexfit-67db9/us-central1"; // Your backend URL

/* ---------- MAIN COMPONENT ---------- */

export default function PaymentScreen() {
  const { bookingId, amount, serviceName, serviceId, date, time } = useLocalSearchParams<{
    bookingId: string;
    amount: string;
    serviceName: string;
    serviceId: string;
    date: string;
    time: string;
  }>();

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe_sheet");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [stripeInitialized, setStripeInitialized] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);

  // Stripe hooks
  const { confirmPayment, loading: confirmLoading } = useConfirmPayment();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  /* ---------- STATUS BAR CONFIG ---------- */

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  /* ---------- STRIPE INITIALIZATION ---------- */

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // In production, you should fetch the key from your server
        setPublishableKey(STRIPE_PUBLISHABLE_KEY);
        
        // Initialize Stripe
        await initStripe({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          merchantIdentifier: 'merchant.com.nexfit',
          urlScheme: 'nexfit',
        });
        
        setStripeInitialized(true);
      } catch (error) {
        console.error("Error initializing Stripe:", error);
        Alert.alert("Error", "Unable to initialize payment service");
      }
    };

    initializeStripe();
  }, []);

  /* ---------- FETCH BOOKING DETAILS ---------- */

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      try {
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (bookingSnap.exists()) {
          setBooking({ id: bookingSnap.id, ...bookingSnap.data() });
        }
      } catch (error) {
        console.error("Error loading booking:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  /* ---------- STRIPE FUNCTIONS ---------- */

  // Method 1: Payment Sheet (recommended)
  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/createPaymentSheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount) * 100, // Convert to cents
          currency: 'eur',
          serviceName: serviceName,
          customerEmail: user?.email,
          metadata: {
            bookingId,
            clientId: user?.uid,
            coachId: booking?.coachId,
            serviceId,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { paymentIntent, ephemeralKey, customer } = await response.json();
      return { paymentIntent, ephemeralKey, customer };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      throw error;
    }
  };

  const initializePaymentSheet = async () => {
    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Nexfit",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: user?.displayName || 'Client',
          email: user?.email || '',
        },
        returnURL: 'nexfit://stripe-redirect',
      });
      
      if (error) {
        Alert.alert("Error", `Initialization error: ${error.message}`);
        console.error("Payment sheet init error:", error);
        return false;
      }
      return true;
    } catch (error) {
      Alert.alert("Error", "Unable to initialize payment");
      console.error("Initialize payment sheet error:", error);
      return false;
    }
  };

  const handleStripePaymentSheet = async () => {
    setProcessing(true);
    
    try {
      // Initialize payment sheet
      const initialized = await initializePaymentSheet();
      if (!initialized) {
        setProcessing(false);
        return;
      }
      
      // Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          // User cancelled, no need for alert
          console.log("Payment cancelled by user");
          Alert.alert("Cancelled", "Payment has been cancelled");
        } else {
          Alert.alert(`Error code: ${error.code}`, error.message);
        }
        setProcessing(false);
      } else {
        // Payment successful
        await handlePaymentSuccess();
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      Alert.alert("Error", "An error occurred during payment");
      setProcessing(false);
    }
  };

  // Method 2: Card Field (alternative)
  const fetchPaymentIntentClientSecret = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/createPaymentIntent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: "eur",
          amount: parseFloat(amount) * 100,
          payment_method_types: ["card"],
          serviceName: serviceName,
          metadata: {
            bookingId,
            clientId: user?.uid,
            coachId: booking?.coachId,
            serviceId,
          }
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      return data?.clientSecret;
    } catch (error) {
      console.error("Error fetching payment intent:", error);
      throw error;
    }
  };

  const handlePayWithCardField = async () => {
    if (!cardDetails?.complete) {
      Alert.alert("Error", "Please complete card details");
      return;
    }

    setProcessing(true);

    try {
      const billingDetails = {
        email: user?.email || "client@example.com",
        name: user?.displayName || "Client",
        address: {
          city: "Paris",
          country: "FR",
          line1: "Address",
          postalCode: "75000",
        }
      };

      const clientSecret = await fetchPaymentIntentClientSecret();

      if (!clientSecret) {
        throw new Error("Unable to retrieve payment secret");
      }

      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails,
        },
      });

      if (error) {
        console.log("Payment confirmation error", error);
        Alert.alert('Payment error', error.message);
      } else if (paymentIntent) {
        console.log("Payment successful", paymentIntent);
        await handlePaymentSuccess(paymentIntent.id);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert('Error', error.message || "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- PAYMENT SUCCESS HANDLING ---------- */

  const handlePaymentSuccess = async (paymentIntentId?: string) => {
    if (!user || !bookingId) return;

    try {
      // Update booking status
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "paid",
        paidAt: serverTimestamp(),
        paymentAmount: amount,
        paymentMethod: selectedMethod === "stripe_sheet" ? "stripe" : selectedMethod,
        paymentDate: serverTimestamp(),
        stripePaymentIntentId: paymentIntentId,
      });

      // Create notification for coach
      await addDoc(collection(db, "notifications"), {
        userId: booking?.coachId,
        type: "payment_received",
        title: "💰 Payment received",
        message: `Client paid ${amount}€ for ${serviceName} session.`,
        bookingId: bookingId,
        read: false,
        createdAt: serverTimestamp(),
        data: {
          bookingId: bookingId,
          sport: serviceName,
          price: amount,
          clientId: user.uid,
          clientEmail: user.email,
          paymentIntentId: paymentIntentId,
        }
      });

      // Create notification for client
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        type: "payment_confirmed",
        title: "✅ Payment confirmed",
        message: `Your payment of ${amount}€ for ${serviceName} has been processed successfully.`,
        bookingId: bookingId,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Create transaction document
      await addDoc(collection(db, "transactions"), {
        bookingId: bookingId,
        clientId: user.uid,
        coachId: booking?.coachId,
        serviceId: serviceId,
        amount: parseFloat(amount),
        currency: "EUR",
        status: "completed",
        paymentMethod: selectedMethod === "stripe_sheet" ? "stripe" : selectedMethod,
        serviceName: serviceName,
        stripePaymentIntentId: paymentIntentId,
        createdAt: serverTimestamp(),
        clientEmail: user.email,
      });

      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error updating after payment:", error);
      Alert.alert(
        "Error",
        "Payment succeeded but an error occurred during update. Please contact support."
      );
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- SIMULATED PAYMENT HANDLING ---------- */

  const handleSimulatedPayment = async () => {
    if (!user || !bookingId) return;

    setProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update booking status
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "paid",
        paidAt: serverTimestamp(),
        paymentAmount: amount,
        paymentMethod: selectedMethod,
        paymentDate: serverTimestamp(),
      });

      // Create notification for coach
      await addDoc(collection(db, "notifications"), {
        userId: booking?.coachId,
        type: "payment_received",
        title: "💰 Payment received",
        message: `Client paid ${amount}€ for ${serviceName} session.`,
        bookingId: bookingId,
        read: false,
        createdAt: serverTimestamp(),
        data: {
          bookingId: bookingId,
          sport: serviceName,
          price: amount,
          clientId: user.uid,
          clientEmail: user.email,
        }
      });

      // Create notification for client
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        type: "payment_confirmed",
        title: "✅ Payment confirmed",
        message: `Your payment of ${amount}€ for ${serviceName} has been processed successfully.`,
        bookingId: bookingId,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Create transaction document
      await addDoc(collection(db, "transactions"), {
        bookingId: bookingId,
        clientId: user.uid,
        coachId: booking?.coachId,
        serviceId: serviceId,
        amount: parseFloat(amount),
        currency: "EUR",
        status: "completed",
        paymentMethod: selectedMethod,
        serviceName: serviceName,
        createdAt: serverTimestamp(),
        clientEmail: user.email,
      });

      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "❌ Payment error",
        "An error occurred. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  /* ---------- PAYMENT BUTTON HANDLER ---------- */

  const handlePaymentButton = async () => {
    if (selectedMethod === "stripe_sheet") {
      await handleStripePaymentSheet();
    } else if (selectedMethod === "card") {
      await handlePayWithCardField();
    } else {
      // For Apple Pay and Google Pay (simulated for now)
      await handleSimulatedPayment();
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.dismissAll();
    router.navigate("/(client)");
  };

  /* ---------- DATE FORMATTING ---------- */

  const formatDateTime = () => {
    try {
      if (!date || !time) return "Date to be scheduled";
      
      if (date.includes('-')) {
        const [year, month, day] = date.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        
        const formattedTime = time.includes(':') 
          ? `${time.split(':')[0]}:${time.split(':')[1]}`
          : time;
          
        return `${formattedDate} at ${formattedTime}`;
      }
      
      return `${date} at ${time}`;
    } catch {
      return "Date to be scheduled";
    }
  };

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!stripeInitialized && selectedMethod === "stripe_sheet") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Initializing payment services...</Text>
      </View>
    );
  }

  /* ---------- UI ---------- */

  const renderContent = () => (
    <ScrollView style={styles.scrollView}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Secure Payment</Text>
      </View>

      {/* BOOKING INFO */}
      <View style={styles.card}>
        <View style={styles.reservationHeader}>
          <Ionicons name="calendar" size={24} color="#000" />
          <Text style={styles.serviceName}>{serviceName}</Text>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & time</Text>
            <Text style={styles.detailValue}>{formatDateTime()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total amount</Text>
            <Text style={styles.price}>{amount} €</Text>
          </View>
          
          {booking?.duration && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {booking.duration} minutes
              </Text>
            </View>
          )}
          
          {booking?.coachingMode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mode</Text>
              <Text style={styles.detailValue}>
                {booking.coachingMode === "remote" ? "Remote" : 
                 booking.coachingMode === "in-person" ? "In-person" : 
                 "No preference"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* PAYMENT METHODS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Choose payment method</Text>
        
        <Pressable 
          style={[
            styles.paymentMethod,
            selectedMethod === "stripe_sheet" && styles.paymentMethodSelected
          ]}
          onPress={() => setSelectedMethod("stripe_sheet")}
        >
          <View style={styles.paymentMethodLeft}>
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="card-outline" size={24} color="#000" />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>Stripe Payment Sheet</Text>
              <Text style={styles.paymentMethodDescription}>
                Credit card, Apple Pay, Google Pay
              </Text>
            </View>
          </View>
          {selectedMethod === "stripe_sheet" && (
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
          )}
        </Pressable>

        <Pressable 
          style={[
            styles.paymentMethod,
            selectedMethod === "card" && styles.paymentMethodSelected
          ]}
          onPress={() => setSelectedMethod("card")}
        >
          <View style={styles.paymentMethodLeft}>
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="card-outline" size={24} color="#000" />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>Credit card</Text>
              <Text style={styles.paymentMethodDescription}>
                Visa, Mastercard, CB (input field)
              </Text>
            </View>
          </View>
          {selectedMethod === "card" && (
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
          )}
        </Pressable>

        {selectedMethod === "card" && (
          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
                postalCode: '75000',
                cvc: '123',
                expiration: 'MM/YY',
              }}
              cardStyle={{
                backgroundColor: '#FFFFFF',
                textColor: '#000000',
                borderWidth: 1,
                borderColor: '#CCCCCC',
                borderRadius: 8,
              }}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                console.log("Card details:", cardDetails);
                setCardDetails(cardDetails);
              }}
            />
          </View>
        )}

        <Pressable 
          style={[
            styles.paymentMethod,
            selectedMethod === "apple_pay" && styles.paymentMethodSelected
          ]}
          onPress={() => setSelectedMethod("apple_pay")}
        >
          <View style={styles.paymentMethodLeft}>
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>Apple Pay</Text>
              <Text style={styles.paymentMethodDescription}>
                Fast and secure payment
              </Text>
            </View>
          </View>
          {selectedMethod === "apple_pay" && (
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
          )}
        </Pressable>

        <Pressable 
          style={[
            styles.paymentMethod,
            selectedMethod === "google_pay" && styles.paymentMethodSelected
          ]}
          onPress={() => setSelectedMethod("google_pay")}
        >
          <View style={styles.paymentMethodLeft}>
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="logo-google" size={24} color="#000" />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>Google Pay</Text>
              <Text style={styles.paymentMethodDescription}>
                Fast and secure payment
              </Text>
            </View>
          </View>
          {selectedMethod === "google_pay" && (
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
          )}
        </Pressable>
      </View>

      {/* SECURITY INFO */}
      <View style={styles.securityCard}>
        <Ionicons name="shield-checkmark" size={24} color="#2E7D32" />
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>100% secure payment by Stripe</Text>
          <Text style={styles.securityText}>
            Your payment information is encrypted and never stored on our servers.
          </Text>
        </View>
      </View>

      {/* PAYMENT BUTTON */}
      <Pressable
        style={[styles.payButton, processing && styles.payButtonDisabled]}
        onPress={handlePaymentButton}
        disabled={processing || (selectedMethod === "card" && !cardDetails?.complete)}
      >
        {processing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="lock-closed" size={20} color="#FFF" />
            <Text style={styles.payButtonText}>
              Pay {amount} €
            </Text>
          </>
        )}
      </Pressable>

      {/* CANCEL */}
      <Pressable
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={processing}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>

      {/* LEGAL INFO */}
      <Text style={styles.legalText}>
        By completing this payment, you accept Nexfit's terms of service and privacy policy.
      </Text>

      {/* PAYMENT INFO */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color="#666" />
        <Text style={styles.infoText}>
          Payment will be transferred to the coach after the session.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <StripeProvider publishableKey={publishableKey}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.statusBarBackground} />
        <View style={styles.container}>
          {renderContent()}

          {/* SUCCESS MODAL */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showSuccessModal}
            onRequestClose={handleCloseSuccessModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
                </View>
                
                <Text style={styles.modalTitle}>Payment successful!</Text>
                <Text style={styles.modalMessage}>
                  Your payment of {amount}€ for {serviceName} has been processed successfully.
                </Text>
                
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date:</Text>
                    <Text style={styles.modalDetailValue}>{date}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Time:</Text>
                    <Text style={styles.modalDetailValue}>{time}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Amount:</Text>
                    <Text style={styles.modalDetailValue}>{amount} €</Text>
                  </View>
                </View>
                
                <Pressable
                  style={styles.modalButton}
                  onPress={handleCloseSuccessModal}
                >
                  <Text style={styles.modalButtonText}>Return to home</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </StripeProvider>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    backgroundColor: '#666',
    zIndex: 1000,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16, // Réduit à 16px sur les côtés
    marginTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16, // Réduit à 16px
    marginBottom: 16, // Réduit l'espace entre les cartes
    borderWidth: 1,
    borderColor: "#EEE",
  },
  reservationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 15,
    color: "#666",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  paymentMethodSelected: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  paymentMethodDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  cardFieldContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  cardField: {
    width: "100%",
    height: 50,
    marginBottom: 16, // Réduit
  },
  securityCard: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20, // Réduit
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  securityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: "#2E7D32",
    lineHeight: 16,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    marginBottom: 16, // Réduit
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  legalText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16, // Réduit
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFEAA7",
    gap: 12,
    marginBottom: 20, // Réduit
  },
  infoText: {
    fontSize: 13,
    color: "#856404",
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  
  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalDetails: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  modalDetailValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  modalButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});