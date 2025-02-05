import {NavLink, Link} from 'react-router'
import { Button } from "@/components/ui/button"
import Logout from './Logout'

function Header() {
    return (
        <>
            {/* <div class="w-screen bg-black flex flex-col">
            <div class="bg-green-200">NAVBAR WORKING</div> */}

            {/* <!-- Navigation Menu --> */}        
            <nav className="text-black p-4 flex space-x-8"> {/* bg-gray-800 text-white */}
            {/* <ul className="flex space-x-8"> */}
                <NavLink to="/"><Button variant="outline" className="hover:text-slate-200">Home</Button></NavLink>
                <NavLink to="/tasks"><Button variant="outline" className="hover:text-slate-200">Tasks</Button></NavLink>
                <NavLink to="/list"><Button variant="outline" className="hover:text-slate-200">List</Button></NavLink>
                <NavLink to="/schedule"><Button variant="outline" className="hover:text-slate-200">Schedule</Button></NavLink>
                <NavLink to="/logout"><Button variant="outline" className="hover:text-slate-200">Logout</Button></NavLink>
            {/* </ul> */}
            </nav>
            {/* <!-- Horizontal Line --> */}
            <hr className="my-4 border-t-2 border-gray-300" />
        </>
    )
}

export default Header