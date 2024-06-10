const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

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

const getUserByEmail = (emailToCheck) => {
	for (let user in users) {
    let existingEmails = users[user].email;
    if(emailToCheck === existingEmails){
      return users[user];
    }
  }
}

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
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  const templateVars = generateRandomString();
  if (req.body.longURL.includes("https://") || req.body.longURL.includes("http://")) {
    urlDatabase[templateVars] = req.body.longURL;
  } else {
    urlDatabase[templateVars] = `https://${req.body.longURL}`;
  }
  //res.send(`ok`); // Respond with 'Ok' (we will replace this)
  res.redirect(`/urls/${templateVars}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { 
      user: users[req.cookies.user_id]
    };
    res.render("register", templateVars);
  }
});

app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { 
      user: users[req.cookies.user_id]
    };
    res.render("login", templateVars);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL
  res.redirect('/urls');
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
