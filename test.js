const logger = require("logat")
const _getUsernamesInProject = async () =>{
    try{
        let res = [
            { _id: '66bb729400a5ae78957da20b', username: 'atharva' },
            { _id: '66c35014e7c125d5a9bb19d5', username: 'atharvav2' }
        ]
        let usernames = [];
        for(let user of res){
            usernames.push(user.username);
        }
        
        return usernames;

    }catch(err){
        logger.error(`Error || Error in getting all usernames`);
        logger.error(err);
        throw err;
    }
}

_getUsernamesInProject().then((res)=>{
    console.log(res);
}).catch((err)=>{
    console.log(err);
})