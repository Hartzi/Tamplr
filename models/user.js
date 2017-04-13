"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: DataTypes.STRING,
    name: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {

        User.belongsToMany(models.Blog, {as: 'AuthoredBlogs', through: 'BlogAuthors'});
        User.belongsToMany(models.Blog, {as: 'FollowedBlogs', through: 'BlogFollowers'});
        User.belongsToMany(models.Post, {as: 'LikedPosts', through: 'PostLikes'});
        User.hasMany(models.Post, {as: 'AuthoredPosts'});
        User.hasMany(models.Comment, {as: 'AuthoredComments'});
      }
    }
  });

  return User;
};
