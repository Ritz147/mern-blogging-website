import Animation from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import axios from "axios";
import { useEffect , useState } from 'react';
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component"
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";
const HomePage=()=>{
    let [ blogs , setBlogs ]=useState(null);
    let [ trendingBlogs , setTrendingBlogs ]=useState(null);
    let [ pageState , setPageState ]=useState("home");
    let categories=["anime","love","mystery","thriller","movie","film-making"];
    const fetchLatestBlogs=( {page=1 , prevState=null} )=>{

      axios.post(import.meta.env.VITE_SERVER_DOMAIN+"/latest-blogs", { page } ).then(async ({ data })=>{
        console.log(data.blogs)
        let formattedData= await filterPaginationData({
          state: page===1 ?null :prevState,
          data: data.blogs,
          page:page,
          countRoute:"/all-latest-blogs-count"
        })
    
        console.log(formattedData)
        setBlogs(formattedData)
      }).catch(err=>{
        console.log(err)
      })
    }
    const fetchTrendingBlogs=()=>{
      axios.get(import.meta.env.VITE_SERVER_DOMAIN+"/trending-blogs").then(({data:{ blogs }})=>{
        setTrendingBlogs(blogs)
      }).catch(err=>{
        console.log(err)
      })
    }
    const fetchBlogsByCategory=({ category , page = 1 , prevState = null })=>{
      axios.post(import.meta.env.VITE_SERVER_DOMAIN+"/search-blogs",{ tag: category , page }).then(async ({ data })=>{
        let formattedData= await filterPaginationData({
          state: page === 1 ? null : prevState,
          data: data.blogs,
          page:page,
          countRoute:"/search-blogs-count",
          data_to_send: { tag : category }
        })
        setBlogs(formattedData)
      }).catch(err=>{
        console.log(err)
      })
    }
    useEffect(()=>{
      activeTabRef.current.click()
      if(pageState=="home"){
        fetchLatestBlogs({page : 1})
      }else{
        fetchBlogsByCategory({ page :1 , category : pageState })
      }
      if(!trendingBlogs){
        fetchTrendingBlogs()
      }
    },[pageState])
    const loadBlogByCategory=(e)=>{
      let category=e.target.innerText.toLowerCase();
      setBlogs(null);
      if(pageState== category){
        setPageState("home")
        fetchLatestBlogs()
        return;
      }
      setPageState(category)
    }
    return(
        <Animation>
          <section className="h-cover flex justify-center gap-10">
             {/*Latest blogs*/}
             <div className="w-full">
               <InPageNavigation routes={[pageState,"trending blogs"]} defaultHidden={["trending blogs"]}>
                 <>
                     {
                          blogs===null? <Loader/> : blogs.results.length ? blogs.results.map((blog,ind)=>{
                            return (<Animation transition ={{ duration:1 , delay:ind*0.1 }} key={ind}>
                              <BlogPostCard content={blog} author={blog.author.personal_info}/>
                            </Animation>)
                          }): <NoDataMessage message={"No blogs published"}/>

                     }
                     <LoadMoreDataBtn state={blogs} fetchDataFunc={pageState==="home"?({page})=>fetchLatestBlogs({page , prevState:blogs}):({ page }) => fetchBlogsByCategory({ category: pageState, page , prevState:blogs })}/>
                 </>
                    {
                      trendingBlogs === null ? (
                        <Loader />
                      ) : trendingBlogs.length ? (
                        trendingBlogs.map((blog, i) => (
                          <Animation transition={{ duration: 1, delay: i * 0.1 }} key={i}>
                            <MinimalBlogPost blog={blog} ind={i} />
                          </Animation>
                        ))
                      ) : (
                        <NoDataMessage message="No trending blogs" />
                      )
                    }

                </InPageNavigation>
             </div>
             {/*Filters and Popular blogs*/}
             <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
              <div className="flex flex-col gap-10">
                <div>
                <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>
                <div className="flex gap-3 flex-wrap">
                  {
                    categories.map((category,i)=>{
                      return <button onClick={loadBlogByCategory} className={ `tag ${(pageState==category)? "bg-black text-white":""}`} key={i}>{category}</button>
                    })
                  }
                </div>
                </div>
              </div>
              <div>
                 <h1 className="font-medium text-xl mt-8 mb-8">Trending <i className="fi fi-rr-arrow-trend-up"></i></h1>
                 {
                          trendingBlogs==null? <Loader/> :
                          (trendingBlogs.length ? trendingBlogs.map((blog,ind)=>{
                            return (<Animation transition ={{ duration:1 , delay:ind*0.1 }} key={ind}>
                              <MinimalBlogPost blog={blog} ind={ind}/>
                            </Animation>);
                          }):<NoDataMessage message={"No trending blogs"}/>)
                  }
              </div>
 
             </div>
          </section>
        </Animation>
    )
}
export default HomePage;