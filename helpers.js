//get user by email and returns the user object
const getUserByEmail = (email, userDatabase) => {
	for (let user in userDatabase) {
    let existingEmails = userDatabase[user].email;
    if(email === existingEmails){
      return userDatabase[user].id;
    }
  }
};

//Generates a random string, used for creating short URLs and userIDs
const generateRandomString = () => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 6) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};
  
//check if shorten URL exists
const checkURL = (id, urlDatabase) => {
    for (let url in urlDatabase) {
        if(id === url){
            return true;
        }
    }
    return false;
};

//Returns an object of short URLs specific to the passed in userID
const urlsForUser = (id, urlDatabase) => {
    let userUrls = {};
    for (let shortUrl in urlDatabase) {
        let userId = urlDatabase[shortUrl].userID;
        if(userId === id){
            userUrls[shortUrl] = urlDatabase[shortUrl];
        }
    }
    return userUrls;
};

  //Checks if current cookie corresponds with a user in the userDatabase
const cookieMatchUser = function(cookie, userDatabase) {
    for (const user in userDatabase) {
      if (cookie === user) {
        return true;
      }
    } return false;
};

module.exports = {
    getUserByEmail,
    generateRandomString,
    checkURL,
    urlsForUser,
    cookieMatchUser
};