import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid'
import jwt from 'jsonwebtoken'
import cors from 'cors';
import admin from 'firebase-admin';
//Schema below
import User from './Schema/User.js'
import Blog from './Schema/Blog.js'
import Notification from './Schema/Notification.js'
import Comment from './Schema/Comment.js'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccountKey = require('./react-js-blog-website-5fbd6-firebase-adminsdk-fbsvc-5cadd9d132.json');
import { getAuth } from 'firebase-admin/auth'
import aws from "aws-sdk"
dotenv.config();  // Load environment variables
const server=express();
let PORT=3000;
admin.initializeApp({
    credential:admin.credential.cert(serviceAccountKey)
})
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
server.use(express.json());//this will enable json sharing
server.use(cors());
mongoose.connect(process.env.DB_LOCATION,{
    autoIndex:true
})
//zsetting up s3 bucket
const s3=new aws.S3({
    region:'eu-north-1',
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
});
const generateUploadURL= async ()=>{
    const date=new Date()
    const imageName=`${nanoid()}-${date.getTime()}.jpeg`
    return await s3.getSignedUrlPromise('putObject',{
        Bucket:`blogging-website-react-ritu`,
        Key:imageName,
        Expires:1000,
        ContentType:"image/jpeg"
    })
}
const verifyJWT=(req,res,next)=>{
    const authHeader=req.headers['authorization'];//this will give the authorization value which is Bearer then authentication key
    const token= authHeader && authHeader.split(" ")[1];
    if(token==null){
        return res.status(401).json({"error":"No access token"})
    }
    jwt.verify(token,process.env.SECRET_ACCESS_KEY,(err,user)=>{
        if(err){
            return res.status(403).json({"error":"Access token is invalid"})
        }
        req.user=user.id;
        next()
    })
}
const formatDataToSend=(user)=>{
    const access_token=jwt.sign({id:user._id} , process.env.SECRET_ACCESS_KEY)//to convert the data into a long web token , i also have to give a long private key 
    return{
        access_token,
        profile_img:user.personal_info.profile_img,
        username:user.personal_info.username,
        fullname:user.personal_info.fullname
    }
}
const generateUsername=async(email)=>{
    let username=email.split('@')[0]
    let isUsernameNotUnique=await User.exists({"personal_info.username": username}).then((result)=>result)
    isUsernameNotUnique?username+=nanoid().substring(0,5):"";
    return username;
}
//upload image url route
server.get('/get-upload-url',(req,res)=>{
    generateUploadURL().then(url=>res.status(200).json({uploadURL : url})).catch(err=>{
        console.log(err.message);
        return res.status(500).json({ error : err.message })
    })
})
server.post("/signup",(req,res)=>{
    let { fullname , email , password } = req.body;
    //Validating the data from frontend
    if(fullname.length<3){
        return res.status(403).json({
            "error":"Fullname must be atleast 3 letters long"
        })//403 is invalidation status code
    }
    if(!email.length){
        return res.status(403).json({"error":"Enter email"})
    }
    if(!emailRegex.test(email)){
        return res.status(403).json({"error":"Email is invalid"})
    }
    if(!passwordRegex.test(password)){
        return res.status(403).json({"error":"Password is Invalid : should be 6 to 20 characters long with atleast one numeric , one lowercase and one uppercase character."});
    }
    bcrypt.hash(password,10,async(err,hashed_password)=>{
        let username=await generateUsername(email);
        let user=new User({
            personal_info:{ fullname , email , password : hashed_password , username }
        })
        user.save().then((u)=>{
            return res.status(200).json(formatDataToSend(u))
        }).catch(e=>{
            if(e.code==11000){//whenever mongoose encounters a duplication error
              return res.status(500).json({"error":"Email already exists"})
            }
            return res.status(500).json({"error":e.message})//500 for internalserver error
        })
    })
})
server.post("/signin",(req,res)=>{
    let { email, password }=req.body
    User.findOne({"personal_info.email" : email}).then((User)=>{
        if(User==null){
            return res.status(403).json({"error":"Email not found"})
        }
        if(!User.google_auth){
            bcrypt.compare(password,User.personal_info.password,(err,result)=>{
                if(err)
                return res.status(403).json({"error":"Error ocurred during Login"})
                if(!result)
                 return res.status(403).json({"error":"Incorrect password"})
                else{
                  return res.status(200).json(formatDataToSend(User))
                }
             })
        }
        else{
            return res.status(403).json({"error":"Account was created using Google."})
        }
      
    })
    .catch(err=>{
        return res.status(500).json({"error":err.message})
    })
})
server.post('/google-auth',async(req,res)=>{
    console.log("Received Google Auth request with:", req.body);
    let { access_token } =req.body;
    getAuth().verifyIdToken(access_token).then(async(decodedUser)=>{
        let {  email , name }=decodedUser;
        console.log(email , name )
        let user=await User.findOne({"personal_info.email" : email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u)=>{
            console.log(u)
            return u||null;
        }).catch((err)=>{
            return res.status(500).json({"error":err.message})
        })
        if(user){
           if(!user.google_auth){//login
              return res.status(403).json({"error":"This email was signed up without google . Please login with password to access the account"})
           }
        }
        else{//signup
            let username=await generateUsername(email)
            console.log("Username" ,username)
            user=new User({
                personal_info:{
                    fullname:name,
                    email,
                    username
                },
                google_auth:true
            })
            await user.save().then((u)=>{
                user=u;
            }).catch((err)=>{
                return res.status(500).json({"error":err.message})
            })
        }
        return res.status(200).json(formatDataToSend(user))
    }).catch(err=>{return res.status(500).json({"error":"Failed to authenticate you with google. Try with some other account ."})})

})
server.post('/create-blog', verifyJWT ,(req,res)=>{
    let authorId=req.user;
    let {title , desc , banner , tags , content , draft , id }=req.body;
    console.log("Recieved blog data",req.body)
    if(!title || !title.length){
        return res.status(403).json({"error":"You must provide a title to publish the blog"})
    }
    if(!draft)
    {
        if(!desc || !desc.length || desc.length>200){
            return res.status(403).json({"error":"You must provide blog description under 200 characters."})
        }
        if(!banner || !banner.length){
            return res.status(403).json({"error":"You must provide a blog banner to publish it"})
        }
        if(!content || !content.blocks ||!content.blocks.length){
            return res.status(403).json({"error":"There must be some blog content to publish it"})
        }
        if(!tags || !tags.length || tags.length>10){
            return res.status(403).json({"error":"Provide tags in order to publish the blog , max 10"})
        }
    }
    tags=tags.map(tag=>tag.toLowerCase())
    let blogId=id ? id : title.replace(/[^a-zA-Z0-9]/g,' ').replace(/\s+/g,"-").trim()+nanoid();
    if(id){
        console.log("Updating blog with id",id)
        console.log("Draft:",draft)
        Blog.findOneAndUpdate({ blog_id:blogId },{ title , des:desc , banner , content , tags , draft: draft ? draft : false })
        .then( blog=>{
            return res.status(200).json({ id :  blogId })
        })
        .catch(err=>{
            return res.status(500).json({error:"Failed to update total post no."})
        })

    }
    else{
        let blog=new Blog({
            title,
            des:desc,
            banner,
            content,
            tags,
            author:authorId ,
            blog_id:blogId,
            draft:Boolean(draft)
        })
        blog.save().then(blog=>{
            let incrementVal= draft ? 0:1;
            User.findOneAndUpdate({_id:authorId},{$inc:{"account_info.total_posts": incrementVal } , $push:{"blogs":blog._id}}).then(user=>{
                console.log(blog.blog_id)
                return res.status(200).json({id:blog.blog_id})
            }).catch(err=>{
                return res.status(500).json({"error":"Failed to update total posts number"})
            })
        }).catch(err=>{
            return res.status(500).json({"error":err.message})
        })

    }
})
server.post("/all-latest-blogs-count",(req,res)=>{
    Blog.countDocuments({ draft:false })
    .then(count=>{
        return res.status(200).json({ totalDocs:count })
    }).catch(err=>{
        console.log(err.message)
        return res.status(500).json({error : err.message})
    })
})
server.get("/trending-blogs",(req,res)=>{
    Blog.find({ draft:false}).populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id").sort({"activity.total_reads":-1,"activity.total_likes":-1,"publishedAt":-1})
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then(blogs=>{
        return res.status(200).json({blogs})
    }).catch(err=>{
        return res.status(500).json({"error":err.message})
    })
})
server.post("/search-blogs", (req,res)=>{
    console.log(req.body)
    let { tag , query , author , page , limit } =req.body;
    let findQuery;
    if(tag){
        findQuery= { tags : { $in: [tag] }, draft:false } 
    }else if(query){
        findQuery={ draft:false , title : new RegExp(query , "i")}
    }else if(author){
        findQuery={ author , draft:false }
    }
    let maxLimit=limit?limit:2;
    Blog.find(findQuery).populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip(maxLimit*(page-1))
    .limit(maxLimit)
    .then( blogs =>{
        console.log(blogs)
        return res.status(200).json({ blogs })
    }).catch(err=>{
        res.status(500).json({"error":err.message})
    })
})
server.post("/search-blogs-count",(req,res)=>{
    let { tag , author , query  } =req.body;
    let findQuery;
    if(tag){
        findQuery= { tags : { $in: [tag] }, draft:false } 
    }else if(query){
        findQuery={ draft:false , title : new RegExp(query , "i")}
    }
    else if(author){
        findQuery={ author , draft:false }
    }
    Blog.countDocuments(findQuery)
    .then(count=>{
        return res.status(200).json({ totalDocs:count })
    }).catch(err=>{
        console.log(err.message)
        return res.status(500).json({ error:err.message })
    })
})
server.post('/latest-blogs',(req,res)=>{
    let { page }=req.body
    let maxLimit=5;
    Blog.find({ draft:false }).populate("author","personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({"publishedAt":-1})
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip(5*(page-1))
    .limit(maxLimit)
    .then( blogs =>{
        return res.status(200).json({ blogs })
    }).catch(err=>{
        res.status(500).json({"error":err.message})
    })
})
server.post("/search-users",(req,res)=>{
    let { query }=req.body;
    User.find({ "personal_info.username": new RegExp(query , "i")})
    .limit(50)
    .select("personal_info.username personal_info.fullname personal_info.profile_img -_id")
    .then((users)=>{
        return res.status(200).json({ users })
    })
    .catch(err=>{
        return res.status(500).json({"error":err.message})
    })

})
server.post("/get-profile", (req,res)=>{
    let { username }=req.body;
    User.findOne({ "personal_info.username":username })
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then(user=>{
        return res.status(200).json({user})
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })
})
server.post("/get-blog",(req,res)=>{

    let { blog_id , draft , mode  }=req.body;
    let incrementVal=mode!='edit'?1:0;
    Blog.findOneAndUpdate({ blog_id },{ $inc : { "activity.total_reads": incrementVal }}) 
    .populate("author" , "personal_info.fullname  personal_info.username personal_info.profile_img")
    .select("title des content banner activity publishedAt blog_id tags")
    .then(blog=>{
        User.findOneAndUpdate({"personal_info.username": blog.author.personal_info.username},{ $inc : {"account_info.total_reads":incrementVal}}).catch(err=>{ return res.status(500).json({err:err.message})})
        if(blog.draft && !draft){
            return res.status(500).json({error:"You cannot access draft blog"})
        }
        return res.status(200).json({ blog });
    }).catch(err=>{
        return res.status(500).json({err:err.message})
    })
   
})  
server.post("/like-blog",verifyJWT,(req,res)=>{
    let user_id=req.user;
    let { _id, isLikedByUser }=req.body;
    let incerementVal=isLikedByUser?1:-1;
    Blog.findOneAndUpdate({ _id },{ $inc : { "activity.total_likes" : incerementVal}}).then(blog=>{
        if(isLikedByUser){
          let like=new Notification({
            type:"like",
            blog:_id,
            notification_for:blog.author,
            user:user_id
          })
          like.save().then(notification=>{
            return res.status(200).json({liked_by_user:true})
          })
        }else{
            Notification.findOneAndDelete({ user: user_id , blog: _id , type:"like"})
            .then(data=>{
                return res.status(200).json({liked_by_user:false})

            }).catch(err=>{
                return res.status(500).json({error:err.message})
            })
        }
    })
})
server.post("/isliked-by-user",verifyJWT,(req,res)=>{
    let user_id=req.user;
    let { _id }=req.body;
    Notification.exists({ user : user_id , type :"like" , blog:_id })
    .then(result=>{
        return res.status(200).json({ "result": result })
    })
    .catch(err=>{
        return res.status(500).json({error:err.message})
    })
    
})
server.post("/add-comment",verifyJWT,(req,res)=>{
    let user_id=req.user;
    let { _id, comment , blog_author }=req.body;
    if(!comment.length){
        return res.status(403).json({error:"Write something to leave a comment"})
    }
    //creating a comment dot
    let commentObj= new Comment ({
        blog_id:_id,
        blog_author,
        comment,
        commented_by:user_id
    }
    )
    commentObj.save().then(commentFile=>{
      let { _comment , commentedAt , children }=commentFile;
      Blog.findOneAndUpdate({ _id },{ $push : { "comments" : commentFile._id },$inc:{ "activity.total_comments" : 1 },"activity.total_parent_comments":1})
      .then(blog=>{
        console.log('New comment created')
      })
      let notificationObj={
        type:"comment",
        blog:_id,
        notification_for: blog_author,
        user:user_id,
        comment:commentFile._id
      }
      new Notification(notificationObj).save().then(notification=>console.log('new notification created'))
      return res.status(200).json({
        comment , commentedAt , _id :commentFile._id , children
      })
    })

}
)
server.post("/get-blog-comments", (req,res)=>{
    let { blog_id , skip }=req.body;
    let maxLimit=5;
    Comment.find({ blog_id , isReply:false })
    .populate("comment_by","personal_info.username personal_info.fullname personal_info.profile_img")
    .skip(skip)
    .limit(maxLimit)
    .sort({
        'commentedAt':-1
    })
    .then(comment=>{
        return res.status(200).json(comment);
    })
    .catch(err=>{
        console.log(err)
        return res.status(500).json({error:err.message})
    })
})
server.listen(PORT,()=>{
    console.log("Listening on Port",PORT)
})