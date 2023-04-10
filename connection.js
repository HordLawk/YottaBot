const mongoose = require("mongoose");
const app = mongoose.connection;

const connect = () => mongoose.connect(`${process.env.MONGOURL}?retryWrites=true&w=majority`);

app.on("error", () => mongoose.disconnect());

app.on("disconnected", () => connect());

connect();