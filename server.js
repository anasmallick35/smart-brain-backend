const express = require("express");
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'Mallick@123',
      database : 'smart-brain'
    }
  });

const app = express();

app.use(express.json());
app.use(cors());
app.use(cors({
    origin: 'https://smart-brain-frontend-omega.vercel.app/'
  }));

app.get('/',(req,res) =>{
    res.send('success');
})

/*signin database code*/

app.post('/signin' , (req,res)=>{
    db.select('email','hash').from('login')
    .where('email', '=', req.body.email)
    .then(data =>{
        const isValid = bcrypt.compareSync(req.body.password,data[0].hash);
        if(isValid){
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user =>{
                res.json(user[0]);
            })
            .catch(err=>{
                res.status(404).json("unable to get user ")
            })
        }
        else{
            res.status(404).json("wrong credentials")
        }
    })
    .catch(err=>{
        res.status(404).json("wrong credentials")
})
})

/*register database code*/

app.post('/register',(req,res)=>{
    const { email, password , name } = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')

        .then(loginEmail =>{
            return trx('users')
    .returning('*')
    .insert({
        email:loginEmail[0].email,
        name: name,
        joined: new Date()
    }).then(user =>{
        res.json(user[0]);
    })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err =>
        res.status(404).json('user already exists'))
    
})


/*get user profile*/

app.get('/profile/:id' , (req,res)=>{
    const {id} = req.params;
    let found = false;
    db.select('*').from('users').where({id:id})
    .then(user=>{
        if(user.length)
        {
        res.json(user[0]);
        }
        else{
            res.status(404).json("user not found")
        }
    })
    .catch(err => res.status(404).json(err))
})

/*image count put*/

app.put('/image',(req,res)=>{
    const {id} = req.body;
    db('users').where('id','=', id)
    .increment('entries',1)
    .returning('entries')
    .then(entries =>{
        res.json(entries[0].entries);
    })
    .catch(err =>{
        res.status(404).json("unable to get entries")
    })
})

/*for password
bcrypt.hash("bacon", null, null, function(err, hash) {
    // Store hash in your password DB.
});*/
/*
// Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});*/
app.listen(3000, ()=>{
    console.log("app is running on port 3000")
});
