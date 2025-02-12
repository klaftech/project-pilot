import { SignupForm } from "@/pages/Signup/signup-form"
import { SignupSuccess } from "@/pages/Signup/signup-success"
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router'
import UserContext from '../../context/UserContext'

import MainLogo from '/logo.webp'
import Logo from '/logo_transparent.png'

export default function SignupPage() {

    const [serverErrors, setServerErrors] = useState(null)
    const [signupSuccess, setSignupSuccess] = useState(false)
    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if(user) {
            console.log("user is already logged in, redirecting to /")
            navigate('/');
        }
    }, [])

    const handleSignup = async (form_data) => {
        try {
            const response = await fetch(
                "api/signup",
                {
                    method: "POST",
                    body: JSON.stringify({ 
                        name: form_data['name'], 
                        email: form_data['email'], 
                        password: form_data['password'],
                        confirmPassword: form_data['confirmPassword']
                     }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            )
            if(!response.ok){
                //throw new Error(`Response status: ${response.status}`);
                throw new Error(response.status);
            }
            
            const data = await response.json()
            console.log('User successfully created.')
            console.log(data)
            setSignupSuccess(true)
            
            // if we want to auto-login
            //console.log('User successfully created. Navigating to /')
            //setUser(data)
            //navigate('/');
        } catch (error) {
            setServerErrors(error)
            //console.log(error)
        }
    }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {/* <GalleryVerticalEnd className="size-4" /> */}
            <img src={MainLogo} />
          </div>
          ProjectPilot
        </Link>
        {signupSuccess && <SignupSuccess />}
        {!signupSuccess && <SignupForm serverErrors={serverErrors} onSignupSubmit={handleSignup} />}
      </div>
    </div>
  )
}
