const mongoose = require("mongoose");

exports.dbConnect = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("DataBase Connection Successful"))
    .catch((error) => {
      console.error("DataBase Connection Failed", error.message);
      process.exit(1);
    });
};