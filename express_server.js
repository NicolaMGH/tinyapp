const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString, checkURL, urlsForUser, cookieMatchUser } = require("./helpers"); 

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['NICK'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

//routes
app.get("/", (req, res) => {
  if (cookieMatchUser(req.session.user_id, users)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//shows urls that the user created
app.get("/urls", (req, res) => {
  const templateVars = { 
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_index", templateVars);
});

//shows new url creation page
app.get("/urls/new", (req, res) => {
  if (cookieMatchUser(req.session.user_id, users)) {
    const templateVars = { 
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

//shows url specific details
app.get("/urls/:shortUrl", (req, res) => {
  if (urlDatabase[req.params.shortUrl]) {
    const templateVars = { 
      shortUrl: req.params.shortUrl, 
      longURL: urlDatabase[req.params.shortUrl].longURL,
      databaseUserID: urlDatabase[req.params.shortUrl].userID,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("The short URL you entered does not exist.");
  }
});

//uses shortened url to redirect to long url
app.get("/u/:id", (req, res) => {
  if (checkURL(req.params.id, urlDatabase)) {
    const longURL = urlDatabase[req.params.id].longURL
    res.redirect(longURL);
  } else {
    res.send('Sorry, URL not found.')
  }
});

//shows register page if no user is logged in
app.get("/register", (req, res) => {
  if (cookieMatchUser(req.session.user_id, users)) {
    res.redirect('/urls');
  } else {
    const templateVars = { 
      user: users[req.session.user_id]
    };
    res.render("register", templateVars);
  }
});

//shows login page if no user is logged in
app.get("/login", (req, res) => {
  if (cookieMatchUser(req.session.user_id, users)) {
    res.redirect('/urls');
  } else {
    const templateVars = { 
      user: users[req.session.user_id]
    };
    res.render("login", templateVars);
  }
});

//creates new url and assigns user id
app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  if (req.session.user_id) {
    const randomId = generateRandomString();
    if (req.body.longURL.includes("https://") || req.body.longURL.includes("http://")) {
      urlDatabase[randomId] = {longURL: req.body.longURL, userID: req.session.user_id};
    } else {
      urlDatabase[randomId] = {longURL:`https://${req.body.longURL}`, userID: req.session.user_id};
    }
    res.redirect(`/urls/${randomId}`);
  } else {
    res.status(401).send("Please login to shorten URL");
  }
});

//delete url
app.post("/urls/:shortUrl/delete", (req, res) => {
  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID, urlDatabase);
  if (Object.keys(userURLs).includes(req.params.shortUrl)) {
    delete urlDatabase[req.params.shortUrl]
    res.redirect('/urls');
  } else if (urlDatabase[req.params.shortUrl]) {
    res.status(401).send("You do not have authorization to delete this URL.");
  } else {
    res.status(404).send("URL doesn't exist.");
  }
});

//edit url
app.post("/urls/:shortUrl/edit", (req, res) => {
  const userID = req.session.user_id;
  const userURLs = urlsForUser(userID, urlDatabase);
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
  }
});

//checks if email exists and compares password to login
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = user;
      res.redirect('/urls');
    } else {
      res.status(403).send('Sorry, password is incorrect.')
    }
  } else{
    res.status(403).send('Sorry, email not found.')
  }
});

//logs user out and clears session cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

//creates user account storing email, hashed password and id
app.post("/register", (req, res) => {
  const emailLength = req.body.email.trim().length;
  const passwordLength = req.body.password.trim().length;
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('Sorry, email already exisits.')
  } else if (emailLength === 0 || passwordLength === 0){
    res.status(400).send('Sorry, email or password field empty.')
  } else {
    const randomId = generateRandomString();
      users[randomId] = {
      id: randomId,
      email: req.body.email.trim(),
      password: bcrypt.hashSync(req.body.password.trim(), 10)
    };
    req.session.user_id = randomId;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`TinyURL app listening on port ${PORT}!`);
});