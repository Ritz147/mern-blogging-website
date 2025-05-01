import axios from "axios";
export const filterPaginationData=async ({ create_new_arr=false , state , data , page , countRoute , data_to_send ={}  })=>{
 let obj;
 console.log(state)
 if(state!=null && !create_new_arr){
   let new_arr=(state.results)? [...state.results]:[...state]
   obj={...state , results:[...new_arr,...data],page:page}
 }else{
    await axios.post(import.meta.env.VITE_SERVER_DOMAIN+countRoute,data_to_send)//to get info about total docs
    .then(({data : { totalDocs }})=>{
      obj= { results : data , page :1 , totalDocs : totalDocs }
    }).catch(err=>{
        console.log(err)
    })
}
    
return obj;        
   
}//this will be false for page 2 page 3 where the data structure is already set 