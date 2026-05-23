import os
import json
import subprocess

def test_calculate_score_heuristic():
    # run the risk_model with simple features via stdin
    inp = json.dumps({"features": {"transaction_frequency": 50, "repayment_rate": 80, "income_consistency": 60}})
    p = subprocess.Popen(['python3', 'ai/risk_model.py'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    out, _ = p.communicate(input=inp.encode())
    data = json.loads(out.decode())
    assert 'score' in data

def test_training_creates_model(tmp_path):
    # create small dataset
    csv = tmp_path / 'training_data.csv'
    csv.write_text('transaction_frequency,repayment_rate,income_consistency,score\n50,80,60,74\n30,40,20,34\n')
    # copy to ai/ folder
    target = os.path.join('ai', 'training_data.csv')
    with open(target, 'w') as f:
        f.write(csv.read_text())

    res = subprocess.run(['python3', 'ai/train.py'])
    assert res.returncode == 0
    assert os.path.exists(os.path.join('ai', 'model.pkl'))
