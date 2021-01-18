const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB_CONNECTION, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   useCreateIndex: true,
   useFindAndModify: false
});

module.exports = mongoose;