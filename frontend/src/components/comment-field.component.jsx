import { useState } from "react";
import { UserContext } from "../App";
import { useContext } from "react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios"
import { BlogContext } from "../pages/blog.page";
const CommentField=({action})=>{
    let { blog , blog :{ _id , author :{ _id: blog_author } , comments , activity , activity :{ total_comments , total_parent_comments }} , setBlog , setTotalParentCommentsLoaded}=useContext(BlogContext)
    let { userAuth : { access_token , username , fullname , profile_img  }}=useContext(UserContext)
    const [ comment , setComment]=useState("")
    const handleComment=()=>{
      if(!access_token){
        return toast.error("login first to leave a comment")
      }
      if(!comment.length){
        toast.error("Write something to leave a comment!")
      }
      axios.post(import.meta.env.VITE_SERVER_DOMAIN+"/add-comment",{ _id , blog_author , comment },{
        headers:{
            "Authorization":`Bearer ${access_token}`
        }
      }).then(({ data })=>{
        setComment("");
        data.commented_by= { personal_info :{ username , profile_img , fullname }}
        let newCommentArray;
        data.childrenLevel=0;
        newCommentArray=[ data ]
        let parentCommentIncrementVal=1;
        setBlog({ ...blog , comments:{ ...comments , results: newCommentArray } , activity :{ ...activity , total_comments: total_comments+1 , total_parent_comments:total_parent_comments+parentCommentIncrementVal }})
        setTotalParentCommentsLoaded(preVal => preVal+parentCommentIncrementVal )
      }).catch(err=>{
        console.log(err)
      })
    }
    return(
        <>
        <Toaster/>
        <textarea  onChange={(e)=>setComment(e.target.value)} className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto" value={comment} placeholder="Leave a comment..."></textarea>
        <button className="btn-dark mt-5 px-10" onClick={handleComment}>{action}</button>
        </>
    )
}
export default CommentField;