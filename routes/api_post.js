var express = require('express');
var router = express.Router();
var models = require('../models');
var auth = require('../apiAuth');
var helperFunctions = require('../helperFunctions');

// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Palauttaa blogikirjoituksen
router.get('/:id', function(req, res, next) {

  var id = req.params['id'];

  helperFunctions.getBlogpost(id, function(result, blogpost) {
    if(result === 200) {
      return res.status(200).send(blogpost);
    }
    else {
      return res.status(404).send("Error: Blogpost not found");
    }
  });
});


// Hakee blogiviestin 10 uusinta kommenttia
router.get('/:id/comments', function(req, res, next) {

  var id = req.params['id'];

  helperFunctions.getBlogpostComments(id, function(result, comments) {
    if(result === 200) {
      return res.status(200).json(comments);
    }
    else {
      return res.status(404).send("Error: Blogpost not found");
    }
  });
});


// Uuden blogikommentin luominen
router.post('/:id/comments', auth, function(req, res, next) {

  var user = req.user;
  var id = req.params['id'];

  var text = req.body.text;

  // Tarkistetaan ettei ole tyhjiä kenttiä
  if(!text) {
    return res.status(400).send("Error: Missing or empty text");
  }

  else {
    helperFunctions.postComment(id, text, user, function(result, commentId) {
      if(result === 201) {
        return res.status(201).json({"id": commentId});
      }
      else {
        return res.status(404).send("Error: Blog not found");
      }
    });
  }
});


module.exports = router;