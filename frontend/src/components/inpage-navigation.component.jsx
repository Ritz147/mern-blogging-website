import { useState , useRef , useEffect } from "react";
export let activeTagLineRef;
export let activeTabRef;
const InPageNavigation=({ routes , defaultHidden=[] , defaultActiveIndex=0 , children })=>{
    let [inPageNavIndex , setInPageNavIndex]=useState(defaultActiveIndex);
    activeTagLineRef=useRef();
    activeTabRef=useRef();
    const changePageState=(btn , i)=>{
      console.log(btn , i)
      let { offsetWidth , offsetLeft }=btn;
      activeTagLineRef.current.style.width=offsetWidth+'px'; 
      activeTagLineRef.current.style.left=offsetLeft+'px';
      setInPageNavIndex(i);
    }
    const handleResize = () => {
      if (activeTabRef.current) {
        setInPageNavIndex(0); 
        changePageState(activeTabRef.current, defaultActiveIndex);
      }
    };
    useEffect(() => {
      window.addEventListener("resize", handleResize);
      handleResize();
    
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    return(
        <>
        <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
          {
            routes.map((route,i)=>{
                return (
                    <button ref={i===defaultActiveIndex ? activeTabRef : null} key={i} className={`p-4 px-5 capitalize ${inPageNavIndex === i ? "text-black" : "text-dark-grey"}  ${defaultHidden.includes(route) ? "md:hidden" : ""}`} onClick={(e)=>{changePageState(e.currentTarget , i)}} >
                        {route}
                    </button>
                )
            })
          }
          <hr ref={activeTagLineRef} className="absolute bottom-0 duration-300"/>
        </div>
        { Array.isArray(children)? children[inPageNavIndex] : children}
        </>
    )
}
export default InPageNavigation