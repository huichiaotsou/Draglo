const User = require('../model/user_model')

const signUp = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      let result = await User.signUp(email, password);      
      if (result.error) {
        res.status(result.statusCode).send(result.error);
      } else {
        res.status(200).send({
          data : {
              access_token : result.access_token,
              access_expired : 28800,
              user: {
                id: result.id,
                name: result.name,
                email: result.email,
              }
            }
        });
      }
    } catch (err) {
      next(err);
    }
  }

  
const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let result = await User.nativeSignIn(email, password);      
        if (result.error) {
          res.status(result.statusCode).send(result.error);
        } else {
          res.status(200).send({
            data : {
              access_token : result.access_token,
              access_expired : 28800,
              user: {
                id: result.id,
                name: result.name,
                email: result.email,
              }
            }
          });
        }
      } catch (err) {
        next(err);
      }
}

module.exports = {
    signIn,
    signUp
}