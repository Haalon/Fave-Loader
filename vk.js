const fs = require('fs');
const path = require('path');
const https = require('https');
const dir = process.argv[2]||"pics";
const vkapi = new (require('node-vkapi'))({ accessToken: 'put it here', scope:    262143 });

/* to get token, visit:
https://oauth.vk.com/authorize?client_id=6245028&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=friends&response_type=token&v=5.52
it will have it in URL
*/

const mkdirSync = function (dirPath) {
  try {
    fs.mkdirSync(dirPath)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;    
  }
}

const mkdirpSync = function (dirPath) {
  const parts = dirPath.split(path.sep)

  for (let i = 1; i <= parts.length; i++) {
    mkdirSync(path.join.apply(null, parts.slice(0, i)));
  }
}

var illegalRe = /[\/\?<>\\:\*\|":]/g;
var controlRe = /[\x00-\x1f\x80-\x9f]/g;
var reservedRe = /^\.+$/;
var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
var windowsTrailingRe = /[\. ]+$/;

function sanitize(input, replacement) {
	if(replacement==undefined) replacement="";
  	var sanitized = input
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsTrailingRe, replacement)
    .replace(windowsReservedRe, replacement);
	return sanitized;
}

var groups = [];
var profiles = [];

const getGroupName = function(id) {
	return sanitize(groups.find( arg => {return arg.id==id}).name);
}

const getPersonName = function(id) {	
	var res = profiles.find( arg => {return arg.id==id});
	return sanitize(res.first_name+ " "+ res.last_name);
}

const getAuthor = function(id) {	
	if(id<0) return getGroupName(-id);
	else return getPersonName(id);	
}

const checkAttach = function(attachments){
	if(attachments==undefined) return false;	
	for (var i = 0; i < attachments.length; i++) {
		if(attachments[i].type=="photo") return true;
	}
	return false;
}

const stealPic = function(favePic, savePath) {
	return new Promise((resolve, reject) => {
		var url = favePic.photo_2560||favePic.photo_1280|| favePic.photo_807||favePic.photo_604||favePic.photo_130||favePic.photo_75;
		var request = https.get(url, function(response) {
  			response.pipe(fs.createWriteStream(savePath+path.sep+favePic.id+".jpg"))
  			response.on("end", () => {
				return resolve("succ");
			});
			response.on("error", error => {
				console.log("не удалось сохранить картинку по адресу: "+url);
				console.error(error);
				return resolve("semi-succ");
			});   			
		});
	});	
}

const stealPost = function(favePost) {	
	return new Promise((resolve, reject) => {
	
		if(favePost.copy_history !== undefined) favePost = favePost.copy_history.pop();
		if(!checkAttach(favePost.attachments)) return console.log("empty post"),resolve("succ");
		
		result = getAuthor(favePost.owner_id)
		
		console.log("steeling pics from group: "+result);
		console.log(" from post №: "+ favePost.id);
		console.log("");
		var savePath = dir+path.sep+result;
		mkdirpSync(savePath);
		var filtered = favePost.attachments.filter(arg => {return arg.type=="photo"});
		Promise.all( filtered.map( function(arg) { return stealPic(arg.photo, savePath) }))
		.then( result => {
			return resolve("succ");
		}) 
	});	
	
}

const stealMany = function( offset) {
	
	vkapi.call("fave.getPosts",{offset: offset, count: 50, extended: 1})
	.then( function (fave){ 
		console.log("********************** stealing posts in range: " + offset+" - " +(offset+49) +" **********************" );
		groups=fave.groups;
		profiles=fave.profiles;

		return Promise.all( fave.items.map(stealPost));		
	})
	.then( result => {
		//console.log(groups);
		console.log(result.length);

		stealMany(offset+result.length);
	} ) 
	.catch( error => {console.log(error)});	
}
stealMany(0);
	
	

