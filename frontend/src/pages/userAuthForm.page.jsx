import InputBox from '../components/input.component'
import {useRef , useContext } from 'react'
import googleicon from "../imgs/google.png"
import { Link } from 'react-router-dom'
import Animation from "../common/page-animation"
import { toast , Toaster } from 'react-hot-toast'
import axios from "axios";
import { storeInSession } from '../common/session'
import { UserContext } from '../App'
import { Navigate } from 'react-router-dom'
import { authWithGoogle } from '../common/firebase'
const UserAuthForm=({ type })=>{
     let { userAuth , setUserAuth }=useContext(UserContext);
     const access_token = userAuth?.access_token || null;
     console.log("Printing access token:",access_token);
     const userAuthThroughServer=(serverRoute , formData)=>{
      console.log(import.meta.env.VITE_SERVER_DOMAIN); 
      console.log(import.meta.env.VITE_SERVER_DOMAIN + serverRoute)
       axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute , formData).then(({ data })=>{
        storeInSession("user" , JSON.stringify(data))//we can only store strings in sessionStorage
        setUserAuth(data);
        console.log(sessionStorage)
       })
       .catch(({response})=>{
        toast.error(response.data.error)
       })
     }
     const handleSubmit=(e)=>{
      e.preventDefault();
      let serverRoute= type==="sign-in"?'/signin':'/signup'
      //retrieve the data from form
      let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
      let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
      let form = new FormData(formElement);//authForm.current will give you the html tag and formData will retireve the data
      let formData={};
      for(let [key,value] of form.entries()){
        formData[key]=value;
      }
      console.log(formData);
      let {fullname,email,password}=formData
      //form validation
      if(fullname){
        if(fullname.length<3){
           return toast.error("Fullname must be atleast 3 letters long")
   
       }
      }
    if(!email.length){
        return toast.error("Enter email")
    }
    if(!emailRegex.test(email)){
        return toast.error("Email is invalid")
    }
    if(!passwordRegex.test(password)){
        return toast.error("Password is Invalid : should be 6 to 20 characters long with atleast one numeric , one lowercase and one uppercase character.");
    }
    userAuthThroughServer(serverRoute , formData);

     }

     const handleGoogleAuth=(e)=>{
       e.preventDefault();
       authWithGoogle().then((user)=>{
        let serverRoute="/google-auth";
        let formData={
          access_token:user.accessToken
        }
        userAuthThroughServer(serverRoute,formData);
       }).catch((err)=>{
        toast.error('Trouble logging through Google')
        return console.log(err)
       });
     }

     return(
       access_token ?
       <Navigate to="/"/>
       :
       <Animation key={type}>
        <section className="h-cover flex items-center justify-center">
            <Toaster/>
            <form id="formElement" className="w-[80%] max-w-[400px]"  action="">
              <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                {type == "sign-in" ? "Welcome Back!" : "Join Us Today!"}
              </h1>
              {
                type != "sign-in"?<InputBox
                name="fullname"
                type="text"
                placeholder="Full Name"
                icon="fi-rr-user"/>
                :""
              }
              <InputBox
              name="email"
              type="email"
              placeholder="Email"
              icon="fi-rr-envelope"
              />
               <InputBox
              name="password"
              type="password"
              placeholder="Password"
              icon="fi-rr-key"
              />

              <button
              className="btn-dark center mt-14"
              type="submit" onClick={handleSubmit}>
                {type.replace("-"," ")}
              </button>
              <div className="relative w-full flex items-center gap-2 my-10 opacity-20 uppercase text-black font-bold">
                 <hr className="w-1/2 border-black"/>
                 <p>or</p>
                 <hr className="w-1/2 border-black"/>
              </div>
              <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
                <img src={googleicon} className="w-5" alt="" />
                Continue With Google
                </button>

                {
                 type=="sign-in"?
                 <p className="mt-6 text-dark-grey text-xl text-center">
                  Don't have an account?
                  <Link to="/signup" className="underline text-black text-xl ml-1">
                  Join Us Today
                  </Link>
                 </p>:
                 <p className="mt-6 text-dark-grey text-xl text-center">
                 Already a member?
                 <Link to="/signin" className="underline text-black text-xl ml-1">
                 Sign in Here
                 </Link>
                </p>

                }
            </form>
        </section>
       </Animation>
     )
}
export default UserAuthForm;