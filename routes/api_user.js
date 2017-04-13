var express = require('express');
var router = express.Router();
var models = require('../models');
var auth = require('../apiAuth');
var helperFunctions = require('../helperFunctions');

// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Luo uuden käyttäjän
router.post('/', function(req, res, next) {
  var username = req.body.username;
  var name = req.body.name;
  var password = req.body.password;

  // Tarkistetaan ettei ole tyhjiä kenttiä.
  if (!username) {
    return res.status(400).json({error: 'InvalidUserName'});
  }
  else if(!name) {
    return res.status(400).json({error: 'InvalidName'});
  }
  else if(!password) {
    return res.status(400).json({error: 'InvalidPassword'});
  }
  else {

    helperFunctions.createNewUser(username, name, password, function(result) {
      if(result === 201) {
        res.status(201).send("Ok");
      }
      else if(result === 409) {
        return res.status(409).json({error: 'UserNameAlreadyExists'});
      }

      // Käyttäjätunnus ei ollut ollut oikeellinen
      else {
        return res.status(400).json({error: 'InvalidUserName'});
      }
    });
  }
});


// Palauttaa käyttäjän tiedot
router.get('/:username', function(req, res, next) {
  var username = req.params['username'];

  return helperFunctions.returnUserInfo(username, res);
});


// Käyttäjän tietojen päivitys
router.put('/:username', auth, function(req, res, next) {
  var authedUser = req.user;
  var username = req.params['username'];
  var name = req.body.name;
  var password = req.body.password;

  // Vain omia tietoja saa muokata.
  if(authedUser != username) {
    return res.status(403).send("Error: Not authorized");
  }
  // Ei päivitetä, jos tiedot puuttuvat tai ovat tyhjiä.
  else if(!name && !password) {
    return res.status(400).send("error: Empty name or password");
  }
  else {

    helperFunctions.updateUserInfo(username, name, password, function() {
      if(200) {
        return res.status(200).send("Ok");
      }
      else {
        return res.status(404).send("error: User not found");
      }
    })
  }
});


// Palauttaa käyttäjän kirjoitusoikeudelliset blogit
router.get('/:username/blogs', function(req, res, next) {
  var username = req.params['username'];

  helperFunctions.returnAuthoredBlogs(username, function(result, blogInfo) {
    if(result === 200) {
      var blogIds = JSON.parse(JSON.stringify(blogInfo, ['id']));
      return res.status(200).json(blogIds);
    }
    else {
      return res.status(404).send("error: User not found");
    }
  });
});


// Palauttaa käyttäjän seuraamat blogit
router.get('/:username/follows', function(req, res, next) {
  var username = req.params['username'];

  helperFunctions.returnFollowedBlogs(username, function(result, blogInfo) {
    if(result === 200) {
      var blogIds = JSON.parse(JSON.stringify(blogInfo, ['id']));
      return res.status(200).json(blogIds);
    }
    else {
      return res.status(404).send("error: User not found");
    }
  });
});


// Asettaa käyttäjän seuraamaan blogia
router.put('/:username/follows/:id', auth, function(req, res, next) {
  var user = req.user;
  var username = req.params['username'];
  var id = req.params['id'];

  // Vain omia tietoja saa muokata.
  if(user != username) {
    return res.status(403).send("Error: Not authorized");
  }

  else {
    helperFunctions.followBlog(username, id, function(result, message) {
      if(result === 200) {
        return res.status(200).send(message);
      }
      else {
        return res.status(404).send(message);
      }
    });
  }
});


// Poistaa blogiseuraamisen
router.delete('/:username/follows/:id', auth, function(req, res, next) {
  var authedUser = req.user;
  var username = req.params['username'];
  var id = req.params['id'];

  // Vain omia tietoja saa muokata.
  if(authedUser != username) {
    return res.status(403).send("Error: Not authorized");
  }

  else {
    helperFunctions.unFollowBlog(username, id, function(result, message) {
      if(result === 200) {
        return res.status(200).send(message);
      }
      else {
        return res.status(404).send(message);
      }
    });
  }
});


// Asettaa käyttäjän tykkäämään blogikirjoitusta
router.put('/:username/likes/:id', auth, function(req, res, next) {

  var authedUser = req.user;
  var username = req.params['username'];
  var id = req.params['id'];

  // Vain omia tietoja saa muokata.
  if(authedUser != username) {
    return res.status(403).send("Error: Not authorized");
  }
  else {
    helperFunctions.likeBlogpost(username, id, function(result, message) {
      if(result ===200) {
        return res.status(200).send(message);
      }
      else {
        return res.status(404).send(message);
      }
    });
  }
});


// Poistaa käyttäjän blogikirjoitustykkäyksen
router.delete('/:username/likes/:id', auth, function(req, res, next) {

  var authedUser = req.user;
  var username = req.params['username'];
  var id = req.params['id'];

  // Vain omia tietoja saa muokata.
  if(authedUser != username) {
    return res.status(403).send("Error: Not authorized");
  }
  else {
    helperFunctions.unLikeBlogpost(username, id, function(result, message) {
      if(result ===200) {
        return res.status(200).send(message);
      }
      else {
        return res.status(404).send(message);
      }
    });
  }
});


module.exports = router;