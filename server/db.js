const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/studentDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const predictionSchema = new mongoose.Schema({
  hours: Number,
  assignments: Number,
  attendance: Number,
  predictedScore: Number,
});

const Prediction = mongoose.model("Prediction", predictionSchema);

module.exports = Prediction;
