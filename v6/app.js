var express                =  require("express"),
    mongoose               =  require("mongoose"),
    passport               =  require("passport"),
    User                   =  require("./models/user"),
    Post                   =  require("./models/post"),
    bodyParser             =  require("body-parser"),
    LocalStrategy          =  require("passport-local"),
    passportLocalMongoose  =  require("passport-local-mongoose"),
    multer                 =  require("multer");

    
var app = express();

mongoose.connect("mongodb://localhost:27017/devnetDB", {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));

app.use(require("express-session")({
    secret: "hiii",
    resave: false,
    saveUninitialized: false
}));

app.use(function(req,res,next){
   res.locals.currentUser=req.user;
   
   next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));

//home route
app.get("/",function(req,res){
   Post.find({}, function(err, posts) {
                if (err) {
                    res.json({
                        status: "error",
                        message: err,
                    });
                }
                // console.log(posts);
                res.render("home", {currentUser: req.user, posts: posts});
            });
});

//addpost route
app.get("/addpost/:id", isLoggedIn, function(req,res){
   User.findById(req.params.id).exec(function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            res.render("addpost", {user: foundUser, currentUser: req.user});
        }
    }); 
});

//add new post route
app.post("/addpost/:id", function(req, res){
   var today = new Date();
   var day = today.getDate();
   var month = today.getMonth()+1;
   User.findById(req.params.id, function (err, user) {
        if (err){
            res.send(err);
        }
        else {
            var username = user.username;
            var fullName = user.fullname;
            Post.create(new Post({subject: req.body.subject, body: req.body.body, day:day, month: month, username: username, fullname: fullName }), function(err, newPost){
            if(err){
                console.log(err);
                return res.render('addpost');
            }
            else{
                    //redirect back to campgrounds page
                    res.redirect("/profile/" + req.params.id);    
                }
            });
        }
    });
  
});

//users route
app.get("/users",function(req,res){
   res.render("users", {currentUser: req.user}); 
});

//about route
app.get("/about",function(req,res){
   res.render("about", {currentUser: req.user}); 
});

// //profile route
// app.get("/profile", isLoggedIn, function(req, res){
//     res.render("profile",{currentUser: req.user});
// });

app.get("/profile/:id", isLoggedIn, function(req, res){
    User.findById(req.params.id, function (err, foundUser) {
        if (err){
            res.send(err);
        }
        else {
            // var username = user.username;
            Post.find({ username: foundUser.username}, function(err, posts) {
                if (err) {
                    res.json({
                        status: "error",
                        message: err,
                    });
                }
                console.log(posts);
                res.render("profile", {user: foundUser, currentUser: req.user, posts: posts });
            });
        }
    });
});


//SIGNUP
//show sign up form
app.get("/signup", function(req, res){
   res.render("signup"); 
});
//handling user sign up
app.post("/signup", function(req, res){
    User.register(new User({username: req.body.username, fullname: req.body.name, year: req.body.year, branch: req.body.branch, github: req.body.github}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('signup');
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/profile/" + req.user._id);
        });
    });
});

var Storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./public/profileimages");
     },
     filename: function(req, file, callback) {
         callback(null,   req.user.username + ".jpg");
     }
 });
 
 var upload = multer({
     storage: Storage
 }).array("profileImg", 1); //Field name and max count

app.post("/profileimg", function(req, res){
        upload(req, res, function(err) {
         if (err) {
             return res.end("Something went wrong!");
         }
         return res.redirect("/profile/" + req.user._id);
     });
        
    });
    

// LOGIN ROUTES
//render login form
app.get("/login", function(req, res){
   res.render("login"); 
});

//login logic
//middleware
app.post("/login", passport.authenticate("local", {
    failureRedirect: "/login"
}) ,function(req, res){
    res.redirect("/profile/" + req.user._id);
});

//LOGOUT
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.listen(process.env.PORT,process.env.IP,function(){
   console.log("Server has started!....👌");
});