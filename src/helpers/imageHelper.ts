import axios from "axios";

export async function getImagesFromApi(name:string) {
    try {
        const response = await axios.get(`https://pixabay.com/api/?key=53125376-896f2989a8414f13023c71159&q=${name}&image_type=photo&page=1&per_page=10`,{
            headers: {
                "X-Ratelimit-Limit":1000
            }
        });
        const images = response.data.hits.map((item:any)=>item.webformatURL)

        
        
        return images
    } catch (error) {
        console.log(error);
        
    }
}