function Header() {
    return (
        <>
            {/* <!-- Navigation Menu --> */}
            <nav className="text-black p-4"> {/* bg-gray-800 text-white */}
            <ul className="flex space-x-8">
                <li><a href="/" className="hover:text-slate-200">Home</a></li>
                <li><a href="tasks" className="hover:text-slate-200">Tasks</a></li>
                <li><a href="list" className="hover:text-slate-200">List</a></li>
                <li><a href="schedule" className="hover:text-slate-200">Schedule</a></li>
            </ul>
            </nav>
            {/* <!-- Horizontal Line --> */}
            <hr className="my-4 border-t-2 border-gray-300" />
        </>
    )
}

export default Header