const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.set("view engine", "ejs");

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};


const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
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
}

//get user by email and returns the user object
const getUserByEmail = (emailToCheck) => {
	for (let user in users) {
    let existingEmails = users[user].email;
    if(emailToCheck === existingEmails){
      return users[user];
    }
  }
}

//check if shorten URL exists
const checkURL = (id) => {
	for (let url in urlDatabase) {
    if(id === url){
      return true;
    }
  }
};

//Returns an object of short URLs specific to the passed in userID
const urlsForUser = (id) => {
  let userUrls = {};
  for (let shortUrl in urlDatabase) {
    let userId = urlDatabase[shortUrl].userID;
    if(userId === id){
      userUrls[shortUrl] = urlDatabase[shortUrl];
  	}
	}
   return userUrls;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    user: users[req.cookies.user_id],
    urls: urlsForUser(req.cookies.user_id)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id) {
    const templateVars = { 
      user: users[req.cookies.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  };
});

app.get("/urls/:shortUrl", (req, res) => {
  if (urlDatabase[req.params.shortUrl]) {
    const templateVars = { 
      shortUrl: req.params.shortUrl, 
      longURL: urlDatabase[req.params.shortUrl].longURL,
      databaseUserID: urlDatabase[req.params.shortUrl].userID,
      user: users[req.cookies.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("The short URL you entered does not exist.");
  }
});

app.get("/u/:id", (req, res) => {
  if (checkURL(req.params.id)) {
    const longURL = urlDatabase[req.params.id].longURL
    res.redirect(longURL);
  } else {
    res.send('Sorry, URL not found.')
  }
});

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { 
      user: users[req.cookies.user_id]
    };
    res.render("register", templateVars);
  };
});

app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { 
      user: users[req.cookies.user_id]
    };
    res.render("login", templateVars);
  };
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  if (req.cookies.user_id) {
    const randomId = generateRandomString();
    if (req.body.longURL.includes("https://") || req.body.longURL.includes("http://")) {
      urlDatabase[randomId] = {longURL: req.body.longURL, userID: req.cookies.user_id};
    } else {
      urlDatabase[randomId] = {longURL:`https://${req.body.longURL}`, userID: req.cookies.user_id};
    }
    //res.send(`ok`); // Respond with 'Ok' (we will replace this)
    console.log(urlDatabase);
    res.redirect(`/urls/${randomId}`);
  } else {
    res.status(401).send("Please login to shorten URL");
    res.redirect('/login');
  };
});

app.post("/urls/:shortUrl/delete", (req, res) => {
  const userID = req.cookies.user_id;
  const userURLs = urlsForUser(userID);
  if (Object.keys(userURLs).includes(req.params.shortUrl)) {
    delete urlDatabase[req.params.shortUrl]
    res.redirect('/urls');
  } else if (urlDatabase[req.params.shortUrl]) {
    res.status(401).send("You do not have authorization to delete this URL.");
  } else {
    res.status(404).send("URL doesn't exist.");
  };
});

app.post("/urls/:shortUrl/edit", (req, res) => {
  const userID = req.cookies.user_id;
  const userURLs = urlsForUser(userID);
  if (Object.keys(userURLs).includes(req.params.shortUrl)) {
    if (req.body.newURL.includes("https://") || req.body.newURL.includes("http://")) {
    urlDatabase[req.params.shortUrl].longURL = req.body.newURL
    } else {
      urlDatabase[req.params.shortUrl].longURL = `https://${req.body.newURL}`;
    }
    res.redirect('/urls');
  } else if (urlDatabase[req.params.shortUrl]) {
    res.status(401).send("You do not have authorization to edit this URL.");
  } else {
    res.status(404).send("URL doesn't exist.");
  };
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email);
  if (user) {
    if (user.password === req.body.password) {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    } else {
      res.status(403).send('Sorry, password is incorrect.')
    }
  } else{
    res.status(403).send('Sorry, email not found.')
  };
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.post("/register", (req, res) => {
  const emailLength = req.body.email.trim().length;
  const passwordLength = req.body.password.trim().length;
  if (getUserByEmail(req.body.email)) {
    res.status(400).send('Sorry, email already exisits.')
  } else if (emailLength === 0 || passwordLength === 0){
    res.status(400).send('Sorry, email or password field empty.')
  } else {
    const randomId = generateRandomString();
      users[randomId] = {
      id: randomId,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', randomId);
    res.redirect('/urls');
  };
});
