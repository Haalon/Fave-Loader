const fs = require('fs');
const path = require('path');
var https = require('https');
const dir = process.argv[2]||"pics";
const vkapi = new (require('node-vkapi'))({ accessToken: '0b0c4a8ad8e381e0edd60ae2e245744688a894f60a323b96891d725937c045b0dfa8ee172517003b1e9e6', scope:    262143 });
const mkdirSync = function (dirPath) {
  try {
    fs.mkdirSync(dirPath)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    //else console.log(dirPath+ " already EEXIST");
  }
}

const mkdirpSync = function (dirPath) {
  const parts = dirPath.split(path.sep)

  // For every part of our path, call our wrapped mkdirSync()
  // on the full path until and including that part
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

const stealPic = function(favePic, savePath) {
	return new Promise((resolve, reject) => {
		var url = favePic.photo_2560||favePic.photo_1280|| favePic.photo_807||favePic.photo_604||favePic.photo_130||favePic.photo_75;
		//console.log(favePic);
		var request = https.get(url, function(response) {
  			response.pipe(fs.createWriteStream(savePath+path.sep+favePic.id+".jpg"))
  			response.on("end", () => {
				return resolve("succ");
			});
			response.on("error", error => {
				console.log("не удалось сохранить картинку по адресу: "+url);
				console.error(error);
				return resolve("succ");
			});   			
		});
	});	
}

const stealMany = function( offset) {

	//if(offset>=1000) return;
	
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



	
	
	

/*


https://oauth.vk.com/authorize?client_id=6245028&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=friends&response_type=token&v=5.52

//console.log(path.sep+ "\\");



mkdirpSync(dir);

var request = https.get("https://pp.userapi.com/c841026/v841026291/18f5f/LOyk3RA4_vY.jpg", function(response) {
  response.pipe(fs.createWriteStream(dir+"\\"+"test.jpg"));
});

var request = https.get("https://pp.userapi.com/c841239/v841239434/39346/dNpIVM7u3qI.jpg", function(response) {
  response.pipe(fs.createWriteStream(dir+"\\"+"test2.jpg"));
});
*/
/*


vkapi.call("fave.getPosts",{offset: 100, count: 30, extended: 0})
.then( function (fave){ fave.items.forEach(function(item, i, arr){ console.log(item), console.log(""); }) })
.catch(error => console.error(error));
*/
/*
vkapi.call("users.get",{user_ids: haalon, fields: "photo_id, verified, sex, bdate, city, country, home_town, has_photo, photo_50, photo_100, photo_200_orig, photo_200, photo_400_orig, photo_max, photo_max_orig, online, domain, has_mobile, contacts, site, education, universities, schools, status, last_seen, followers_count, common_count, occupation, nickname, relatives, relation, personal, connections"})
.then( users=> console.dir(users))
.catch(error => console.error(error));
//69648193
//20a60be9b5000ebd76fc9039c4ae26b591c4709881ddf282f98b5a0c5e8c7f34b381749e61177243f71d2
/*
var file = fs.createWriteStream("test.jpg");
var request = http.get("https://pp.userapi.com/c840326/v840326356/1eac8/lO7IKaGa2ow.jpg", function(response) {
  response.pipe(file);
});
console.log("hello world");*/
//console.log(vkapi);