
var assert = require('assert');
var should = require('should');
var zsql = require('../');

suite('Select', function() {

  suite('Table', function() {
    
    test("Basic", function(done) {
      var str = zsql.select().table('tableName').toString();
      assert.equal(str, "SELECT * FROM `tableName`");
      done();
    });

    test("Database", function(done) {
      var str = zsql.select().table('dbName.tableName').toString();
      assert.equal(str, "SELECT * FROM `dbName`.`tableName`");
      done();
    });
    
  });

  suite('Columns', function() {
  
    test("Single", function(done) {
      var str = zsql.select().table('tableName').columns('columnName').toString();
      assert.equal(str, "SELECT `columnName` FROM `tableName`");
      done();
    });

    test("Array", function(done) {
      var str = zsql.select().table('tableName').columns(['columnName1', 'columnName2']).toString();
      assert.equal(str, "SELECT `columnName1`, `columnName2` FROM `tableName`");
      done();
    });

    test("Expr", function(done) {
      var str = zsql.select().table('tableName').columns(zsql.expr('COUNT(*)')).toString();
      assert.equal(str, "SELECT COUNT(*) FROM `tableName`");
      done();
    });

    test("Expr with as", function(done) {
      var str = zsql.select().table('tableName').columns(zsql.expr('COUNT(*) as count')).toString();
      assert.equal(str, "SELECT COUNT(*) as count FROM `tableName`");
      done();
    });
    
  });

  suite('Distinct', function() {
  
    test("No argument", function(done) {
      var str = zsql.select().table('tableName').distinct().toString();
      assert.equal(str, "SELECT DISTINCT * FROM `tableName`");
      done();
    });

    test("true", function(done) {
      var str = zsql.select().table('tableName').distinct(true).toString();
      assert.equal(str, "SELECT DISTINCT * FROM `tableName`");
      done();
    });

    test("false", function(done) {
      var str = zsql.select().table('tableName').distinct(false).toString();
      assert.equal(str, "SELECT * FROM `tableName`");
      done();
    });
    
  });

  suite('Where', function() {
  
    test('simple integer', function(done) {
      var sql = str = zsql.select().table('tableName').where('columnName', 1);
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` = ?");
      assert.equal(0, params.indexOf(1));
      assert.equal(1, params.length);
      done();
    });

    test('simple string', function(done) {
      var sql = str = zsql.select().table('tableName').where('columnName', 'value');
      var str = sql.toString();
      var params = sql.params();
      assert.equal(str, "SELECT * FROM `tableName` WHERE `columnName` = ?");
      assert.equal(0, params.indexOf('value'));
      assert.equal(1, params.length);
      done();
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
