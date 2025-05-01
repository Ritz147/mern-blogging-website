import Animation from "../common/page-animation";
import { Toaster , toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import { useContext } from "react"
import Tag from "./tags.component";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
const PublishForm=()=>{
    let characterLimit= 200;
    let tagLimit= 10;
    let { blog_id }=useParams()
    let { blog , blog:{ banner , title , tags , des:desc , content },setEditor , setBlog }= useContext(EditorContext)
    console.log(blog)
    let { userAuth:{ access_token }} =useContext(UserContext)
    let navigate=useNavigate()
    const handleCloseEvent=()=>{
        setEditor("editor")
    }
    const handleBlogTitleChange=(e)=>{
        let input= e.target;
        setBlog({...blog , title:input.value})
    }
    const handleBlogDescChange=(e)=>{
        let input= e.target;
        setBlog({...blog , desc:input.value })
    }
    const handleTitleKeyDown=(e)=>{
        console.log(e)
        if(e.keyCode==13){
          e.preventDefault();
        }
      }
    const handleKeyDown=(e)=>{
        if(e.target.className.includes('disable')){
            return;
        }
        if(e.keyCode==13 || e.keyCode==188){
          e.preventDefault();
          let tag=e.target.value;
          console.log(tag)
          if(tags.length < tagLimit){
            if(!tags.includes(tag) && tag.length){
                setBlog({...blog , tags:[...tags , tag]})
            }
          }else{
            toast.error(`You can add max ${tagLimit} tags!`)
          }
          e.target.value=''
        }
    }
    const publishBlog=(e)=>{
      if(!title.length){
        return toast.error("Write blog title before publishing")
      }
      if(!desc.length || desc.length>characterLimit){
         return toast.error(`Write a description about your blog within ${characterLimit}`)
      }
      if(!tags.length){
        return toast.error("Enter at least one tag to rank your blog")
      }
      let loadingToast=toast.loading("Publishing...")
      e.target.classList.add('disable')//to prevent multiple submissions
      let blogObj={
        title , banner , desc , content , tags , draft:false
      }
      axios.post(import.meta.env.VITE_SERVER_DOMAIN+'/create-blog' , { ...blogObj , id:blog_id }  , {
        headers:{
            'Authorization':`Bearer ${access_token}`
        }
      }).then(()=>{
        e.target.classList.remove('disable')
        toast.dismiss(loadingToast)
        toast.success("Blog published successfully")
        setTimeout(()=>{
          navigate('/')
        },500)
      }).catch(({response})=>{
        e.target.classList.remove('disable')
        toast.dismiss(loadingToast)
        return toast.error(response.data.error)
      })
    }
    return(
        <Animation>
         <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
            <Toaster/>
            <button className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]" onClick={handleCloseEvent}>
            <i className="fi fi-br-cross"></i>
            </button>
            <div className="max-w-[550px] center">
                <p className="text-dark-grey mb-1">Preview</p>
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
                    <img src={banner} alt="" />
                </div>
                <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">{ title }</h1>
                <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">{ desc }</p>
            </div>
            <div className="border-grey lg:border-1 lg:pl-8">
                <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
                <input type="text" placeholder="Blog Title" defaultValue={ title } className="input-box pl-4" onChange={ handleBlogTitleChange }/>
                <p className="text-dark-grey mb-2 mt-9">Short description about Blog</p>
                <textarea name="" id="" maxLength={ characterLimit } defaultValue={ desc } className="h-40 resize-none leading-7 input-box pl-4" onChange={ handleBlogDescChange } onKeyDown={ handleTitleKeyDown }></textarea>
                <p className="mt-1 dark-grey text-sm text-right">{ characterLimit - (desc?.length || 0)  } characters left </p>
                <p className="text-dark-grey mb-2 mt-9">Topics - ( Helps in Searching and Ranking your Blog Post)</p>
                <div className="relative input-box pl-2 py-2 pb-4">
                    <input type="text" placeholder="Topic" className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white" onKeyDown={handleKeyDown}/>
                    { tags.map((tag,ind)=>{
                        return <Tag tag={tag} tagIndex={ind} key={ind}/>
                    })}
                </div>
                <p className="mt-1 mb-4 text-dark-grey text-right">{ tagLimit - tags?.length||0}</p>
                <button className="btn-dark px-8" onClick={ publishBlog }>Publish</button>
            </div>
         </section>
        </Animation>
    )
}
export default PublishForm;