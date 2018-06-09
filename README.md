# Fave-Loader
Get all pictures from your favourite posts(the posts you have liked) in VK, and sort them by groups. Works with VK API via node.js 

__important note__: currently, because of vk api weirdness, only first 1000 fav.posts are accessible. I hope they will fix that, but now there is no fast way to access such old fav.posts.
## dependencies
```node-vkapi```
## installation
* install node.js and npm: https://nodejs.org/en/
* save ```vk.js``` to any directory
* choose that direcory in console and run ```npm install node-vkapi --only=prod```. "node_modules" directory should appear there
## access token
  You need to get an access token, in order to use vk-api.
  You can get it here:
  https://oauth.vk.com/authorize?client_id=6256704&display=page&scope=friends,wall&redirect_uri=https://oauth.vk.com/blank.html&response_type=token&v=5.52
  
  It will be in the adress bar;
  
  More info on tokens here: https://vk.com/dev/implicit_flow_user;
## usage
1. choose directory with ```vk.js``` in console
2. run ```node vk.js TOKEN PATH``` where TOKEN is your acess token, and PATH(optional) is the directory you want all pictures to be saved.
