import { useParams } from "react-router-dom";
import axios from "axios";
import { useEffect , useState } from "react";
import Animation from "../common/page-animation";
import Loader from "../components/loader.component";
import { Link } from "react-router-dom";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import { createContext } from "react";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer from "../components/comments.component";
import { fetchComments } from "../components/comments.component";
const blogStructure={
    title:"",
    desc:"",
    content:[],
    tags:[],
    author:{
        personal_info:{
            fullname:"",
            username:"",
            profile_img:""
        }
    },
    banner:'',
    publishedAt:'',
}
export const BlogContext=createContext({  blog: blogStructure,
    setBlog: () => {},
    isLikedByUser: false,
    setIsLikedByUser: () => {},})
const BlogPage =()=>{
    let { blog_id } =useParams()
    const [ blog , setBlog ]=useState(blogStructure)
    const [ similarBlogs , setSimilarBlogs  ]=useState(null)
    let { title , content , banner , author:{ personal_info :{ fullname , username : author_username , profile_img }} , publishedAt , tags }=blog ? blog : blogStructure
    const [ loading , setLoading ]=useState(true)
    const [ isLikedByUser , setIsLikedByUser ]=useState(false)
    const [ commentWrapper , setCommentWrapper ]=useState(false)
    const [ totalParentCommentsLoaded , setTotalParentCommentsLoaded ]=useState(0)
    const fetchBlog=()=>{
        axios.post(import.meta.env.VITE_SERVER_DOMAIN+"/get-blog",{blog_id}).
        then(async({data : { blog }})=>{
            console.log("before",blog)
              blog.comments=await fetchComments({ blog_id: blog._id , setParentCommentCount:setTotalParentCommentsLoaded })
              console.log("after",blog)
              setBlog(blog)
              axios.post(import.meta.env.VITE_SERVER_DOMAIN+"/search-blogs",{ tag : tags[0], limit : 6 }).then(({ data})=>{
              const filtered = data.blogs.filter((item) => item.blog_id !== blog_id);
               setSimilarBlogs(filtered?filtered:null)
            })
            console.log(blog? blog.content:"")
            setLoading(false)
          })
          .catch(err=>{
              console.log(err)
              setLoading(false)
          })
          }
    useEffect(()=>{
        resetState()
        fetchBlog()
    },[ blog_id ])
    const resetState=()=>{
        setBlog(blogStructure)
        setSimilarBlogs(null)
        setLoading(true)
        setIsLikedByUser(false)
        //setCommentWrapper(true)
        setTotalParentCommentsLoaded(0)
    }
    return(
        <Animation>
            {
                loading ? <Loader/>: 
                <BlogContext.Provider value={{ blog , setBlog , isLikedByUser , setIsLikedByUser , commentWrapper , setCommentWrapper , totalParentCommentsLoaded , setTotalParentCommentsLoaded}}>
                 <CommentsContainer/>
                 <div className="max-w-[1900px] mx-auto px-[10vw] py-10 max-lg:px-[5vw]">
                   <img src={banner} className="aspect-video w-[600px] max-w-full object-cover rounded-xl shadow-md mx-auto"/>
                   <div className="mt-12 max-w-[600px] mx-auto">
                    <h2 className="text-xl">{title}</h2>
                    <div className="flex max-sm:flex-col justify-between my-8">
                      <div className="flex gap-5 items-start">
                        <img src={profile_img} alt="" className="w-12 h-12 rounded-full"/>
                        <p className="capitalize">
                            {fullname}
                            <br/>
                            @
                            <Link to={`/user/${author_username}`} className="underline">
                            { author_username }
                            </Link>
                        </p>
                      </div>
                      <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">Published on {getDay(publishedAt)}</p>
                    </div>
                    <BlogInteraction/>
                    <div className="my-12 font-gelasio blog-page-content">
                        {
                            content[0].blocks.map((item , i)=>{
                               return <div key={i} className="my-4 md:my-8">
                                   <BlogContent block={ item }/>
                               </div>

                            })
                        }

                    </div>
                    { similarBlogs!=null && similarBlogs.length ?
                        <>
                         <h1 className="text-2xl mt-14 mb-10 font-medium">Similar Blogs</h1>
                         {
                            similarBlogs.map((blog , i)=>{
                                let { author : { personal_info }}=blog
                                return <Animation key={i} transition={{ duration:1 , delay:i*0.08 }}>
                                    <BlogPostCard content={blog} author={ personal_info }/>
                                </Animation>
                            })
                         }
                        </>
                        :""
                    }
                    {/* <BlogInteraction/> */}
                   </div>
                </div>
                </BlogContext.Provider>
                
            }
        </Animation>
    )
}
export default BlogPage