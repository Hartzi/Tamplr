"use strict";

module.exports = function(sequelize, DataTypes) {
  var Blog = sequelize.define("Blog", {
    name: DataTypes.STRING,
    defaultBlog: DataTypes.BOOLEAN,
    createdBy: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {

        Blog.belongsToMany(models.User, {as: 'Author', through: 'BlogAuthors'});
        Blog.belongsToMany(models.User, {as: 'Followers', through: 'BlogFollowers'});
        Blog.hasMany(models.Post, {as: 'ChildPosts'});
      }
    }
  });

  return Blog;
};
