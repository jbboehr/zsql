
var assert = require('assert');
var should = require('should');
var zsql = process.env.COVERAGE
    ? require('../zsql-cov.js')
    : require('../zsql.js');
    
var log = function(msg) {
  if( !process.env.COVERAGE ) {
    console.log(msg);
  }
}

function MockMysql() {}
MockMysql.prototype.get_one = function(sql, params, callback) {
  if( typeof(params) == 'function' ) {
    callback = params;
    params = undefined;
  }
  this.sql = sql;
  this.params = params;
  this.callback = callback;
  assert.equal('string', typeof(sql));
  if( typeof(params) != 'undefined' && !(params instanceof Array) ) {
    assert.fail(params, 'undefined|[]', 'Must be undefined or an array', 'meh');
  }
  assert.equal('function', typeof(callback));
  callback(null, null);
}
MockMysql.prototype.getOne = MockMysql.prototype.get_one;
MockMysql.prototype.get_all = MockMysql.prototype.get_one;
MockMysql.prototype.getAll = MockMysql.prototype.get_one;
MockMysql.prototype.execute = MockMysql.prototype.get_one;


function testMockProxy(fn, sql, done) {
  var mock = new MockMysql();
  sql.mysql(mock);
  sql[fn](function(err, result) {
    assert.equal(mock.sql, sql.toString());
    assert.deepEqual(mock.params, sql.params());
    assert.equal('function', typeof(mock.callback));
    assert.equal(null, err);
    assert.equal(null, result);
    done();
  });
}


suite('Select', function suiteSelect() {

  suite('.table()', function suiteSelectTable() {
    
    test(".table(String tableName)", function(done) {
      var sql = zsql.select().table('tableName');
      assert.equal(true, sql instanceof zsql.Select, 'Not an instance of Select');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".table(String dbAndTableName)", function(done) {
      var sql = zsql.select().table('dbName.tableName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `dbName`.`tableName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test(".table(Expr expression)", function(done) {
      var sql = zsql.select().table(zsql.expr('tableName'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM tableName");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.columns()', function suiteSelectColumn() {
  
    test(".columns(String columnName)", function(done) {
      var sql = zsql.select().table('tableName').columns('columnName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT `columnName` FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".columns(Array columnNames)", function(done) {
      var sql = zsql.select().table('tableName').columns(['columnName1', 'columnName2']);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT `columnName1`, `columnName2` FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".columns(Expr expression)", function(done) {
      var sql = zsql.select().table('tableName').columns(zsql.expr('COUNT(*)'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT COUNT(*) FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".columns(Expr expressionWithAs)", function(done) {
      var sql = zsql.select().table('tableName').columns(zsql.expr('COUNT(*) as count'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT COUNT(*) as count FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test("throws when boolean", function(done) {
      assert['throws'](function() {
        zsql.select().columns(false);
      }, Error);
      done();
    });

    test("throws when integer", function(done) {
      assert['throws'](function() {
        zsql.select().columns(3);
      }, Error);
      done();
    });

    test("throws when random object", function(done) {
      assert['throws'](function() {
        zsql.select().columns(new Error());
      }, Error);
      done();
    });
    
  });

  suite('.distinct()', function suiteSelectDistinct() {
  
    test(".distinct()", function(done) {
      var sql = zsql.select().table('tableName').distinct();
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT DISTINCT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".distinct(true)", function(done) {
      var sql = zsql.select().table('tableName').distinct(true);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT DISTINCT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".distinct(false)", function(done) {
      var sql = zsql.select().table('tableName').distinct(false);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.where()', function suiteSelectWhere() {
  
    test('.where(String columnName, Integer value)', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });

    test('.where(String columnName, String value)', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 'value');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` = ?");
      assert.deepEqual(params, ['value']);
      done();
    });

    test('.where(String columnExpression, Integer value)', function(done) {
      var sql = zsql.select().table('tableName').where('columnName > ?', 5);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE columnName > ?");
      assert.deepEqual(params, [5]);
      done();
    });

    test('.where(Expr expression)', function(done) {
      var sql = zsql.select().table('tableName').where(zsql.expr('LENGTH(columnName) > 0'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE LENGTH(columnName) > 0");
      assert.deepEqual(params, undefined);
      done();
    });

    test('.whereExpr(String expression)', function(done) {
      var sql = zsql.select().table('tableName').whereExpr('LENGTH(columnName) > 0');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE LENGTH(columnName) > 0");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('.where(...) x2', function(done) {
      var sql = zsql.select().table('tableName')
        .where('columnName1', 3)
        .where('columnName2', 4);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName1` = ? && `columnName2` = ?");
      assert.deepEqual(params, [3, 4]);
      done();
    });
    
    test('.where(...) x4', function(done) {
      var sql = zsql.select().table('tableName')
        .where('columnName1', 3)
        .where('columnName2', 4)
        .where('columnName3', 'test')
        .whereExpr('LENGTH(columnName4) > 0');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName1` = ? && `columnName2` = ? && `columnName3` = ? && LENGTH(columnName4) > 0");
      assert.deepEqual(params, [3, 4, 'test']);
      done();
    });
    
    test('.whereIn(String columnName, Array values)', function(done) {
      var sql = zsql.select().table('tableName').whereIn('columnName', [1, 2, 3, 4]);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` IN (?, ?, ?, ?)");
      assert.deepEqual(params, [1, 2, 3, 4]);
      done();
    });
    
    test('.whereIn(String columnName, Array values).where(String columnName, String value)', function(done) {
      var sql = zsql.select().table('tableName').whereIn('columnName1', [1]).where('columnName2', 'test');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName1` IN (?) && `columnName2` = ?");
      assert.deepEqual(params, [1, 'test']);
      done();
    });
    
    test('.whereIn(String columnName, [])', function(done) {
      var sql = zsql.select().table('tableName').whereIn('columnName1', []);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE FALSE");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.group()', function suiteSelectGroup() {
    
    test('.group(String columnName)', function(done) {
      var sql = zsql.select().table('tableName').group('columnName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` GROUP BY `columnName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.order()', function suiteSelectOrder() {
    
    test('.order(String columnName)', function(done) {
      var sql = zsql.select().table('tableName').order('columnName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY `columnName` ASC");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('.order(String columnName, "ASC")', function(done) {
      var sql = zsql.select().table('tableName').order('columnName', 'ASC');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY `columnName` ASC");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('.order(String columnName, "DESC")', function(done) {
      var sql = zsql.select().table('tableName').order('columnName', 'DESC');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY `columnName` DESC");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('.order(Expr expression)', function(done) {
      var sql = zsql.select().table('tableName').order(zsql.expr('LENGTH(columnName)'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY LENGTH(columnName) ASC");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.limit()', function suiteSelectLimit() {
    
    test('.limit(Integer limit)', function(done) {
      var sql = zsql.select().table('tableName').limit(5);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?");
      assert.equal(0, params.indexOf(5));
      assert.equal(1, params.length);
      done();
    });
    
    test('.limit(Integer limit, Integer offset)', function(done) {
      var sql = zsql.select().table('tableName').limit(5, 10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?, ?");
      assert.deepEqual(params, [10, 5]);
      done();
    });
    
  });

  suite('.offset()', function suiteSelectOffset() {
    
    test('.offset(Integer offset).limit(Integer limit)', function(done) {
      var sql = zsql.select().table('tableName').offset(5).limit(10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?, ?");
      assert.deepEqual(params, [5, 10]);
      done();
    });
    
    test('.offset(Integer offset, Integer limit)', function(done) {
      var sql = zsql.select().table('tableName').offset(5, 10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?, ?");
      assert.deepEqual(params, [5, 10]);
      done();
    });
    
  });

  suite('.hint()', function suiteSelectHint() {
    
    test('.hint(String indexName)', function(done) {
      var sql = zsql.select().table('tableName').hint('indexName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` USE INDEX (`indexName`)");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('.hint(String indexName, "FORCE")', function(done) {
      var sql = zsql.select().table('tableName').hint('indexName', 'FORCE');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` FORCE INDEX (`indexName`)");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.all()', function suiteSelectAll() {
    
    test('basic', function(done) {
      var sql = zsql.select().table('tableName');
      var all = sql.all();
      assert.deepEqual(all, ['SELECT * FROM `tableName`']);
      done();
    });
    
    test('params', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      var all = sql.all();
      assert.deepEqual(all, ['SELECT * FROM `tableName` WHERE `columnName` = ?', [1]]);
      done();
    });
    
    test('params and callback', function(done) {
      var fn = function() {};
      var sql = zsql.select().table('tableName').where('columnName', 1);
      var all = sql.all(fn);
      assert.deepEqual(all, ['SELECT * FROM `tableName` WHERE `columnName` = ?', [1], fn]);
      done();
    });
    
  });
  
  suite('Proxy', function suiteSelectProxy() {
    
    test('.get_one()', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      testMockProxy('get_one', sql, done);
    });
    
    test('.get_all()', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      testMockProxy('get_all', sql, done);
    });
    
    test('.execute()', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      testMockProxy('execute', sql, done);
    });
    
  });
  
});


suite('Insert', function suiteInsert() {

  suite(".table()", function suiteInsertTable(done) {
    
    test(".table(String tableName)", function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName : 1
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName`) VALUES (?)");
      assert.deepEqual(params, [1]);
      done();
    });

    test(".table(String dbAndtableName)", function(done) {
      var sql = zsql.insert().table('dbName.tableName').values({
        columnName : 1
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `dbName`.`tableName` (`columnName`) VALUES (?)");
      assert.deepEqual(params, [1]);
      done();
    });
    
    test(".table(Expr expression)", function(done) {
      var sql = zsql.insert().table(zsql.expr('tableName')).values({
        columnName : 1
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO tableName (`columnName`) VALUES (?)");
      assert.deepEqual(params, [1]);
      done();
    });
    
    test(".into(String tableName)", function(done) {
      var sql = zsql.insert().into('tableName').values({
        columnName : 1
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName`) VALUES (?)");
      assert.deepEqual(params, [1]);
      done();
    });
    
  });

  suite(".value()", function suiteInsertValues(done) {
    
    test(".value(String columnName, String value)", function(done) {
      var sql = zsql.insert().table('tableName').value('columnName', 'value');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName`) VALUES (?)");
      assert.deepEqual(params, ['value']);
      done();
    });
    
    test(".value(String columnName, Integer value) x2", function(done) {
      var sql = zsql.insert().table('tableName').value('columnName1', 3).value('columnName2', 4);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName1`, `columnName2`) VALUES (?, ?)");
      assert.deepEqual(params, [3, 4]);
      done();
    });
    
  });

  suite(".values()", function suiteInsertValues(done) {
    
    test(".values(Object oneValue)", function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName : 1
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName`) VALUES (?)");
      assert.deepEqual(params, [1]);
      done();
    });
    
    test(".values(Object threeValues)", function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName1 : 1,
        columnName2 : 'value1',
        columnName3 : 'value2'
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName1`, `columnName2`, `columnName3`) VALUES (?, ?, ?)");
      assert.deepEqual(params, [1, 'value1', 'value2']);
      done();
    });
    
    test(".values(Object valuesWithExpr)", function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName1 : 1,
        columnName2 : zsql.expr('NOW()')
      });
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "INSERT INTO `tableName` (`columnName1`, `columnName2`) VALUES (?, NOW())");
      assert.deepEqual(params, [1]);
      done();
    });
    
  });

  suite('.all()', function SuiteInsertAll() {
    
    test('params', function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName : 1
      });
      var all = sql.all();
      assert.deepEqual(all, ['INSERT INTO `tableName` (`columnName`) VALUES (?)', [1]]);
      done();
    });
    
    test('params and callback', function(done) {
      var fn = function() {};
      var sql = zsql.insert().table('tableName').values({
        columnName : 1
      });
      var all = sql.all(fn);
      assert.deepEqual(all, ['INSERT INTO `tableName` (`columnName`) VALUES (?)', [1], fn]);
      done();
    });
    
  });

  suite('Proxy', function SuiteInsertProxy() {
    
    test('execute', function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName : 1
      });
      testMockProxy('execute', sql, done);
    });
    
  });
  
});

suite('Delete', function suiteDelete() {

  suite('.table()', function suiteDeleteTable() {
    
    test(".table(String tableName)", function(done) {
      var sql = zsql.del().from('tableName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "DELETE FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test(".table(String dbAndtableName)", function(done) {
      var sql = zsql.del().from('dbName.tableName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "DELETE FROM `dbName`.`tableName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test(".table(Expr expression)", function(done) {
      var sql = zsql.del().table(zsql.expr('tableName'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "DELETE FROM tableName");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('.all()', function SuiteDeleteAll() {
    
    test('basic', function(done) {
      var sql = zsql.del().from('tableName');
      var all = sql.all();
      assert.deepEqual(all, ['DELETE FROM `tableName`']);
      done();
    });
    
    test('callback', function(done) {
      var fn = function() {};
      var sql = zsql.del().from('tableName');
      var all = sql.all(fn);
      assert.deepEqual(all, ['DELETE FROM `tableName`', fn]);
      done();
    });
    
  });

  suite('Aggregate', function SuiteDeleteAggregate() {
    
    test('Aggregate', function(done) {
      log('Other methods should have been tested through ExtendedQuery and Select');
      var sql = zsql.del().from('tableName')
        .where('columnName1', 3)
        .where('columnName2', 4)
        .order('columnName3', 'ASC')
        .limit(5)
        .offset(10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "DELETE FROM `tableName` WHERE `columnName1` = ? && `columnName2` = ? ORDER BY `columnName3` ASC LIMIT ?, ?");
      assert.deepEqual(params, [3, 4, 10, 5]);
      done();
    });
    
  });

  suite('Proxy', function SuiteInsertProxy() {
    
    test('.execute()', function(done) {
      var sql = zsql.insert().table('tableName').values({
        columnName : 1
      });
      testMockProxy('execute', sql, done);
    });
    
  });
  
});

suite('Update', function() {

  suite('.table()', function suiteUpdateTable() {
    
    test(".table(String tableName)", function(done) {
      var sql = zsql.update().table('tableName').set('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });

    test(".table(String dbAndTableName)", function(done) {
      var sql = zsql.update().table('dbName.tableName').set('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `dbName`.`tableName` SET `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });
    
    test(".table(Expr expression)", function(done) {
      var sql = zsql.update().table(zsql.expr('tableName')).set('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE tableName SET `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });
    
  });

  suite('.set()', function suiteUpdateSet() {
    
    test(".set(String columnName, Integer value)", function(done) {
      var sql = zsql.update().table('tableName').set('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });
    
    test(".set(String columnName, Expr expression)", function(done) {
      var sql = zsql.update().table('tableName').set('columnName', zsql.expr('columnName + 2'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName` = columnName + 2");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test(".set(...) x2", function(done) {
      var sql = zsql.update().table('tableName').set('columnName1', 3).set('columnName2', 4);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName1` = ? , `columnName2` = ?");
      assert.deepEqual(params, [3, 4]);
      done();
    });
    
    test(".value(String columnName, Integer value)", function(done) {
      var sql = zsql.update().table('tableName').value('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });
    
  });

  suite('.values()', function suiteUpdateSet() {
    
    test(".values(Object threeValues)", function(done) {
      var sql = zsql.update().table('tableName').values({
        columnName1 : 4,
        columnName2 : 'value',
        columnName3 : zsql.expr('UUID()')
      }).where('columnName4 = ?', '1337').limit(1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName1` = ? , `columnName2` = ? , `columnName3` = UUID() WHERE columnName4 = ? LIMIT ?");
      assert.deepEqual(params, [4, 'value', '1337', 1]);
      done();
    });
    
  });

  suite('.all()', function suiteUpdateAll() {
    
    test('params', function(done) {
      var sql = zsql.update().table('tableName').values({
        columnName : 1
      });
      var all = sql.all();
      assert.deepEqual(all, ['UPDATE `tableName` SET `columnName` = ?', [1]]);
      done();
    });
    
    test('params and callback', function(done) {
      var fn = function() {};
      var sql = zsql.update().table('tableName').values({
        columnName : 1
      });
      var all = sql.all(fn);
      assert.deepEqual(all, ['UPDATE `tableName` SET `columnName` = ?', [1], fn]);
      done();
    });
    
  });

  suite('Aggregate', function SuiteUpdateAggregate() {
    
    test('Aggregate', function(done) {
      log('Other methods should have been tested through ExtendedQuery and Select');
      var sql = zsql.update().table('tableName')
        .values({
          columnName4 : 1,
          columnName5 : zsql.expr('NOW()')
        })
        .where('columnName1', 3)
        .where('columnName2', 4)
        .order('columnName3', 'ASC')
        .limit(5)
        .offset(10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "UPDATE `tableName` SET `columnName4` = ? , `columnName5` = NOW() WHERE `columnName1` = ? && `columnName2` = ? ORDER BY `columnName3` ASC LIMIT ?, ?");
      assert.deepEqual(params, [1, 3, 4, 10, 5]);
      done();
    });
    
  });

  suite('Proxy', function SuiteUpdateProxy() {
    
    test('execute', function(done) {
      var sql = zsql.update().table('tableName').values({
        columnName : 1
      });
      testMockProxy('execute', sql, done);
    });
    
  });
  
});
