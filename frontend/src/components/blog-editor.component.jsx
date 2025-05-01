import { Link } from 'react-router-dom'
import logo from '../imgs/logo.png'
import Animation from '../common/page-animation'
import defaultBanner from "../imgs/blogbanner.png"
import { uploadImage } from "../common/aws"
import { useRef , useContext , useEffect } from 'react'
import { Toaster , toast } from 'react-hot-toast'
import { EditorContext } from '../pages/editor.pages'
import EditorJS from '@editorjs/editorjs'
import { tools } from './tools.component'
import axios from 'axios'
import { UserContext } from '../App'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
const BlogEditor=()=>{
   let { blog , blog:{ title, banner ,  desc , tags , content }, setBlog , textEditor, setTextEditor, setEditor } =  useContext(EditorContext);
    let { userAuth:{ access_token }}=useContext(UserContext)
    let { blog_id }=useParams()
    let navigate=useNavigate()
    //useEffect
    //const textEditorRef = useRef(null);
    useEffect(() => {
        if (!textEditor.isReady) {
            const editor = new EditorJS({
                holder: "textEditor",
                data: Array.isArray(content)?content[0]:content,
                placeholder: "Let's write an awesome story!",
                tools: tools,
                onReady: () => {
                  setTextEditor(editor); // <-- Important: Store editor instance
                }
            });
        }
    },[]);
    const handlePublishEvent=()=>{
      if(!banner.length){
        return toast.error("Upload a blog banner to publish it !")
      }
      if(!title.length){
        return toast.error("Write blog title to publish it!")
      }
      if (textEditor.isReady) {
        textEditor.save().then((data) => {
            if (data.blocks.length) {
                setBlog({ ...blog, content: data });
                setEditor("publish");
                console.log("Saved content:", data);
                console.log("Updated blog with content:", { ...blog, content: data });
            } else {
                return toast.error("Write something in your blog to publish it!");
            }
        }).catch((err) => console.log(err));
    }
    }
    const handleBannerUpload=(e)=>{
        let img=e.target.files[0];
        if(img){
          let loadingToast=toast.loading("Uploading...")
          uploadImage(img).then((url)=>{
            if(url){
              toast.dismiss(loadingToast)
              toast.success('Uploaded 👍')
              setBlog({...blog , banner:url })
            }
          }).catch(err=>{
            toast.dismiss(loadingToast)
            return toast.error(err)
          })
        }
    }
    const handleError=(e)=>{
      let img=e.target;
      console.log(img)
      img.src=defaultBanner
    }
    const handleTitleKeyDown=(e)=>{
      console.log(e)
      if(e.keyCode==13){
        e.preventDefault();
      }
    }
    const handleTitleChange=(e)=>{
      let input=e.target;
      input.style.height='auto';
      input.style.height=input.scrollHeight+'px';
      setBlog({ ...blog, title: input.value });
    }
   
    const handleSaveDraft=(e)=>{
       if(e.target.className.includes("disable")){
        return;
       }
        if(!blog.title.length){
               return toast.error("Write blog title before saving as draft")
        }
        e.target.classList.add('disable')//to prevent multiple submissions
        if(textEditor.isReady){
          textEditor.save().then((content)=>{
            let blogObj={
              title:blog.title , banner:blog.banner , desc:blog.desc, content:blog.content, tags:blog.tags , draft:true
             }
             let loadingToast=toast.loading("Saving Draft...")
            axios.post(import.meta.env.VITE_SERVER_DOMAIN+'/create-blog' , {...blogObj, id:blog_id } , {
                   headers:{
                       'Authorization':`Bearer ${access_token}`
            }
            }).then(()=>{
                   e.target.classList.remove('disable')
                   toast.dismiss(loadingToast)
                   toast.success("Draft saved successfully")
                   setTimeout(()=>{
                     navigate('/')
                   },500)
                 }).catch(({response})=>{
                   e.target.classList.remove('disable')
                   toast.dismiss(loadingToast)
                   return toast.error(response.data.error)
                 })
          })
        }
       
    }
    return(
        <>
         <Toaster/>
         <nav className="navbar">
           <Link to="/" className="flex-none w-10">
           <img src={logo}/>
           </Link>
           <p className="max-md:hidden text-black line-clamp-1 w-full">
            { title ? title : "New Blog" }
           </p>
           <div className="flex gap-4 ml-auto">
            <button className="btn-dark py-2" onClick={handlePublishEvent}>Publish</button>
            <button className="btn-light py-2" onClick={handleSaveDraft}>Save Draft</button>
           </div>
        </nav>
          <Animation>
            <section>
                <div className="mx-auto max-w-[900px] w-full">
                    <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                       <label htmlFor='uploadBanner'>
                          <img src={banner} className="z-20" onError={handleError}/>
                          <input id="uploadBanner" type="file" accept=".png,.jpg,.jpeg" hidden onChange={handleBannerUpload}/>
                       </label>
                    </div>
                    <textarea defaultValue={title} name="" id="" placeholder="Blog Title" className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40" onKeyDown={handleTitleKeyDown} onChange={handleTitleChange}>

                    </textarea>
                    <hr className="w-full opacity-10 my-5"/>
                    <div defaultValue={content} id="textEditor" className="font-gelasio">

                    </div>
                </div>
            </section>
          </Animation>
        </>
       
    )
}
export default BlogEditor;