const Trip = require('../model/trip_model')
const User = require('../model/user_model')

const getDashboard = async (req, res, next) => {
  let userId = req.user.id;
  let { keyword, archived, shared } = req.query;
  let result;
  if (keyword) {
    result = await Trip.getDashboard(userId, "search", keyword);
  } else if (archived) {
    result = await Trip.getDashboard(userId, "archived");
  } else if (shared) {
    result = await Trip.getDashboard(userId, "shared");
  } else {
    result = await Trip.getDashboard(userId);
  }
  res.send(result)
}

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
    signUp,
    getDashboard
}