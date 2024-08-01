const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const fileUpload = require("express-fileupload")

// middlewares
app.use(express.json());
app.use(cors({origin:"*"}));
app.use(express.urlencoded({extended:true}));

// cookie middlewares
app.use(cookieParser());
app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
    })
);

// morgan comes here
app.use(morgan("tiny"));


// import all routes here

app.get("/",(req,res,next)=>{
    res.send({
        "message" : "Welcome to API RADAR API"
    })
})

module.exports = app;




