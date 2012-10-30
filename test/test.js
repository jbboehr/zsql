
var assert = require('assert');
var should = require('should');
var zsql = require('../');


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


suite('Select', function() {

  suite('Table', function() {
    
    test("simple", function(done) {
      var sql = zsql.select().table('tableName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test("with database", function(done) {
      var sql = zsql.select().table('dbName.tableName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `dbName`.`tableName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test("expr", function(done) {
      var sql = zsql.select().table(zsql.expr('tableName'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM tableName");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('Columns', function() {
  
    test("string", function(done) {
      var str = zsql.select().table('tableName').columns('columnName').toString();
      assert.equal(str, "SELECT `columnName` FROM `tableName`");
      done();
    });

    test("array", function(done) {
      var str = zsql.select().table('tableName').columns(['columnName1', 'columnName2']).toString();
      assert.equal(str, "SELECT `columnName1`, `columnName2` FROM `tableName`");
      done();
    });

    test("expr", function(done) {
      var str = zsql.select().table('tableName').columns(zsql.expr('COUNT(*)')).toString();
      assert.equal(str, "SELECT COUNT(*) FROM `tableName`");
      done();
    });

    test("expr with as", function(done) {
      var str = zsql.select().table('tableName').columns(zsql.expr('COUNT(*) as count')).toString();
      assert.equal(str, "SELECT COUNT(*) as count FROM `tableName`");
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

  suite('Distinct', function() {
  
    test("undefined", function(done) {
      var sql = zsql.select().table('tableName').distinct();
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT DISTINCT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test("true", function(done) {
      var sql = zsql.select().table('tableName').distinct(true);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT DISTINCT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });

    test("false", function(done) {
      var sql = zsql.select().table('tableName').distinct(false);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('Where', function() {
  
    test('simple integer', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` = ?");
      assert.deepEqual(params, [1]);
      done();
    });

    test('simple string', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 'value');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` = ?");
      assert.deepEqual(params, ['value']);
      done();
    });

    test('expression', function(done) {
      var sql = zsql.select().table('tableName').where('columnName > ?', 5);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE columnName > ?");
      assert.deepEqual(params, [5]);
      done();
    });

    test('expr object', function(done) {
      var sql = zsql.select().table('tableName').where(zsql.expr('LENGTH(columnName) > 0'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE LENGTH(columnName) > 0");
      assert.deepEqual(params, undefined);
      done();
    });

    test('expr object using whereExpr', function(done) {
      var sql = zsql.select().table('tableName').whereExpr('LENGTH(columnName) > 0');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE LENGTH(columnName) > 0");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('multi two items', function(done) {
      var sql = zsql.select().table('tableName')
        .where('columnName1', 3)
        .where('columnName2', 4);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName1` = ? && `columnName2` = ?");
      assert.deepEqual(params, [3, 4]);
      done();
    });
    
    test('multi four items', function(done) {
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
    
    test('where in', function(done) {
      var sql = zsql.select().table('tableName').whereIn('columnName', [1, 2, 3, 4]);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` IN (?, ?, ?, ?)");
      assert.deepEqual(params, [1, 2, 3, 4]);
      done();
    });
    
    test('where in with simple', function(done) {
      var sql = zsql.select().table('tableName').whereIn('columnName1', [1]).where('columnName2', 'test');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName1` IN (?) && `columnName2` = ?");
      assert.deepEqual(params, [1, 'test']);
      done();
    });
    
    test('where in with empty array', function(done) {
      var sql = zsql.select().table('tableName').whereIn('columnName1', []);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE FALSE");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('Group', function() {
    
    test('simple', function(done) {
      var sql = zsql.select().table('tableName').group('columnName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` GROUP BY `columnName`");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('Order', function() {
    
    test('simple direction undefined', function(done) {
      var sql = zsql.select().table('tableName').order('columnName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY `columnName` ASC");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('simple direction asc', function(done) {
      var sql = zsql.select().table('tableName').order('columnName', 'ASC');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY `columnName` ASC");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('simple direction desc', function(done) {
      var sql = zsql.select().table('tableName').order('columnName', 'DESC');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY `columnName` DESC");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('expr', function(done) {
      var sql = zsql.select().table('tableName').order(zsql.expr('LENGTH(columnName)'));
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` ORDER BY LENGTH(columnName) ASC");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('Limit', function() {
    
    test('simple', function(done) {
      var sql = zsql.select().table('tableName').limit(5);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?");
      assert.equal(0, params.indexOf(5));
      assert.equal(1, params.length);
      done();
    });
    
    test('with offset', function(done) {
      var sql = zsql.select().table('tableName').limit(5, 10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?, ?");
      assert.deepEqual(params, [10, 5]);
      done();
    });
    
  });

  suite('Offset', function() {
    
    test('with limit', function(done) {
      var sql = zsql.select().table('tableName').offset(5, 10);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` LIMIT ?, ?");
      assert.deepEqual(params, [5, 10]);
      done();
    });
    
  });

  suite('Hint', function() {
    
    test('simple', function(done) {
      var sql = zsql.select().table('tableName').hint('indexName');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` USE INDEX (`indexName`)");
      assert.deepEqual(params, undefined);
      done();
    });
    
    test('simple force', function(done) {
      var sql = zsql.select().table('tableName').hint('indexName', 'FORCE');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` FORCE INDEX (`indexName`)");
      assert.deepEqual(params, undefined);
      done();
    });
    
  });

  suite('misc', function() {
    
    test('all no params', function(done) {
      var sql = zsql.select().table('tableName');
      var all = sql.all();
      assert.deepEqual(all, ['SELECT * FROM `tableName`']);
      done();
    });
    
    test('all with params', function(done) {
      var sql = zsql.select().table('tableName').where('columnName', 1);
      var all = sql.all();
      assert.deepEqual(all, ['SELECT * FROM `tableName` WHERE `columnName` = ?', [1]]);
      done();
    });
    
    test('all with params and callback', function(done) {
      var fn = function() {};
      var sql = zsql.select().table('tableName').where('columnName', 1);
      var all = sql.all(fn);
      assert.deepEqual(all, ['SELECT * FROM `tableName` WHERE `columnName` = ?', [1], fn]);
      done();
    });
    
    test('get_one', function(done) {
      var mock = new MockMysql();
      zsql.select(mock).table('tableName').where('columnName', 1)
        .get_one(function(err, result) {
          assert.equal(mock.sql, 'SELECT * FROM `tableName` WHERE `columnName` = ?');
          assert.deepEqual(mock.params, [1]);
          assert.equal('function', typeof(mock.callback));
          assert.equal(null, err);
          assert.equal(null, result);
          done();
        });
    });
    
    test('get_all', function(done) {
      var mock = new MockMysql();
      zsql.select(mock).table('tableName').where('columnName', 1)
        .get_all(function(err, result) {
          assert.equal(mock.sql, 'SELECT * FROM `tableName` WHERE `columnName` = ?');
          assert.deepEqual(mock.params, [1]);
          assert.equal('function', typeof(mock.callback));
          assert.equal(null, err);
          assert.equal(null, result);
          done();
        });
    });
    
    test('execute', function(done) {
      var mock = new MockMysql();
      zsql.select(mock).table('tableName').where('columnName', 1)
        .execute(function(err, result) {
          assert.equal(mock.sql, 'SELECT * FROM `tableName` WHERE `columnName` = ?');
          assert.deepEqual(mock.params, [1]);
          assert.equal('function', typeof(mock.callback));
          assert.equal(null, err);
          assert.equal(null, result);
          done();
        });
    });
    
  });
  
});

suite('Insert', function() {

  test("table", function(done) {
    done();
  });
  
});

suite('Delete', function() {

  test("table", function(done) {
    done();
  });
  
});

suite('Update', function() {

  test("table", function(done) {
    done();
  });
  
});
