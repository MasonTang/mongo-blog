"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({
    firstName: 'string',
    lastName: 'string',
    userName: {
        type: 'string',
        unique: true
    }
})

const commentSchema = mongoose.Schema({content: 'string'})

//the Author represents the collection Author
const blogSchema = mongoose.Schema({
    title: 'string',
    author:{type: mongoose.Schema.Types.ObjectId, ref:'Author'},
    content: { type: String, required: true }, 
    comments: [commentSchema]
});

blogSchema.pre('find', function(next){
    this.populate('author')
    next();
})

blogSchema.pre('findOne', function(next) {
    this.populate('author');
    next();
})


blogSchema.virtual("name").get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.methods.seralize = function() {
    return {
        id: this._id,
        title: this.title,
        author: this.name,
        content: this.content,
        comments: this.comments
    };
};
//not sure why its not blogposts or authors
//before BlogPost it was blogPosts and it did not work
//BlogPost is correct
const Blog = mongoose.model("BlogPosts", blogSchema);
const Author = mongoose.model("Author", authorSchema);

module.exports = {Blog, Author};