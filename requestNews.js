var a;
const request = require('request');
request('https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=d0938a385de04203b18d2d4fe3c4271b',function(error,response,body){
    var data = JSON.parse(body);
    data.articles.map((article) => {
        console.log(article.title);
    });
});