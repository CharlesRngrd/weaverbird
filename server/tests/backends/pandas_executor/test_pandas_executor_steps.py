import json
from glob import glob
from os import path

import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor import execute_pipeline
from weaverbird.pipeline import Pipeline

step_cases_files = glob('../fixtures/*/*.step.json')

test_cases = []
for x in step_cases_files:
    case_hierarchy = path.dirname(x).removeprefix('../fixtures/')
    case_name = path.splitext(path.basename(x))[0].split('.')[0]
    case_id = case_hierarchy + '_' + case_name
    step_file_path = x
    in_file_path = path.join(path.dirname(x), f'{case_name}.in.json')
    out_file_path = path.join(path.dirname(x), f'{case_name}.out.json')
    test_cases.append(
        pytest.param(case_id, step_file_path, in_file_path, out_file_path, id=case_id)
    )


@pytest.mark.parametrize('case_id,step_file_path,in_file_path,out_file_path', test_cases)
def test_pandas_execute_pipeline(case_id, step_file_path, in_file_path, out_file_path):
    step_file = open(step_file_path, 'r')
    step = json.loads(step_file.read())
    step_file.close()

    df_in = pd.read_json(in_file_path, orient='table')
    df_out = pd.read_json(out_file_path, orient='table')

    pipeline = Pipeline(steps=[{'name': 'domain', 'domain': 'in'}, step])
    DOMAINS = {'in': df_in}
    result = execute_pipeline(pipeline, domain_retriever=lambda x: DOMAINS[x])[0]

    assert_dataframes_equals(df_out, result)
