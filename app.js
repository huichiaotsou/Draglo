const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.listen(4000, ()=>{
    console.log('app running on port 4000');
})

const { verifyToken } = require('./utils/utils')

app.use(express.static('public'));

//rateLimiter
app.use('/', require('./server/route/user_route'))
app.use('/',
    verifyToken,
    [
        require('./server/route/automation_route'),
        require('./server/route/trip_route'),
    ]
)

app.use((err, req, res, next)=>{
    console.log(err);
    res.status(500).send(err);
})

app.use((req, res)=>{
    res.status(404).send('the page does not exist');
})
