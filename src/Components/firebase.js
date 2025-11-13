import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCndN0ECiy2opB-kzpFGcsGaNnNZneCjM4",
  authDomain: "innerbloom-2811.firebaseapp.com",
  databaseURL: "https://innerbloom-2811-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "innerbloom-2811",
  storageBucket: "innerbloom-2811.firebasestorage.app",
  messagingSenderId: "815199703655",
  appId: "1:815199703655:web:afc9ddfce85759a4813ac2",
  measurementId: "G-ZNSFMDD7RQ"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export { app };
