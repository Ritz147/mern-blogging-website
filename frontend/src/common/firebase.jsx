
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { GoogleAuthProvider } from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { signInWithPopup  } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCzoZdQWmZ9p9NEHm5imK4kCrtmS3q25UU",
  authDomain: "react-js-blog-website-5fbd6.firebaseapp.com",
  projectId: "react-js-blog-website-5fbd6",
  storageBucket: "react-js-blog-website-5fbd6.firebasestorage.app",
  messagingSenderId: "954004812047",
  appId: "1:954004812047:web:98ece623e38184ec374e7a",
  measurementId: "G-D3YWWHCHM9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
//google auth

const provider=new GoogleAuthProvider()
const auth=getAuth();
export const authWithGoogle = async()=>{
   let user=null
   await signInWithPopup(auth , provider).then((result)=>{
    user=result.user;
   }).catch((err)=>{
    console.log(err)
   })
   return user;
}
