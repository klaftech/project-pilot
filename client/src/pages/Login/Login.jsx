import { LoginForm } from "@/pages/Login/login-form"
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router'
import UserContext from '@/context/UserContext'

import { GalleryVerticalEnd } from "lucide-react"
import MainLogo from '/logo.webp'
import Logo from '/logo_transparent.png'

export default function LoginPage() {

    const [serverErrors, setServerErrors] = useState(null)
    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate();
    
    useEffect(() => {
        if(user) {
            console.log("user is already logged in, redirecting to /")
            navigate('/');
        }
    }, [])

    const handleLogin = async (form_data) => {
        try {
            const response = await fetch(
                "api/login",
                {
                    method: "POST",
                    body: JSON.stringify({ email: form_data['email'], password: form_data['password'] }),
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
            console.log('Successfully Logged In. Navigating to /')
            console.log(data)

            const defaultSelectedProject = 1
            const user_obj = {...data}
            user_obj.selectedProject = defaultSelectedProject
            setUser(user_obj)
            
            navigate('/');
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
        <LoginForm serverErrors={serverErrors} onLoginSubmit={handleLogin} />
      </div>
    </div>
  )
}
