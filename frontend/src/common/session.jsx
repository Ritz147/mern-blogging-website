const storeInSession=(key,value)=>{
    sessionStorage.setItem(key,value);
}
const lookInSession=(key)=>{
    const value= sessionStorage.getItem(key)
    return value?value:null;
}
const removeFromSession=(key)=>{
    return sessionStorage.removeItem(key)
} 
const logoutUser=()=>{
    sessionStorage.clear();
}
export { storeInSession , lookInSession , removeFromSession , logoutUser }