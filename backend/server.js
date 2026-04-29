
const express = require("express");
const mongoose = require("mongoose");

const app = express();

// REQUIRED
app.use(express.json());

// ROUTES
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// MONGODB CONNECTION
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

// PORT (Render will override this)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});