import * as dd from '../../';

test('bigInt', () => {
  const c = dd.bigInt(123);
  expect(c.props.types).toContain(dd.dt.bigInt);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(false);
});

test('unsignedBigInt', () => {
  const c = dd.unsignedBigInt(123);
  expect(c.props.types).toContain(dd.dt.bigInt);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(true);
});

test('int', () => {
  const c = dd.int(123);
  expect(c.props.types).toContain(dd.dt.int);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(false);
});

test('unsignedInt', () => {
  const c = dd.unsignedInt(123);
  expect(c.props.types).toContain(dd.dt.int);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(true);
});

test('smallInt', () => {
  const c = dd.smallInt(123);
  expect(c.props.types).toContain(dd.dt.smallInt);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(false);
});

test('unsignedSmallInt', () => {
  const c = dd.unsignedSmallInt(123);
  expect(c.props.types).toContain(dd.dt.smallInt);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(true);
});

test('tinyInt', () => {
  const c = dd.tinyInt(123);
  expect(c.props.types).toContain(dd.dt.tinyInt);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(false);
});

test('unsignedTinyInt', () => {
  const c = dd.unsignedTinyInt(123);
  expect(c.props.types).toContain(dd.dt.tinyInt);
  expect(c.props.default).toBe(123);
  expect(c.props.unsigned).toBe(true);
});

test('char', () => {
  const c = dd.char(20, 'ha');
  expect(c.props.types).toContain(dd.dt.char);
  expect(c.props.default).toBe('ha');
  expect(c.props.length).toBe(20);
});

test('varChar', () => {
  const c = dd.varChar(20, 'ha');
  expect(c.props.types).toContain(dd.dt.varChar);
  expect(c.props.default).toBe('ha');
  expect(c.props.length).toBe(20);
});

test('pk', () => {
  const c = dd.pk();
  expect(c.props.types).toContain(dd.dt.bigInt);
  expect(c.props.unique).toBe(false);
  expect(c.props.nullable).toBe(false);
  expect(c.props.unsigned).toBe(true);
});

test('pk(column)', () => {
  const charCol = dd.char(3);
  const c = dd.pk(charCol);
  expect(c).toBe(charCol);
  expect(c.props.unique).toBe(false);
  expect(c.props.nullable).toBe(false);
});

test('text', () => {
  const c = dd.text('ha');
  expect(c.props.types).toContain(dd.dt.text);
  expect(c.props.default).toBe('ha');
});

test('double', () => {
  const c = dd.double(20);
  expect(c.props.types).toContain(dd.dt.double);
  expect(c.props.default).toBe(20);
});

test('float', () => {
  const c = dd.float(20);
  expect(c.props.types).toContain(dd.dt.float);
  expect(c.props.default).toBe(20);
});

test('bool', () => {
  const c = dd.bool(true);
  expect(c.props.types).toContain(dd.dt.bool);
  expect(c.props.default).toBe(true);
});

test('datetime', () => {
  let c = dd.datetime();
  expect(c.props.types).toContain(dd.dt.datetime);

  c = dd.datetime(true);
  expect((c.props.default as object).toString()).toBe('CALL(0)');
});

test('date', () => {
  let c = dd.date();
  expect(c.props.types).toContain(dd.dt.date);

  c = dd.date(true);
  expect((c.props.default as object).toString()).toBe('CALL(1)');
});

test('time', () => {
  let c = dd.time();
  expect(c.props.types).toContain(dd.dt.time);

  c = dd.time(true);
  expect((c.props.default as object).toString()).toBe('CALL(2)');
});
