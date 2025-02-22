from llm_model.fact_checking_pipeline import check_claims_json

import json

def load_json_lines(filename):
    data = []
    with open(filename, 'r') as file:
        for line in file:
            data.append(json.loads(line.strip()))
    return data


def evaluate_fact_checking_pipeline():

