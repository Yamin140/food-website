  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
  import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  //Yamin firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyATkMIUEvzyPi-4-797-SeaI-wWkdzJ66w",
    authDomain: "food-website-8cb08.firebaseapp.com",
    projectId: "food-website-8cb08",
    storageBucket: "food-website-8cb08.firebasestorage.app",
    messagingSenderId: "152139970054",
    appId: "1:152139970054:web:47b31344cf63830f417587",
    measurementId: "G-856YRNPSM2"
  };



  //webdesignanddevelopment648@gmail.com (Md Akash firebase config - food website)
  // const firebaseConfig = {
  // apiKey: "AIzaSyCmluINGz4gqaiapBzycdK3EtYKnj8PXcY",
  // authDomain: "food-website-4acb9.firebaseapp.com",
  // projectId: "food-website-4acb9",
  // storageBucket: "food-website-4acb9.firebasestorage.app",
  // messagingSenderId: "603053394148",
  // appId: "1:603053394148:web:e4413339e23857bd8684f1",
  // measurementId: "G-HLMSPY86CX"
  // };

  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export let analytics;
  isSupported().then((ok) => {
    if (ok) analytics = getAnalytics(app);
  });
