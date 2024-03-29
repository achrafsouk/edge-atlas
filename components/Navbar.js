import { useState } from 'react'


function NavLink({to, children}) {
    return <a href={to} className={`mx-4`}>
        {children}
    </a>
}

function MobileNav({open, setOpen}) {
    return (
        <div className={`absolute top-0 left-0 h-screen w-screen bg-purple-500 transform ${open ? "-translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out filter drop-shadow-md `}>
            <div className="flex items-center justify-center filter drop-shadow-md bg-white h-20"> {/*logo container*/}
                <a className="text-xl font-bold" href="/">AWS@Edge</a>
            </div>
            <div className="flex flex-col ml-4 font-semibold">
                {process.env.navbar.map((item) => (
                    <a className="text-xl font-medium my-4" href={item.link} onClick={() => setTimeout(() => {setOpen(!open)}, 100)}>{item.name}</a>
                ))}
            </div>  
        </div>
    )
}

export default function Navbar({sections}) {

    const [open, setOpen] = useState(false)
    return (
        <nav className=" bg-purple-500 flex filter drop-shadow-md px-4 py-4 h-20 items-center text-white">
            <MobileNav open={open} setOpen={setOpen}/>
            <div className="w-3/12 flex items-center">
                <a className="text-2xl font-bold" href="/">AWS@Edge</a>
            </div>
            <div className="w-9/12 flex justify-end items-center">

                <div className="z-50 flex relative w-8 h-8 flex-col justify-between items-center md:hidden" onClick={() => {
                    setOpen(!open)
                }}>
                    {/* hamburger button */}
                    <span className={`h-1 w-full bg-black rounded-lg transform transition duration-300 ease-in-out ${open ? "rotate-45 translate-y-3.5" : ""}`} />
                    <span className={`h-1 w-full bg-black rounded-lg transition-all duration-300 ease-in-out ${open ? "w-0" : "w-full"}`} />
                    <span className={`h-1 w-full bg-black rounded-lg transform transition duration-300 ease-in-out ${open ? "-rotate-45 -translate-y-3.5" : ""}`} />
                </div>

                <div className="hidden md:flex font-semibold">
                    {process.env.navbar.map((item) => (
                        <NavLink to={item.link}>{item.name}</NavLink>
                    ))}
                </div>
            </div>
        </nav>
    )
}