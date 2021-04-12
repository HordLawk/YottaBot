const mongoose = require("mongoose");
const app = mongoose.connection;

const connect = () => mongoose.connect(`mongodb+srv://admin:${process.env.MONGO}@cluster0.omqvo.mongodb.net/alpha?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});

app.on("error", () => mongoose.disconnect());

app.on("disconnected", () => connect());

connect();