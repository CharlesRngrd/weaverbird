import { expect } from 'chai';
import { DataSet } from '@/lib/dataset';
import { mongoResultsToDataset, MongoResults, _guessType } from '@/lib/dataset/mongo';

/**
 * helper functions to sort a dataset so that we can test output in a predictible way.
 *
 * @param dataset input dataset
 * @return the sorted dataset
 */
function _sortDataset(dataset: DataSet): DataSet {
  const sortedColumns = Array.from(dataset.headers).sort((col1, col2) =>
    col1.name.localeCompare(col2.name),
  );
  const reorderMap = sortedColumns.map(colname => dataset.headers.indexOf(colname));
  const sortedData = [];
  for (const row of dataset.data) {
    sortedData.push(reorderMap.map(newidx => row[newidx]));
  }
  return {
    headers: sortedColumns,
    data: sortedData,
  };
}

describe('_sortDataset tests', () => {
  it('should be able to leave as is sorted results', () => {
    const dataset: DataSet = {
      headers: [{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }],
      data: [[1, 2, 3], [4, 5, 6]],
    };
    const sorted = _sortDataset(dataset);
    expect(sorted.headers).to.eql([{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }]);
    expect(sorted.data).to.eql([[1, 2, 3], [4, 5, 6]]);
  });

  it('should be able to sort results', () => {
    const dataset: DataSet = {
      headers: [{ name: 'col3' }, { name: 'col1' }, { name: 'col4' }, { name: 'col2' }],
      data: [[1, 2, 3, 4], [5, 6, 7, 8]],
    };
    const sorted = _sortDataset(dataset);
    expect(sorted.headers).to.eql([
      { name: 'col1' },
      { name: 'col2' },
      { name: 'col3' },
      { name: 'col4' },
    ]);
    expect(sorted.data).to.eql([[2, 4, 1, 3], [6, 8, 5, 7]]);
  });
});

describe('Dataset helper tests', () => {
  it('should be able to handle empty mongo results', () => {
    const mongoResults: MongoResults = [];
    const dataset = mongoResultsToDataset(mongoResults);
    expect(dataset.headers).to.eql([]);
    expect(dataset.data).to.eql([]);
  });

  it('should be able to convert homegeneous mongo results', () => {
    const mongoResults: MongoResults = [
      { col1: 'foo', col2: 42, col3: true },
      { col1: 'bar', col2: 7, col3: false },
    ];
    const dataset = _sortDataset(mongoResultsToDataset(mongoResults));
    expect(dataset.headers).to.eql([{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }]);
    expect(dataset.data).to.eql([['foo', 42, true], ['bar', 7, false]]);
  });

  it('should be able to convert heterogeneous mongo results', () => {
    const mongoResults: MongoResults = [
      { col1: 'foo', col3: true },
      { col1: 'bar', col2: 7, col4: '?' },
    ];
    const dataset = _sortDataset(mongoResultsToDataset(mongoResults));
    expect(dataset.headers).to.eql([
      { name: 'col1' },
      { name: 'col2' },
      { name: 'col3' },
      { name: 'col4' },
    ]);
    expect(dataset.data).to.eql([['foo', null, true, null], ['bar', 7, null, '?']]);
  });
});

describe('_guessType', () => {
  it('should return float', () => {
    const val = _guessType(42.34);
    expect(val).to.equal('float');
  });

  it('should return integer', () => {
    const val = _guessType(42);
    expect(val).to.equal('integer');
  });

  it('should return string', () => {
    const val = _guessType('value');
    expect(val).to.equal('string');
  });

  it('should return boolean', () => {
    const val = _guessType(false);
    expect(val).to.equal('boolean');
  });

  it('should return date', () => {
    const val = _guessType(new Date());
    expect(val).to.equal('date');
  });

  it('should return object', () => {
    const val = _guessType({ value: 'my_value' });
    expect(val).to.equal('object');
  });

  it('should return null when value is null', () => {
    const val = _guessType(null);
    expect(val).to.eql(null);
  });

  it('should return null when value is undefined', () => {
    const val = _guessType(undefined);
    expect(val).to.eql(null);
  });

  it('should return null when value is Symbol', () => {
    const val = _guessType(Symbol());
    expect(val).to.eql(null);
  });

  it('should return null when value is function', () => {
    const val = _guessType(() => {});
    expect(val).to.eql(null);
  });
});
