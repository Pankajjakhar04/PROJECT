import sys
import pickle
import pandas as pd

if len(sys.argv) < 4:
    print("Usage: python predict.py <hours> <assignments> <attendance>")
    sys.exit(1)

# Load the ML model
model = pickle.load(open("student_model.pkl", "rb"))

# Input values
hours = float(sys.argv[1])
assignments = float(sys.argv[2])
attendance = float(sys.argv[3])

# Predict using the model
input_data = pd.DataFrame([[hours, assignments, attendance]], columns=["hours", "assignments", "attendance"])
prediction = model.predict(input_data)

print(prediction[0])
