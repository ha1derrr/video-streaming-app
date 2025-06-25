import { Router } from "express";

const staticRouter = Router();

staticRouter.get('/',(req,res)=>{
    res.send('<h1>Hello World</h1>')
})

export {staticRouter}