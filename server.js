"use strict";

const express = require("express");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL } = require("./config");
const {Blog, Author} = require("./model");

const app = express();

app.use(express.json());

//it will get the author collection data
//it will return the author id, name, and username
app.get('/authors', (req, res) => {
    Author
        .find()
        .then(authors => {
            res.json(authors.map(author => {
                return {
                    id: author.id,
                    name: `${author.firstName} ${author.lastName}`,
                    userName: author.userName
                }
            }))
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went terribly wrong'});
        })
})

//it first checks if there is a first name, lastname and userName is in the post
//if there is not then there will be an error message
app.post('/authors', (req,res) => {
    const requiredFields = ['firstName', 'lastName', 'userName'];
    requiredFields.forEach(field => {
        if(!(field in req.body)) {
            const message = `Missing ${field} in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    })
//it first checks if there is the same username in the database
//if there is than they will return an error message
    Author
        .findOne({userName: req.body.userName})
        .then(author => {
         if(author){
             const message = `Username already taken`;
             console.error(message);
             return res.status(400).send(message);
         }
//if everything passes than a new author is created in the database
//the author collection will have firstName,lastName and username
//the return status will have the author id, name, username. The name is first and last name 
         else {
             Author 
                .create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    userName: req.body.userName
                })
                .then(author => res.status(201).json({
                    _id: author.id,
                    name: `${author.firstName} ${author.lastName}`,
                    userName: author.userName
                }))
                .catch(err => {
                    console.error(err);
                    res.status(500).json({error: 'Something went wrong'})
                });
         }
        })
        //error for if statement
        .catch(err => {
            console.error(err);
            res.status(500).json({error:'something went horribly awry'});
        });
});

app.put('/authors/:id', (req,res) => {
    //it first checks if there is a req.params.id and if there is a req.body.id
    //next it checks if the are equal.
    //! if all it is not true than return an error
    if (!(req.params.id && req.body.id && (req.params.id === req.body.id))) {
        res.status(400).json({
            error: `Request path id and request body id values must match`
        });
    }

    const updated = {};
    const updateableFields = ['firstName', 'lastName', 'userName'];
    updateableFields.forEach(field => {
        //so its saying {}.firstName for updated[field]
        //req.body.firstName
        //updated now becomes req.body
        if(field in req.body){
            updated[field] = req.body[field];
        }
    })

    Author
        //if the first value is falsy it will go to the or on the right side
        //it will assign the username as an empty string
        //$ne= it stands for not equal. changes the id to another random id number
        //if the author username is in the database it will return an error message
        .findOne({userName: updated.userName || '', _id: {$ne: req.params.id}})
        .then(author => {
            if(author) {
                const message = `Username already taken`;
                console.error(message);
                return res.status(400).send(message);
            }
            else {
                Author
                    //the first paramater is id
                    //{$set} prevents you from overwitting all the information from that set
                    //{new:true} this returns the new updated document instead of the original one
                    //how does it know to update
                    .findByIdAndUpdate(req.params.id, {$set: updated}, {new:true})
                    .then(updatedAuthor => {
                        //returns the updated values
                        res.status(200).json({
                            id:updatedAuthor.id,
                            name:`${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
                            userName: updatedAuthor.userName
                        });
                    })
                    .catch(err => res.status(500).json({message:err}));
            }
        })
})

app.delete('/authors/:id', (req,res) => {
    //removes the blog post with that specific author id
    Blog
        .remove({author: req.params.id})
        .then(() => {
            //removes the author with the params id
            Author
                .findByIdAndRemove(req.params.id)
                .then(() => {
                    console.log(`Deleted blog posts owned by and author with id ${req.params.id}`)
                    res.status(204).json({message: 'success'});
                })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went terribly wrong'})
        })
})

app.get("/posts", (req,res) => {
    Blog
    //finds the blog and returns back the id,author first and last name, content and title
    //post.name came from virtual
        .find()
        .then(posts => {
            res.json(posts.map(post => {
                console.log(post)
                return {
                    id: post._id,
                    author:post.name,
                    content:post.content,
                    title: post.title
                };
            }))
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: "Internal server error"});
        });
});

app.get("/posts/:id", (req, res) => {
    Blog    
        .findById(req.params.id)
        .then(posts => res.json(posts.seralize()))
        .catch(err => {
            console.error(err);
            res.status(500).json({message:"Internal server error"})
        });
});

app.post("/posts", (req,res) => {
    const requiredFields = ["title", "content", "author_id"];
    for(let i = 0; i < requiredFields.length; i++){
        const field = requiredFields[i];
        if(!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

   Author
    //finds the author id and makes a post
    .findById(req.body.author_id)
    .then(author => {
        if (author) {
            Blog
                .create({
                    title:req.body.title,
                    content:req.body.content,
                    author: req.body.author_id
                })
                .then(blogPost => res.status(201).json({
                    id: blogPost.id,
                    author: `${author.firstName} ${author.lastName}`,
                    content: blogPost.content,
                    title: blogPost.title,
                    comments:blogPost.comments
                }))
                .catch(err => {
                    console.error(err);
                    res.status(500).json({error:'Something went wrong'});
                });
        }
        else {
            const message = 'author not found';
            console.error(message);
            return res.status(400).send(message)
        }
    })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: 'something went horribly awry'});
        });
});

app.put("/posts/:id", (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)){
        const message = `Request path id (${req.params.id}) and request body id ` +
            `(${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message: message});
    }
    
 //first it checks if title and content is in request body
 //if it is then the title and content is added to the empty object (updated)
 //updated.title === req.body.title
 //updated will have the key and the value
    const updated = {};
    const updatableFields = ["title", "content"];
    updatableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    });

    Blog
        .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
        .then(updatedPost => res.status(200).json({
            id: updatedPost.id,
            title: updatedPost.title,
            content: updatedPost.content
        }))
        .catch(err => res.status(500).json({message: "Internal server error"}));
});

app.delete("/posts/:id", (req,res) => {
    Blog
        .findByIdAndRemove(req.params.id)
        .then(restaurant => res.status(204).end())
        .catch(err => res.status(500).json({message:"Internal server error"}));
});

//anything that does not have a route specified will return a 404
app.use("*", function(req,res){
    res.status(404).json({message:"Not Found"});
})


let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(
            databaseUrl,
            err => {
                if (err) {
                    return reject(err);
                }
                server = app
                    .listen(port, () => {
                        console.log(`Your app is listening on port ${port}`);
                        resolve();
                    })
                    .on("error", err => {
                        mongoose.disconnect();
                        reject(err);
                    });
            }
        );
    });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing server");
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };