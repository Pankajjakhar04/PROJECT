import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import pickle

# Dataset
data = pd.DataFrame({
    "hours": [5, 10, 15, 20],
    "assignments": [2, 4, 6, 8],
    "attendance": [50, 70, 85, 90],
    "score": [40, 60, 75, 90]
})

X = data[["hours", "assignments", "attendance"]]
y = data["score"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LinearRegression().fit(X_train, y_train)

# Save the model
pickle.dump(model, open("student_model.pkl", "wb"))
