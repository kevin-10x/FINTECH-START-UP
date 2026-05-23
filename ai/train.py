#!/usr/bin/env python3
import os
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

DATA_CSV = os.path.join(os.path.dirname(__file__), 'training_data.csv')
MODEL_PKL = os.path.join(os.path.dirname(__file__), 'model.pkl')

def train():
    if not os.path.exists(DATA_CSV):
        print('No training data found at', DATA_CSV)
        return

    df = pd.read_csv(DATA_CSV)
    features = ['transaction_frequency', 'repayment_rate', 'income_consistency']
    X = df[features]
    y = df['score']

    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    joblib.dump(model, MODEL_PKL)
    print('Model trained and saved to', MODEL_PKL)

if __name__ == '__main__':
    train()
