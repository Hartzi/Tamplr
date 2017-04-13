var express = require('express');
var router = express.Router();
var passport = require('passport');
var $ = require('jquery');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var models = require('../models');
var helperFunctions = require('../helperFunctions');

// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


router.get('/', function(req, res, next) {

	models.Post.findAll().then(function(posts) {
		var shownPosts = {};

		helperFunctions.returnAuthoredBlogs(req.user, function(result, authoredBlogs) {
			helperFunctions.returnFollowedBlogs(req.user, function(result, followedBlogs) {

				// Vain 10 uusinta blogikirjoitusta on tarkoitus näyttää etusivulla
				if(posts.length > 0) {

					// Jos ei ole vielä kymmentä kirjoitusta, niin näytetään kaikki suoraan
					if(posts.length <= 10) {
						shownPosts = posts;
					}
					else {
						// Kirjoituksia on yli kymmenen eli vain kymmenen uusinta näytetään
						shownPosts = posts.slice(posts.length-10, posts.length);
					}
				}

				res.render('index', {
				user: req.user,
				host: req.headers.host,
				authoredBlogs: authoredBlogs,
				followedBlogs: followedBlogs,
				posts: posts,
				shownPosts: shownPosts
				});
			});
		});
	});
});


router.post('/login', passport.authenticate('local', {successReturnToOrRedirect: '/', failureRedirect: '/loginerror'}));


router.post('/logout', logout);


router.get('/loginerror', function(req, res) {

  res.render('error', {user: req.user, message: "Tunnus ja salasana eivät täsmää!", error: {status:""}});
});


router.get('/register', function(req, res) {

	var userInfo = {"name": "", "username": ""};
  res.render('register', {user: req.user, userInfo: userInfo, status: ""});
});


router.post('/register', function(req, res) {

	var userInfo = {"name": req.body.name, "username": req.body.username};

	// Kaikki tiedot täytyy antaa
  if(req.body.name && req.body.username && req.body.password && req.body.password2) {

  	// Tarkistetaan, että salasana on toistettu oikein
  	if(req.body.password === req.body.password2) {

	  	helperFunctions.createNewUser(req.body.username, req.body.name, req.body.password, function(result) {

	  		// Onnistui
	  		if(result === 201) {
	  			userInfo = {"name": "", "username": ""};
	  			return res.render('register', {user: req.user, userInfo: userInfo, status: "Rekisteröinti onnistui. Voit kirjautua luomallasi tunnuksella palveluun."});
	  		}

	  		// Tunnus on jo käytössä
	  		else if(result === 409) {
	  			return res.render('register', {user: req.user, userInfo: userInfo, status: "Virhe: Käyttäjätunnus on jo käytössä!"});
	  		}

	  		// Vääräntyyppinen käyttäjätunnus
	  		else {
	  			return res.render('register', {user: req.user, userInfo: userInfo, userInfo: userInfo, status: "Virhe: Käyttäjätunnuksen sallittu syntaksi on: [a-z][a-z0-9_]*."});
	  		}
			});
	  }

	  // Salasana toistettu väärin
    else {
			return res.render('register', {user: req.user, userInfo: userInfo, status: "Rekisteröinti epäonnistui: Salasana toistettu väärin!"});
		}
  }

  // Jotain tietoja jäi antamatta
	else {
	  return res.render('register', {user: req.user, userInfo: userInfo, status: "Rekisteröinti epäonnistui: Kaikki tiedot täyty antaa!"});
	}
});


router.get('/settings', ensureLoggedIn('/'), function(req, res) {

  res.render('settings', {user: req.user, status: ""});
});


// Asetusten tallentaminen
router.post('/settings', ensureLoggedIn('/'), function(req, res) {

	// Jokin tiedoista pitää antaa
  if(req.body.name || req.body.password || req.body.password2) {

  	// Tosi jos salasana on toistettu oikein tai salasanaa ei ole kirjoitettu kumpaankaan.
  	if(req.body.password === req.body.password2) {

 	  	helperFunctions.updateUserInfo(req.user, req.body.name, req.body.password, function(result) {
	  		if(result === 200) {
	  			res.render('settings', {user: req.user, status: "Asetukset tallennettu onnistuneesti."});
	  		}

	  		else {
	  			res.render('settings', {user: req.user, status: "Virhe: Tietokantaongelma!"});
	  		}
	  	});
 	  }

 	  // Salasana toistettu väärin
 	  else {
 	  	res.render('settings', {user: req.user, status: "Virhe: Salasana toistettu väärin!"});
 	  }
  } 
  
  // Mitään tietoja ei ole annettu
  else {
  	res.render('settings', {user: req.user, status: "Virhe: Nimi tai salasana pitää antaa!"});
  }
});


router.get('/createblog', ensureLoggedIn('/'), function(req, res) {

  res.render('createblog', {user: req.user, status: ""});
});


// Uuden blogin luominen
router.post('/createblog', ensureLoggedIn('/'), function(req, res) {

	helperFunctions.createNewBlog(req.body.name, req.user, function(result, id) {

		// Blogin luominen onnistui
    if(result === 201) {
      res.render('createblog', {user: req.user, status: "Blogi luotu onnistuneesti."});
    }

    // Ei onnistunut
    else {
      res.render('createblog', {user: req.user, status: "Virhe: Blogille täytyy antaa nimi!"});
    }
  });
});


// Blogikirjoituksen palauttaminen
router.get('/blogpost/:id', function(req, res, next) {
	
	var id = req.params['id'];

	models.Post.findOne({where: {id: id}}).then(function(post) {

		helperFunctions.getBlogpostComments(id, function(result, comments) {
			
			if(req.user) {

				// Tykkääkö käyttäjä jo blogista?
				helperFunctions.checkUserLike(req.user, id, function(result) {
					if(result === true) {
						res.render('blogpost', {user: req.user, post: post, comments: comments, liked: true, status: ""});
					}

					else {
						res.render('blogpost', {user: req.user, post: post, comments: comments, liked: false, status: ""});
					}
				});
			}

			else {
				res.render('blogpost', {user: req.user, post: post, comments: comments, liked: false, status: ""});
			}
	  });
	});
});


// Blogikommentin lisääminen
router.post('/blogpost/:id/comment', ensureLoggedIn('/'), function(req, res, next) {
	
	var id = req.params['id'];

	models.Post.findOne({where: {id: id}}).then(function(post) {

		if(req.body.comment) {
			helperFunctions.postComment(id, req.body.comment, req.user, function(result, commentId) {

				helperFunctions.getBlogpostComments(id, function(result, comments) {
					res.redirect('/blogpost/'+id);
				});
  		});
		}

		else {
			helperFunctions.getBlogpostComments(id, function(result, comments) {
				res.redirect('/blogpost/'+id);				
			});
		}
	});
});


// Blogikirjoituksen tykkäyksen lisääminen
router.post('/blogpost/:id/like', ensureLoggedIn('/'), function(req, res, next) {
	
	var id = req.params['id'];

	models.Post.findOne({where: {id: id}}).then(function(post) {

		helperFunctions.getBlogpostComments(id, function(result, comments) {

			helperFunctions.likeBlogpost(req.user, id, function(result, message) {
				if(result === 200) {
					res.redirect('/blogpost/'+id);
				}
			});
		});	
	});
});


// Blogikirjoituksen tykkäämisen poistaminen
router.post('/blogpost/:id/unlike', ensureLoggedIn('/'), function(req, res, next) {
	
	var id = req.params['id'];

	models.Post.findOne({where: {id: id}}).then(function(post) {

		helperFunctions.getBlogpostComments(id, function(result, comments) {

			helperFunctions.unlikeBlogpost(req.user, id, function(result, message) {

				res.redirect('/blogpost/'+id);
			});
		});	
	});
});


router.get('/blog/:id', function(req, res, next) {
	var id = req.params['id'];

	// Haetaan blogin tiedot
	helperFunctions.getBlogInfo(id, function(result, blog) {

		// BLogi löytyi
    if(result === 200) {

    	// Haetaan blogin kirjoitukset
  	  helperFunctions.getBlogposts(id, function(result, posts) {

  	  	if(req.user) { 

  	  		// Tutkitaan onko käyttäjällä kirjoitusoikeuksia blogiin jotta sivuun voidaan muodostaa oikeat toiminnot
  	  		helperFunctions.checkUserRights(req.user, id, function(result) {
  	  			if(result === true) {
  	  				res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: true, status: ""});
  	  			}
  	  			else {

  	  				// Tarkistetaan seuraako käyttäjä jo blogia
  	  				helperFunctions.checkUserFollow(req.user, id, function(result) {
  	  					
  	  					// Seuraa
  	  					if(result === true) {
  	  						res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: false, follower: true, status: ""});
  	  					}

  	  					// Ei seuraa
  	  					else {
  	  						res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: false, follower: false, status: ""});
  	  					}
  	  				});
  	  			}	  			
  	  		}); 
  	  	}
  	  	else {
  	  		res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: false, status: ""});
  	  	}
		  });
    }

    // Syystä tai toisesta blogia ei löytynyt
    else {
      res.render('blog', {user: req.user, blog: blog, status: "Virhe: Blogin tietoja ei voitu hakea."});
    }
  });
});


// Blogikirjoitussivu
router.get('/blog/:id/post', ensureLoggedIn('/'), function(req, res, next) {

	var id = req.params['id'];
	var post = {"title": "", "text": ""};

	helperFunctions.getBlogInfo(id, function(result, blog) {
		if(result === 200) {

			// Estetään osoiterivikikkailu oikeuksien kiertämisessä.
			helperFunctions.checkUserRights(req.user, id, function(result) {
				if(result === true) {
					res.render('createpost', {user: req.user, blog: blog, post: post, priviledges: true, status: ""});
				}
				else {
					res.render('createpost', {user: req.user, blog: blog, post: post, priviledges: false, status: "Virhe: Ei oikeuksia!"});
				}
			});
		}
		else {
      res.render('createpost', {user: req.user, status: "Virhe: Blogin tietoja ei voitu hakea."});
    }
	});
});


// Blogin asetukset (kirjoitusoikeudet)
router.post('/blog/:id/settings', ensureLoggedIn('/'), function(req, res, next) {

	var id = req.params['id']

		// Haetaan blogin tiedot
	helperFunctions.getBlogInfo(id, function(result, blog) {

  	// Haetaan blogin kirjoitukset
	  helperFunctions.getBlogposts(id, function(result, posts) {  	  			

			if(req.body.addUsername) {

			  helperFunctions.giveRights(req.user, req.body.addUsername, id, function(result, message) {
			    if(result === 200) {
			    	res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: true, status: "Kirjoitusoikeus annettu onnistuneesti käyttäjälle " + req.body.addUsername});
			    }

			    else {
			    	res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: true, status: "Virhe: Käyttäjää " + req.body.addUsername + " ei löytynyt."});
			    }
		  	});
			}

			else if(req.body.removeUsername) {
				helperFunctions.removeRights(req.user, req.body.removeUsername, id, function(result, message) {
			    if(result === 200) {
			    	res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: true, status: "Kirjoitusoikeus poistettu onnistuneesti käyttäjältä " + req.body.removeUsername});
			    }
			    
			    else {
			    	res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: true, status: "Virhe: Käyttäjää " + req.body.removeUsername + " ei löytynyt."});
			    }
		  	});
			}
			else {
				res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: true, status: "Virhe: käyttäjänimi täytyy antaa."});						
			}
		});
	});
});


// Blogin seuraaminen
router.post('/blog/:id/follow', ensureLoggedIn('/'), function(req, res, next) {

	var id = req.params['id']

		// Haetaan blogin tiedot
	helperFunctions.getBlogInfo(id, function(result, blog) {

  	// Haetaan blogin kirjoitukset
	  helperFunctions.getBlogposts(id, function(result, posts) {  	  			

		  helperFunctions.followBlog(req.user, id, function(result, message) {
		    if(result === 200) {
		    	res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: false, follower: true, status: ""});
		    }
	  	});
		});
	});
});


// Blogin seuraamisen lopattaminen
router.post('/blog/:id/unfollow', ensureLoggedIn('/'), function(req, res, next) {

	var id = req.params['id']

		// Haetaan blogin tiedot
	helperFunctions.getBlogInfo(id, function(result, blog) {

  	// Haetaan blogin kirjoitukset
	  helperFunctions.getBlogposts(id, function(result, posts) {  	  			

		  helperFunctions.unFollowBlog(req.user, id, function(result, message) {
		    if(result === 200) {
		    	res.render('blog', {user: req.user, blog: blog, posts: posts, priviledges: false, follower: false, status: ""});
		    }
	  	});
		});
	});
});


// Uuden blogikirjoituksen luominen
router.post('/blog/:id/post', ensureLoggedIn('/'), function(req, res, next) {

	var id = req.params['id']
	var blog = {"id": id};
	var post = {"title": req.body.title, "text": req.body.text};

	// Otsikko ja teksti täytyy löytyä
  if(req.body.title && req.body.text) {

  	// Luodaan uusi kirjoitus
  	helperFunctions.createBlogpost(req.user, id, req.body.title, req.body.text, function(result, post) {

  		// Onnistui
      if(result === 201) {
      	post = {"title": "", "text": ""};
        res.render('createpost', {user: req.user, priviledges: true, blog: blog, post: post, status: "Blogikirjoitus luotu onnistuneesti."});
      }

      // Ei kirjoitusoikeutta. 
      else if(result === 403) {
        res.render('createpost', {user: req.user, priviledges: true, blog: blog, post: post, status: "Virhe: Ei kirjoitusoikeuksia blogiin!"});
      }

      // Blogia ei löytynytkään
      else {
        res.render('createpost', {user: req.user, priviledges: true, blog: blog, post: post, status: "Virhe: Blogia ei löytynyt!"});
      }
    });
  } 
  
  // Otsikko tai teksti puuttuu	
  else {
  	res.render('createpost', {user: req.user, priviledges: true, blog: blog, post: post, status: "Virhe: Otsikko sekä teksti pitää antaa!"});
  }
});


// Apufunktio uloskirjautumisen toteuttamiseen
function logout(req, res) {
  req.session.destroy(function (err) {
    res.redirect('/');
  });
}


module.exports = router;
