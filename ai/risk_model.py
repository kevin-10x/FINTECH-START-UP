#!/usr/bin/env python3
import sys
import json
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

def calculate_score(features: dict) -> int:
    # features expected: transaction_frequency, repayment_rate, income_consistency
    try:
        tf = float(features.get('transaction_frequency', 0))
        rr = float(features.get('repayment_rate', 0))
        ic = float(features.get('income_consistency', 0))
    except Exception:
        return 0

    score = tf * 0.3 + rr * 0.5 + ic * 0.2
    return int(round(score))

def decide(score: int):
    if score > 75:
        return {"approved": True, "interest": 5.0, "score": score}
    elif score > 50:
        return {"approved": True, "interest": 10.0, "score": score}
    else:
        return {"approved": False, "score": score}

def predict_with_model(features: dict):
    try:
        import joblib
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            X = [[
                float(features.get('transaction_frequency', 0)),
                float(features.get('repayment_rate', 0)),
                float(features.get('income_consistency', 0)),
            ]]
            pred = model.predict(X)
            score = int(round(float(pred[0])))
            return score
    except Exception:
        pass
    return None

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"approved": False, "score": 0}))
        return

    try:
        data = json.loads(raw)
    except Exception:
        print(json.dumps({"approved": False, "score": 0}))
        return

    features = data.get('features', {}) or {}

    score = predict_with_model(features)
    if score is None:
        score = calculate_score(features)

    decision = decide(score)
    print(json.dumps(decision))

if __name__ == '__main__':
    main()
