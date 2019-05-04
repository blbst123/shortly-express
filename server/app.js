const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);



app.get('/',
  (req, res) => {
    if (req.session.user === undefined) {
      res.redirect('/login');
    }
    else {
      res.render('index');
    }
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', (req, res, next) => {
  res.render('login');
});

app.post('/login', (req, res, next) => {
  var options = {
    username: req.body.username,
    password: req.body.password
  };

  var userPromise = models.Users.get({ username: req.body.username });

  userPromise.then(function (user) {
    if (user !== undefined && models.Users.compare(options.password, user.password, user.salt)) {
      res.redirect('/');
      next();
    } else {
      res.redirect('/login');
      next();
    }
  });
});

app.get('/signup', (req, res, next) => {
  res.render('signup');
});

app.post('/signup', (req, res, next) => {
  var options = {
    username: req.body.username,
    password: req.body.password
  };

  var checkIfUsernameExist = models.Users.get({ username: req.body.username });

  checkIfUsernameExist.then(function (result) {
    if (result === undefined) {
      return models.Users.create(options);
    } else {
      throw 'username already exists';
    }
  })
    .then((user) => {
      models.Sessions.update({ id: req.session.id }, { userId: user.insertId });
    })
    .catch(err => {
      res.redirect('/signup');
      console.log(err);
    })
    .then(() => {
      res.redirect('/');
      next();
    });
});

app.get('/logout', (req, res, next) => {
  console.log(req.session);
  models.Sessions.delete({ id: req.session.id })
    .then(() => {
      res.clearCookie('shortlyid');
      next();
    });
});


// app.post('/logout', (req, res, next) => {
//   console.log("HERE");
//   console.log(req.session.id);
//   models.Sessions.delete({id: req.session.id})
//   .then(() => {
//     res.clearCookie('shortlyid');
//     next();
//   });
// });

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
