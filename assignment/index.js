import express from 'express';
import axios from 'axios';
import _ from 'lodash';

const app=express();
const port=3000;
const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
const header={headers:{'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'}}

app.get('/',(req,res)=>{
    console.log('home');
})

const cache = _.memoize(async (key, fetchFunction) => {
    try {
        const result = await fetchFunction();
        return result;
    } catch (error) {
        console.log(error);
    }
}, (key) => key);
  

app.get('/api/blog-stats',async (req,res)=>{
    const cacheKey = 'blog-stats';
    const fetchBlogData = async () => {
        const response = await axios.get(apiUrl,header);
        const blogData = response.data.blogs;

        const totalBlogs = blogData.length;
        const longestTitle = _.maxBy(blogData, 'title.length').title;

        const privacyBlogs = _.filter(blogData, (blog) =>
            _.includes(_.toLower(blog.title), 'privacy')
        );
        const privacyBlogCount = privacyBlogs.length;

        const uniqueTitles = _.uniqBy(blogData, 'title');
        const uniqueArray=[];

        uniqueTitles.map(blog=>{
            uniqueArray.push(blog.title);
        })

        const result = {
            totalBlogs,
            longestTitle,
            privacyBlogCount,
            uniqueArray,
        };

        return result;
    };

    try {
    const cachedResult = await cache(cacheKey, fetchBlogData);

    res.json({cachedResult});
    } catch (error) {
    console.error('Error fetching or analyzing blogs:', error);
    }
});


app.get('/api/blog-search', async (req, res) => {
    const cacheKey = `blog-search-${req.query.query || 'default'}`;
    const fetchBlogSearchResults = async () => {
        const response = await axios.get(apiUrl,header);

        const blogData = response.data.blogs;

        const searchQuery = req.query.query || '';

        const searchResults = blogData.filter((blog) =>
        _.toLower(blog.title).includes(_.toLower(searchQuery))
        );

        const result = {
        query: searchQuery,
        results: searchResults,
        };

        return result;
    };

    try {
        const cachedResults = await cache(cacheKey, fetchBlogSearchResults);

        res.json({cachedResults});
    } catch (error) {
        console.error('Error fetching or searching blog:', error);
    }
});



app.listen(port,(req,res)=>{
    console.log(`listening on port ${port}`); 
});
