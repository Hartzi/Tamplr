var express = require('express');
var router = express.Router();
var models = require('../models');
var auth = require('../apiAuth');
var helperFunctions = require('../helperFunctions');

// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Uuden blogin luominen
router.post('/', auth, function(req, res, next) {

  var authedUser = req.user;
  var name = req.body.name;

  helperFunctions.createNewBlog(name, authedUser, function(result, id) {
    if(result === 201) {
      return res.status(201).json({"id": id});
    }
    else {
      return res.status(400).send("Error: Name empty or missing");
    }
  });
});


// Blogin tietojen hakeminen
router.get('/:id', function(req, res, next) {

  var id = req.params['id'];

  helperFunctions.getBlogInfo(id, function(result, blog) {
    if(result === 200) {
      return res.status(200).json({"id": blog.id, "name": blog.name});
    }
    else {
      return res.status(404).send("Error: Blog not found");
    }
  });
});


// Blogin poistaminen
router.delete('/:id', auth, function(req, res, next) {

  var user = req.user;
  var id = req.params['id'];

  var queryBlogs = {where: {id: id}};

  helperFunctions.removeBlog(id, user, function(result) {
    if(result === 200) {
      return res.status(200).send("Ok");
    }
    else {
      return res.status(403).send("Not authorized");
    }
  });
});


// Blogin kirjoitusten hakeminen
router.get('/:id/posts', function(req, res, next) {

  var id = req.params['id'];

  helperFunctions.getBlogposts(id, function(result, posts) {
    if(result === 200) {
      var returnablePosts = JSON.parse(JSON.stringify(posts, ['id', 'title', 'text', 'author']));
      return res.status(200).json(returnablePosts);
    }
    else {
      return res.status(404).send("Error: Blog not found");
    }
  });
});


// Uuden blogiviestin luominen
router.post('/:id/posts', auth, function(req, res, next) {

  var user = req.user;
  var id = req.params['id'];

  var title = req.body.title;
  var text = req.body.text;

  // Tarkistetaan ettei ole tyhjiä kenttiä
  if(!title || !text) {
    return res.status(400).send("Error: Missing or empty title or text");
  }

  else {
    helperFunctions.createBlogpost(user, id, title, text, function(result, post) {
      if(result === 201) {
        return res.status(201).json({"id": post.id});
      }
      else if(result === 403) {
        return res.status(403).send("Error: Not authorized");
      }
      else {
        return res.status(404).send("Error: Blog not found");
      }
    });
  }
});


// Kirjoitusoikeuksien asettaminen blogille
router.put('/:id/author/:username', auth, function(req, res, next) {

  var user = req.user;
  var username = req.params['username'];
  var id = req.params['id'];

  helperFunctions.giveRights(user, username, id, function(result, message) {
    if(result === 200) {
      return res.status(200).send(message);
    }
    else if(result === 403) {
      return res.status(403).send(message);
    }
    else {
      return res.status(404).send(message);
    }
  });
});


// Poistaa käyttöoikeudet blogiin
router.delete('/:id/author/:username', auth, function(req, res, next) {

  var authedUser = req.user;
  var username = req.params['username'];
  var id = req.params['id'];

  var queryBlogs = {where: {id: id}};

  helperFunctions.removeRights(user, username, id, function(result, message) {
    if(result === 200) {
      return res.status(200).send(message);
    }
    else if(result === 403) {
      return res.status(403).send(message);
    }
    else {
      return res.status(404).send(message);
    }
  });
});


// Blogin seuraajien hakeminen
router.get('/:id/followers', function(req, res, next) {

  var id = req.params['id'];

  var query = {where: {id: id}};
  models.Blog.findOne(query).then(function(blog) {
    if (blog) {

      // Haetaan blogin kirjoitukset
      blog.getFollowers().then(function(followers) {
        
        return JSON.parse(JSON.stringify(followers, ['username']));
        
      }).then(function(followers) {
        return res.status(200).json(followers);
      });
    }
    else {
      return res.status(404).send("Error: Blog not found");
    }
  });
});


module.exports = router;
