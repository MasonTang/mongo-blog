"use strict";

exports.DATABASE_URL =
    process.env.DATABASE_URL || "mongodb://masontang:abcdefg1@ds145584.mlab.com:45584/blog-app";
exports.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL || "mongodb://localhost/test-blog-app";
exports.PORT = process.env.PORT || 8080;

//mongodb://<dbuser>:<dbpassword>@ds145584.mlab.com:45584/blog-app

//"mongodb://localhost/blog-app";
