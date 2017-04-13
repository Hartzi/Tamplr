"use strict";

module.exports = function(sequelize, DataTypes) {
  var Post = sequelize.define("Post", {
    title: DataTypes.STRING,
    text: DataTypes.STRING,
    author: DataTypes.STRING,
    likes: DataTypes.INTEGER,
    comments: DataTypes.INTEGER,
    parentBlogId: DataTypes.STRING,
    parentBlogName: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {

        Post.belongsToMany(models.User, {as: 'Likes', through: 'PostLikes'});
        Post.hasMany(models.Comment, {as: 'ChildComments'});
      }
    }
  });

  return Post;
};
