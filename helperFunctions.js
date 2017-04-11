var express = require('express');
var models = require('./models');



// ########################################################################
//  User funktiot
// ########################################################################
// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Apufunktio uuden käyttäjän luomiseen
function createNewUser(username, name, password, callback) {

  // Tarkistetaan käyttäjätunnuksen syntaksin oikeellisuus
  if(checkUsername(username) === false) {

    // Vääränlainen tunnus
    callback(400);
  }
  else {

    // Tarkista onko käyttäjänimi jo olemassa.
    var query = {where: {username: username}};
    models.User.findOne(query).then(function(user) {
      if (user) {

        // On jo olemassa
        callback(409);
      }

      // Ei ole olemassa, voidaan luoda uusi
      else {
        models.User.create({
          username: username,
          name: name,
          password: password
        }).then(function(newUser) {

          // Luodaan käyttäjälle samalla oletusblogi.
          models.Blog.create({name: username + ":n Blogi", defaultBlog: true, createdBy: username}).then(function(blog) {

            // Annetaan uudelle käyttäjlle oikeudet omaan oletusblogiinsa.
            newUser.addAuthoredBlog(blog).then(function() {

              callback(201);
            });
          });
        });
      }
    });
  }    
}


// Apufunktio käyttäjän tietojen palauttamiseen
function returnUserInfo(username, res) {

  var query = {where: {username: username}};

  models.User.findOne(query).then(function(user) {
    if (user) {
      return res.status(200).json({"username": user.username, "name": user.name});
    }
    else {
      return res.status(404).send("error: User not found");
    }
  });
}


// Apufunktio käyttäjän tietojen päivittämiseen
function updateUserInfo(username, name, password, callback) {

  var query = {where: {username: username}};

  // Haetaan omat tiedot.
  models.User.findOne(query).then(function(user) {
    if(user) {

      // Päivitetään oikeelliset tiedot.
      if(name) {
        models.User.update({
        name: name
        }, query );
      }
      if(password) {
        models.User.update({
        password: password
        }, query);
      }
      
      callback(200);      
    }
    else {

      callback(404);
    }
  });
}


// Apufunktio käyttäjän kirjoitusoikeudellisten blogien palauttamiseen
function returnAuthoredBlogs(username, callback) {

  var query = {where: {username: username}};

  models.User.findOne(query).then(function(user) {
    if (user) {

      // Etsitään käyttäjän kirkoitusoikeudelliset blogit ja muutetaan paluuarvona saatu taulukko JSON-muotoon.
      user.getAuthoredBlogs().then(function(blogs) {
        var blogData = JSON.parse(JSON.stringify(blogs, ['id', 'name', 'defaultBlog', 'createdBy']));
        
        // Käydään blogit vielä läpi ja vaihdetaan tietokannasta tuleva id oletusblogeille speksin mukaiseksi(käyttäjänimi)
        for(var i = 0; i<blogData.length; i++) {
          if(blogData[i].defaultBlog === true) {
            blogData[i].id = blogData[i].createdBy;
          }

          // Tehdään callback, kun taulukko on käyty läpi.
          if(i === blogData.length-1) {

            callback(200, blogData);
            break;
          }
        }
      });
    }
    else {

      callback(404);
    }
  });
}


// Apufunktio käyttäjän seuraamien blogien palauttamiseen
function returnFollowedBlogs(username, callback) {
  
  var query = {where: {username: username}};

  models.User.findOne(query).then(function(user) {
    if (user) {

      // Etsitään käyttäjän seuraamat blogit ja muutetaan paluuarvona saatu taulukko JSON-muotoon.
      user.getFollowedBlogs().then(function(blogs) {

        var blogData = JSON.parse(JSON.stringify(blogs, ['id', 'name']));

        // Jos seurattuja blogeja on
        if(blogData.length > 0) {

          // Käydään blogit vielä läpi ja vaihdetaan tietokannasta tuleva id oletusblogeille speksin mukaiseksi(käyttäjänimi)
          for(var i = 0; i<blogData.length; i++) {
            if(blogData[i].defaultBlog === true) {
              blogData[i].id = blogData[i].createdBy;
            }

            // Tehdään callback, kun taulukko on käyty läpi.
            if(i === blogData.length-1) {

              callback(200, blogData);
              break;
            }
          }
        }
        else {

          // Ei seurattuja blogeja
          callback(200, blogData);
        }
      });
    }
    else {

      callback(404);
    }
  });
}


// Apufunktio käyttäjän blogiseuraamisen asettamiseen
function followBlog(username, id, callback) {

  // Onko blogi olemassa
  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      var query = {where: {username: username}};

      // Haetaan omat tiedot käsittelyä varten.
      models.User.findOne(query).then(function(user) {
        if(user) {
          user.addFollowedBlog(blog).then(function() {

            callback(200, "ok");            
          });
        }

        // Käyttäjää ei jostain syystä löydy.
        else {

          callback(404, "Error: User not found")
        }
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404, "Error: Blog not found");
    }
  });
}


// Apufunktio käyttäjän blogiseuraamisen asettamiseen
function unFollowBlog(username, id, callback) {

  // Onko blogi olemassa
  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      var query = {where: {username: username}};

      // Haetaan omat tiedot käsittelyä varten.
      models.User.findOne(query).then(function(user) {
        if(user) {
          user.removeFollowedBlog(blog).then(function() {

            callback(200, "ok");            
          });
        }

        // Käyttäjää ei jostain syystä löydy.
        else {

          callback(404, "Error: User not found")
        }
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404, "Error: Blog not found");
    }
  });
}


// Apufunktio blogitykkäyksen asettamiseen
function likeBlogpost(username, id, callback) {

  var queryPosts = {where: {id: id}};

  // Tutkitaanko onko id:n mukainen blogikirjoitus olemassa.
  models.Post.findOne(queryPosts).then(function(post) {

    // Blogikirjoitus löytyy.
    if (post) {
      var query = {where: {username: username}};

      // Haetaan omat tiedot käsittelyä varten.
      models.User.findOne(query).then(function(user) {
        if(user) {
          user.addLikedPost(post).then(function() {

            // Haetaan tykkäykset ja tallennetaan apumuuttujaan
            post.getLikes().then(function(likes){
              models.Post.update({
                likes: likes.length
              }, queryPosts);

              callback(200, "ok");              
            });
          });
        }
        // Käyttäjää ei jostain syystä löydy.
        else {

          callback(404, "Error: User not found");
        }
      });
    }

    else {

      // Blogikirjoitusta ei löytynyt ollenkaan.
      callback(404, "Error: Blogpost not found");      
    }
  });
}


// Apufunktio blogitykkäyksen poistamiseen
function unlikeBlogpost(username, id, callback) {

  var queryPosts = {where: {id: id}};

  // Tutkitaanko onko id:n mukainen blogikirjoitus olemassa.
  models.Post.findOne(queryPosts).then(function(post) {

    // Blogikirjoitus löytyy.
    if (post) {
      var query = {where: {username: username}};

      // Haetaan omat tiedot käsittelyä varten.
      models.User.findOne(query).then(function(user) {
        if(user) {
          user.removeLikedPost(post).then(function() {

            // Haetaan tykkäykset ja tallennetaan apumuuttujaan
            post.getLikes().then(function(likes){
              models.Post.update({
                likes: likes.length
              }, queryPosts);

              callback(200, "ok");
            });
          });
        }

        // Käyttäjää ei jostain syystä löydy.
        else {

          callback(404, "Error: User not found");
        }
      });
    }

    else {

      // Blogikirjoitusta ei löytynyt ollenkaan.
      callback(404, "Error: Blogpost not found");      
    }
  });
}



// ########################################################################
//  User apufunktiot
// ########################################################################
// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Apufunktio tarkistamaan yksittäisen käyttäjän käyttöoikeus yksittäiseen blogiin.
function checkUserRights(username, blogId, callback) {

  // Haetaan ensin käyttäjän kaikki kirjoitusoikeudelliset blogit.
  returnAuthoredBlogs(username, function(result, blogs) {
    if(result === 200) {
      for(var i = 0; i<blogs.length; ++i) {
        if(blogs[i].id == blogId) {

          // Käyttäjällä on käyttöoikeus blogiin
          callback(true);
          break;
        }
        else if(i === blogs.length-1) {

          // Päästiin listan loppuun eikä tähän mennessä ole tehty callbackiä eli käyttäjällä ei ole oikeutta kyseiseen blogiin.
          callback(false);
          break;
        }
      }
    }
    else {

      // Yhtään kirjoitusoikeudellista blogia ei löytynyt. Ei pitäisi olla mahdollista paitsi jos tietokanta on korruptoitunut tai muuten kipannut.
      callback(false);
    }
  });
}


// Apufunktio tarkistamaan yksittäisen käyttäjän seuraamisen yksittäiseen blogiin.
function checkUserFollow(username, blogId, callback) {

  // Haetaan ensin käyttäjän kaikki seuratut blogit.
  returnFollowedBlogs(username, function(result, blogs) {
    if(result === 200 && blogs.length > 0) {
      for(var i = 0; i<blogs.length; ++i) {
        if(blogs[i].id == blogId) {

          // Käyttäjä seuraa blogia
          callback(true);
          break;
        }
        else if(i === blogs.length-1) {

          // Päästiin listan loppuun eikä tähän mennessä ole tehty callbackiä eli käyttäjä ei seuraa blogia.
          callback(false);
          break;
        }
      }
    }
    else {

      // Yhtään seurattua blogia ei löytynyt.
      callback(false);
    }
  });
}


// Apufunktio tarkistamaan yksittäisen käyttäjän tykkäämisen yksittäiseen blogikirjoitukseen.
function checkUserLike(username, postId, callback) {

  var query = {where: {username: username}};

  // Haetaan omat tiedot.
  models.User.findOne(query).then(function(user) {
    if(user) {

      // Haetaan omat tykätyt blogit
      user.getLikedPosts().then(function(posts) {
        if(posts && posts.length > 0) {

          // Käydään ne kaikki läpi ja katsotaan löytyykö tutkittava blogId sieltä.
          for(var i=0; i<posts.length; ++i) {
            if(posts[i].id == postId) {

              // Käyttäjä tykkää blogista jo
              callback(true);
              break;
            }
            else if(i === posts.length-1)
            {

              // Käyttäjä ei vielä tykkää blogista
              callback(false);
              break;
            }
          }
        }
        else {

          // Ei tyhään tykättyä blogia vielä.
          callback(false);
        }
      });
    }
  });
}


// Apufunktio käyttäjätunnuksen oikeellisuuden tarkistamiseen
function checkUsername (username) {
  var re = /[a-z][a-z0-9_]*/; 
  var m = re.exec(username);

  if(!m) {
    return false;
  }

  if(m[0] !== username) {
    return false;
  }
  else {
    return true;
  }
}



// ########################################################################
//  Blog functions
// ########################################################################
// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Apufunktio uuden blogin luomiseen
function createNewBlog(name, authedUser, callback) {

   // Tarkistetaan ettei ole tyhjiä kenttiä
  if(!name) {

    callback(400);
  }

  else {

    // Luodaan uusi blogi
    models.Blog.create({
      name: name,
      defaultBlog: false,
    }).then(function(blog) {
      var query = {where: {username: authedUser}};

      // Haetaan tunnistautuneen käyttäjän tiedot
      models.User.findOne(query).then(function(user) {

        // Asetetaan tunnistautuneelle käyttäjälle oikeudet blogiin
        user.addAuthoredBlog(blog).then(function() {

          callback(201, blog.id);
        });
      });
    });
  }
}


// Apufunktio blogin tietojen hakemiseen ja palauttamiseen JSON-muodossa.
function getBlogInfo(id, callback) {

  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      // Varmistetaan, että oletusblogi palautetaan oikean näköisenä eli id on speksin mukainen eikä tietokanta-id.
      if(blog.defaultBlog === true) {
        var blogData = JSON.parse(JSON.stringify(blog, ['id', 'name', 'defaultBlog', 'createdBy']));

        // Palautetaan oletusblogin oikea id väärän tietokanta id:n sijaan.
        blogData.id = blogData.createdBy;

        callback(200, blogData);
      }

      // Muut blogit voidaan palauttaa sellaisenaan.
      else {

        callback(200, blog);
      }
    }

    // Blogia ei löytynyt
    else {

      callback(404);
    }
  });
}


// Apufunktio blogin poistamiseen
function removeBlog(id, user, callback) {

  // Onko blogi olemassa
  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      checkUserRights(user, id, function(result) {

        // Käyttäjällä on kirjoitusoikeudet blogiin.
        if(result === true) {

          // Ei kosketa oletusblogiin
          if(blog.defaultBlog === false) {

            blog.setAuthor([]);
            blog.destroy();

            callback(200, "Ok");
 
          }
          else {

            callback(403, "Error: Not allowed: Default blog!");
          }         
        }

        // Ei kirjoitusoikeuksia
        else {

          callback(403, "Error: Not authorized");         
        }
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404, "Error: Blog not found");
    }
  });
}


// Apufunktio blogin kirjoitusten hakemista varten.
function getBlogposts(id, callback) {

  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      // Haetaan blogin kirjoitukset
      blog.getChildPosts().then(function(posts) {
        
        // Kikkaillaan siitä sopivan näköistä ja maksimissaan kymmenen palautetaan.
        var returnablePosts = JSON.parse(JSON.stringify(posts, ['id', 'title', 'text', 'author', 'likes', 'comments']));

        if(returnablePosts.length > 10) {
          returnablePosts = returnablePosts.slice(returnablePosts.length-10,returnablePosts.length);
        }
        
        return returnablePosts;

      }).then(function(posts) {

        callback(200, posts);
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404);
    }
  });
}


// Apufunktio uuden blogikirjoituksen luomista varten.
function createBlogpost(user, id, title, text, callback) {

  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      checkUserRights(user, id, function(result) {

        // Käyttäjällä on kirjoitusoikeudet blogiin.
        if(result === true) {

          // Haetaan käyttäjän tietokantaolio ja tallennetaan uusi blogikirjoitus tarpeellisiin paikkoihin.
          var queryAuthors = {where: {username: user}};
          blog.getAuthor(queryAuthors).then(function(author) {

            models.Post.create({
              title: title,
              text: text,
              author: user,
              likes: 0,
              comments: 0,
              parentBlogId: id,
              parentBlogName: blog.name
            }).then(function(post) {
              author[0].addAuthoredPost(post);
              return post;
            }).then(function(post) {
              blog.addChildPost(post);
              return post;
            }).then(function(post) {

              callback(201, post);
            });
          });         
        }

        // Ei kirjoitusoikeuksia
        else {

          callback(403);          
        }
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404);
    }
  });
}


// Apufunktio kirjoitusoikeuksien antamiseen käyttäjälle blogiin.
function giveRights(user, username, id, callback) {
  
  // Onko blogi olemassa
  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      checkUserRights(user, id, function(result) {

        // Käyttäjällä on kirjoitusoikeudet blogiin.
        if(result === true) {

          // Ei kosketa oletusblogiin
          if(blog.defaultBlog === false) {

            var queryUsers = {where: {username: username}};

            // Tutkitaan onko käyttäjä, jolle kirjoitusoikeudet halutaan antaa, olemassa.
            models.User.findOne(queryUsers).then(function(user) {

              // Löytyy
              if(user) {
                user.addAuthoredBlog(blog).then(function() {

                  callback(200, "Ok");
                }); 
              }

              // Käyttäjää ei ole olemassa
              else {

                callback(404, "Error: User not found");
              }
            }); 
          }
          else {

            callback(403, "Error: Not allowed: Default blog!");
          }         
        }

        // Ei kirjoitusoikeuksia
        else {

          callback(403, "Error: Not authorized");         
        }
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404, "Error: Blog not found");
    }
  });
}


// Apufunktio kirjoitusoikeuksien poistamiseen käyttäjältä blogista.
function removeRights(user, username, id, callback) {
  
  // Onko blogi olemassa
  getBlog(id, function(result, blog) {

    // Blogi löytyi
    if(result === 200) {

      checkUserRights(user, id, function(result) {

        // Käyttäjällä on kirjoitusoikeudet blogiin.
        if(result === true) {

          // Ei kosketa oletusblogiin
          if(blog.defaultBlog === false) {

            var queryUsers = {where: {username: username}};

            // Tutkitaan onko käyttäjä, jolle kirjoitusoikeudet halutaan antaa, olemassa.
            models.User.findOne(queryUsers).then(function(user) {

              // Löytyy
              if(user) {
                user.removeAuthoredBlog(blog).then(function() {

                  callback(200, "Ok");
                }); 
              }

              // Käyttäjää ei ole olemassa
              else {

                callback(404, "Error: User not found");
              }
            }); 
          }
          else {

            callback(403, "Error: Not allowed: Default blog!");
          }         
        }

        // Ei kirjoitusoikeuksia
        else {

          callback(403, "Error: Not authorized");         
        }
      });
    }

    // Blogia ei löytynyt
    else {

      callback(404, "Error: Blog not found");
    }
  });
}



// ########################################################################
//  Blog apufunktiot
// ########################################################################
// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Palauttaa haetun blogin tietokantaolion.
function getBlog(id, callback) {

  // Tutkitaan onko id numero vai ei.
  if(!isNaN(id)) {

    var query = {where: {id: id}};

    // Tutkitaanko onko id:n mukainen blogi olemassa.
    models.Blog.findOne(query).then(function(blog) {

      // Estetään kalastelu tietokanta id:llä
      if (blog && blog.defaultBlog === false) {

        callback(200, blog);
      }
      else {

        callback(404);
      }
    });
  }

  // Id ei ole numero, eli kyse on oletusblogista.
  else {
    var query = {where: {createdBy: id}};

    models.Blog.findOne(query).then(function(blog) {
      if (blog) {

        callback(200, blog);
      }
      else {

        callback(404);
      }
    });
  }
}



// ########################################################################
//  Blogpost funktiot
// ########################################################################
// Callback-kutsujen parametrinä olevat numerot ovat samoja kuin http status -koodit
// ja tarkoittavat samaa asiaa.


// Apufunktio blogikirjoituksen tietojen hakemiseen
function getBlogpost(id, callback) {

  var query = {where: {id: id}};

  // Tutkitaanko onko id:n mukainen blogikirjoitus olemassa.
  models.Post.findOne(query).then(function(post) {
    if (post) {

      // Haetaan tykkäykset vielä
      post.getLikes().then(function(likes){

        callback(200, {"title": post.title, "text": post.text, "author": post.author, "likes": likes.length});  
      });
    }
    else {

      callback(404);
    }
  });
}


// Apufunktio blogikirjoituksen kommenttien hakemiseen
function getBlogpostComments(id, callback) {

  var query = {where: {id: id}};

  // Tutkitaanko onko id:n mukainen blogikirjoitus olemassa.
  models.Post.findOne(query).then(function(post) {
    if (post) {

      // Haetaan blogikirjoituksen kommentit
      post.getChildComments().then(function(comments) {
        
        // Kikkaillaan siitä sopivan näköistä ja maksimissaan kymmenen palautetaan.
        var returnableComments = JSON.parse(JSON.stringify(comments, ['id', 'text', 'author']));

        if(returnableComments.length > 10) {
          returnableComments = returnableComments.slice(returnableComments.length-10,returnableComments.length);
        }
        
        return returnableComments;

      }).then(function(comments) {

        callback(200, comments);
      });
    }
    else {

      callback(404);
    }
  });
}


// Apufunktio blogikirjoituksen kommentointiin
function postComment(id, text, user, callback) {

  var queryPosts = {where: {id: id}};

  // Tutkitaanko onko id:n mukainen blogikirjoitus olemassa.
  models.Post.findOne(queryPosts).then(function(post) {
    if (post) {
      models.Comment.create({
        text: text,
        author: user
      }).then(function(comment) {
        post.addChildComment(comment).then(function() {

          // Haetaan kommentit ja päivitetään apumuuttujaan
          post.getChildComments().then(function(comments){
            models.Post.update({
              comments: comments.length
            }, queryPosts);

            callback(201, comment.id);
          });
        });
      });
    }

    else {

      callback(404);
    }
  });
}


module.exports = {
  // User
  createNewUser: createNewUser,
  returnUserInfo: returnUserInfo,
  updateUserInfo: updateUserInfo,
  returnAuthoredBlogs: returnAuthoredBlogs,
  returnFollowedBlogs: returnFollowedBlogs,
  followBlog: followBlog,
  unFollowBlog: unFollowBlog,
  likeBlogpost: likeBlogpost,
  unlikeBlogpost: unlikeBlogpost,
  // User apu
  checkUserRights: checkUserRights,
  checkUserFollow: checkUserFollow,
  checkUserLike: checkUserLike,
  // Blog
  createNewBlog: createNewBlog,
  getBlogInfo: getBlogInfo,
  removeBlog: removeBlog,
  getBlogposts: getBlogposts,
  createBlogpost: createBlogpost,
  giveRights: giveRights,
  removeRights: removeRights,
  // Blog apu
  getBlog: getBlog,
  // Blogpost
  getBlogpost: getBlogpost,
  getBlogpostComments: getBlogpostComments,
  postComment: postComment
}