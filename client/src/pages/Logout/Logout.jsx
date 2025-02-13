import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import { useContext } from "react"
import UserContext from '@/context/UserContext'

export default function Logout() {
    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        logoutUser()
        setUser(null)
    }, [])
    
    const logoutUser = () => {
        fetch(
            '/api/logout',
            {
                method: "DELETE",
            },
        )
        navigate('/');
    }
}