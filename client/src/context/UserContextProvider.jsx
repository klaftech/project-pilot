import { useState } from 'react'
import UserContext from './UserContext'

export default function UserContextProvider({ children }) {
    const [user, setUserState] = useState(null);

    const handleUserSelection = async (payload) => {
        //console.log("Payload: ",payload)
        try {
            const response = await fetch(
                "/api/profile",
                {
                    method: "PATCH",
                    body: JSON.stringify(payload),
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
            console.log('User settings saved. ')
            console.log(payload)
            //console.log(data)
            //setUser(data)
        } catch (error) {
            //setServerErrors(error)
            console.log(error)
        }
    }

    const setUser = (data) => {
        if ((user != null) && (data != null)){
            //console.log(user)
            //console.log(data)
            
            const payload = {}
            if(data.selectedProject != user.selectedProject){
                payload['selectedProject'] = data.selectedProject
            }

            if(data.selectedUnit != user.selectedUnit){
                payload['selectedUnit'] = data.selectedUnit
            }
            
            const isEmpty = (obj) => Object.keys(obj).length === 0;
            if (!isEmpty(payload)){
                console.log("Pushing User Updates: ".payload)
                handleUserSelection(payload)
            }
        }

        setUserState(data)
    }
    
    return (
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    )
}