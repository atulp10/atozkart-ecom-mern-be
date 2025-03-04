export const isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        return res.status(401).json({message:'Please Login first'})
    }
    else next();
}

export const isAuthorized=(req,res,next)=>{
    if(req.user.email!=='admin@gmail.com'){
        return res.status(401).json({message:"Go to hell hacker"});
    }
    else next();
}