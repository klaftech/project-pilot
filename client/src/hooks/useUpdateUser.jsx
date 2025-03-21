import { useContext } from 'react'
import UserContext from '@/context/UserContext'

// custom hook that allows defining change to user profile that will push change to state (and update backend in UserContextProvider)
export function useUpdateUser() {
    const {user, setUser} = useContext(UserContext);
    const hook_func = (data_obj) => {
        const user_obj = {...user, ...data_obj}
        setUser(user_obj)
        //console.log(user, data_obj)
    }
    return hook_func
}