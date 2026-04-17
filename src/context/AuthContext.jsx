import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch additional user data from Firestore (like role)
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ ...firebaseUser, ...userDoc.data() });
          } else {
            // If user exists in Auth but not in Firestore (e.g., first social login)
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: "technician", // default role
              createdAt: new Date()
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            setUser({ ...firebaseUser, ...newUser });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // Fallback: still clear loading so UI can show login/error
        if (firebaseUser) {
          setUser({ ...firebaseUser, role: "technician" }); // fallback role
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName, role) => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = {
        uid: res.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date()
      };
      await setDoc(doc(db, "users", res.user.uid), newUser);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = (email, password) => {
    if (!auth) throw new Error("Firebase not initialized");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const googleSignIn = () => {
    if (!auth) throw new Error("Firebase not initialized");
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    if (!auth) return;
    return signOut(auth);
  };

  const value = {
    user,
    signup,
    login,
    googleSignIn,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
