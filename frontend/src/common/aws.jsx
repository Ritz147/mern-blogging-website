//will take an image as an argument and it will upload the image to the aws bucket and will return the image url back telling that the image is uploaded successfully
import axios from "axios"
export const uploadImage =async (img) => {
     let imgUrl=null;
     await axios.get(import.meta.env.VITE_SERVER_DOMAIN+"/get-upload-url").then( async ({ data:{ uploadURL}})=>{
        await axios({
            method:'PUT',
            url: uploadURL ,
            headers : { 'Content-Type' : 'multipart/form-data'},
            data:img
        })
        .then(()=>{
            imgUrl=uploadURL.split('?')[0];
        })
     })
     return imgUrl; 
}