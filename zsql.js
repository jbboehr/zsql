
/**
 * Utility function to quote identifier
 */
function quoteIdentifier(identifier) {
  return '`' + identifier.replace('`', '``').replace('.', '`.`') + '`';
}
module.exports.quoteIdentifier = quoteIdentifier;

/**
 * Utility function to quote identifier or convert to string if an Expr object
 */
function qexpr(expr) {
  if( expr instanceof Expr ) {
    return expr.toString();
  } else {
    return quoteIdentifier(expr);
  }
}

/**
 * http://phpjs.org/functions/substr_count/
 */
function substr_count(haystack, needle, offset, length) {
  var cnt = 0;

  haystack += '';
  needle += '';
  if (isNaN(offset)) {
    offset = 0;
  }
  if (isNaN(length)) {
    length = 0;
  }
  offset--;

  while ((offset = haystack.indexOf(needle, offset + 1)) != -1) {
    if (length > 0 && (offset + needle.length) > length) {
      return false;
    }
    cnt++;
  }

  return cnt;
}



/**
 * Expr
 */
var Expr = module.exports.Expr = function(expr) {
  this.expr = expr;
}
module.exports.expr = function(expr) {
  return new Expr(expr);
}

Expr.prototype.toString = function() {
  return this.expr;
}



/**
 * Query
 */
function Query() {}
module.exports.Query = Query;

Query.prototype.mysql = function(mysql) {
  this._mysql = mysql;
  return this;
}

Query.prototype.table = function(table, columns) {
  if( table instanceof Expr ) {
    this._table = table;
  } else {
    this._table = String(table);
  }
  if( columns ) {
    this.columns(columns);
  }
  return this;
}
Query.prototype.from = Query.prototype.table;

Query.prototype.params = function() {
  if( this._params && this._params.length ) {
    return this._params;
  } else {
    return undefined;
  }
}

Query.prototype.all = function(callback) {
  var arr = [this.toString()];
  if( this._params && this._params.length ) {
    arr.push(this._params);
  }
  if( callback ) {
    arr.push(callback);
  }
  return arr;
}

Query.prototype.execute = function(callback) {
  if( !this._mysql ) {
    callback(new Error('No mysql object provided'), null);
  } else {
    this._mysql.execute.apply(this._mysql, this.all(callback));
  }
  return this;
}

Query.prototype._push = function(str) {
  this._parts.push(str);
  return this;
}

Query.prototype._pushTable = function() {
  if( this._table instanceof Expr ) {
    this._parts.push(this._table);
  } else {
    this._parts.push(quoteIdentifier(this._table));
  }
  return this;
}



/**
 * ExtendedQuery
 */
function ExtendedQuery() {}
module.exports.ExtendedQuery = ExtendedQuery;
ExtendedQuery.prototype = new Query;

ExtendedQuery.prototype.where = function(where, val) {
  if( arguments.length >= 2 || where instanceof Expr ) {
    this._where.push([where, val]);
  } else if( arguments.length >= 1 ) {
    this._where.push([where]);
  }
  return this;
}

ExtendedQuery.prototype.whereIn = function(where, val) {
  if( !(val instanceof Array) ) {
    val = new Array(val);
  }
  if( val.length <= 0 ) {
    this._where.push([new Expr('FALSE')]);
  } else {
    this._where.push([where, val, 'IN']);
  }
  return this;
}

ExtendedQuery.prototype.whereExpr = function(where) {
  this._where.push([new Expr(String(where))]);
  return this;
}

ExtendedQuery.prototype.group = function(cols) {
  this._group = cols;
  return this;
}

ExtendedQuery.prototype.order = function(order, direction) {
  this._order = order;
  this._direction = direction;
  return this;
}

ExtendedQuery.prototype.limit = function(limit, offset) {
  this._limit = parseInt(limit);
  if( typeof(offset) != 'undefined' ) {
    this._offset = offset;
  }
  return this;
}

ExtendedQuery.prototype.offset = function(offset, limit) {
  this._offset = parseInt(offset);
  if( typeof(limit) != 'undefined' ) {
    this._limit = parseInt(limit);
  }
  return this;
}

ExtendedQuery.prototype._pushWhere = function() {
  if( this._where.length <= 0 ) {
    return this;
  }
  this._parts.push('WHERE');
  this._where.forEach(function(w) {
    var where = w[0];
    var val = w[1];
    if( where instanceof Expr ) {
      this._parts.push(String(where));
    } else if( w.length == 1 ) {
      this._parts.push(quoteIdentifier(where));
    } else if( w.length == 3 ) {
      //if( w[2] == 'IN' ) {
        this._parts.push(quoteIdentifier(where));
        this._parts.push(w[2]);
        var tmp = '';
        for( var i = 0; i < w[1].length; i++ ) {
          tmp += '?, ';
        }
        this._parts.push('(' + tmp.substring(0, tmp.length - 2) + ')');
        w[1].forEach(function(v) {
          this._params.push(v);
        }.bind(this));
      //}
    } else {
      var cnt = substr_count(where, '?');
      
      // Push where
      if( cnt <= 0 ) {
        this._parts.push(quoteIdentifier(where));
        this._parts.push('=');
        this._parts.push('?');
        this._params.push(val);
      } else {
        this._parts.push(where);
        this._params.push(val);
      }
    }
    this._parts.push('&&');
  }.bind(this));
  this._parts.pop();
  return this;
}

ExtendedQuery.prototype._pushGroup = function() {
  if( this._group ) {
    this._parts.push('GROUP BY');
    this._parts.push(quoteIdentifier(this._group));
  }
  return this;
}

ExtendedQuery.prototype._pushOrder = function() {
  if( this._order ) {
    this._parts.push('ORDER BY');
    this._parts.push(qexpr(this._order));
    this._parts.push(this._direction == 'DESC' ? 'DESC' : 'ASC');
  }
  return this;
}

ExtendedQuery.prototype._pushLimit = function() {
  if( null !== this._limit ) {
    if( null !== this._offset ) {
      this._parts.push('LIMIT ?, ?');
      this._params.push(this._offset);
      this._params.push(this._limit);
    } else {
      this._parts.push('LIMIT ?');
      this._params.push(this._limit);
    }
  }
  return this;
}



/**
 * Select
 */
function Select(mysql) {
  this._mysql = mysql;
  this._table = null;
  this._columns = null;
  this._where = [];
  this._group = null;
  this._limit = null;
  this._offset = null;
  this._order = null;
  this._direction = null;
  
  this._parts = [];
  this._params = [];
}
Select.prototype = new ExtendedQuery;
module.exports.Select = Select;
module.exports.select = function(mysql) {
  return new Select(mysql);
}

Select.prototype.columns = function(columns) {
  if( columns && (columns instanceof Array || 
      columns instanceof Expr || 
      typeof(columns) == 'string') ) {
    this._columns = columns;
  } else {
    throw new Error('Invalid columns spec');
  }
  return this;
}

Select.prototype.hint = function(columns, mode) {
  this._hint = columns;
  this._hintMode = mode;
  return this;
}

Select.prototype.distinct = function(distinct) {
  if( arguments.length == 0 ) {
    distinct = true;
  }
  this._distinct = Boolean(distinct);
  return this;
}

Select.prototype._pushDistinct = function() {
  if( this._distinct ) {
    this._parts.push('DISTINCT');
  }
  return this;
}

Select.prototype._pushColumns = function() {
  if( !this._columns ) {
    this._parts.push('*');
  } else if( this._columns instanceof Array ) {
    var cols = [];
    this._columns.forEach(function(col) {
      cols.push(qexpr(col));
    });
    this._parts.push(cols.join(', '));
  } else if( typeof(this._columns) == 'string' ) {
    this._parts.push(quoteIdentifier(this._columns));
  } else if( this._columns instanceof Expr ) {
    this._parts.push(this._columns.toString());
  } else {
    throw Error('Invalid column spec');
  }
  return this;
}

Select.prototype._pushHint = function() {
  if( this._hint ) {
    this._parts.push(this._hintMode || 'USE');
    this._parts.push('INDEX');
    this._parts.push('(' + quoteIdentifier(this._hint) + ')');
  }
  return this;
}

Select.prototype.toString = function() {
  this._parts = [];
  this._params = [];
  
  // Check table
  if( !this._table ) {
    throw Error('No table set in select object');
  }
  
  this._push('SELECT')
      ._pushDistinct()
      ._pushColumns()
      ._push('FROM')
      ._pushTable()
      ._pushHint()
      ._pushWhere()
      ._pushGroup()
      ._pushOrder()
      ._pushLimit();
  
  return this._parts.join(' ');
}

Select.prototype.get_one = function(callback) {
  if( !this._mysql ) {
    callback(new Error('No mysql object provided'), null);
  } else {
    this._mysql.get_one.apply(this._mysql, this.all(callback));
  }
  return this;
}
Select.prototype.getOne = Select.prototype.get_one;
Select.prototype.fetchRow = Select.prototype.get_one;

Select.prototype.get_all = function(callback) {
  if( !this._mysql ) {
    callback(new Error('No mysql object provided'), null);
  } else {
    this._mysql.get_all.apply(this._mysql, this.all(callback));
  }
  return this;
}
Select.prototype.getAll = Select.prototype.get_all;
Select.prototype.fetchAll = Select.prototype.get_all;

Select.prototype.get_column = function(callback) {
  if( !this._mysql ) {
    callback(new Error('No mysql object provided'), null);
  } else {
    this.get_one(function(err, result) {
      if( err ) {
        callback(err, result);
      } else {
        callback(err, result[Object.keys(result)[0]]);
      }
    })
  }
  return this;
}
Select.prototype.getColumn = Select.prototype.get_column;
Select.prototype.fetchColumn = Select.prototype.get_column;




/**
 * Insert
 */
function Insert(mysql) {
  this._mysql = mysql;
  this._table = null;
  this._values = {};
  this._parts = [];
  this._params = [];
}
Insert.prototype = new Query;
module.exports.Insert = Insert;
module.exports.insert = function(mysql) {
  return new Insert(mysql);
}

Insert.prototype.into = Insert.prototype.table;

Insert.prototype.values = function(values) {
  this._values = values;
  return this;
}

Insert.prototype.toString = function() {
  var keys = [];
  var vals = [];
  var params = [];
  
  Object.keys(this._values).forEach(function(key) {
    if( Object.prototype.hasOwnProperty.call(this._values, key) ) {
      var val = this._values[key];
      keys.push(quoteIdentifier(key));
      if( val instanceof Expr ) {
        vals.push(val.toString());
      } else {
        vals.push('?');
        params.push(val);
      }
    }
  }.bind(this));
  
  this._params = params;
  
  return 'INSERT INTO ' + qexpr(this._table) + ' ('
    + keys.join(', ')
    + ') VALUES ('
    + vals.join(', ')
    + ')';
}



/**
 * Delete
 */
function Delete(mysql) {
  this._mysql = mysql;
  this._table = null;
  this._where = [];
  this._limit = null;
  this._offset = null;
  this._order = null;
  this._direction = null;
  this._parts = [];
  this._params = [];
}
Delete.prototype = new ExtendedQuery;
module.exports.Delete = Delete;
module.exports.del = function(mysql) {
  return new Delete(mysql);
}
module.exports['delete'] = module.exports.del;

Delete.prototype.toString = function() {
  this._parts = [];
  this._params = [];
  
  // Check table
  if( !this._table ) {
    throw Error('No table set in select object');
  }
  
  this._push('DELETE')
      ._push('FROM')
      ._pushTable()
      ._pushWhere()
      ._pushOrder()
      ._pushLimit();
  
  return this._parts.join(' ');
}



/**
 * Update
 */
function Update(mysql) {
  this._mysql = mysql;
  this._table = null;
  this._values = {};
  this._where = [];
  this._limit = null;
  this._offset = null;
  this._order = null;
  this._direction = null;
  this._parts = [];
  this._params = [];
}
Update.prototype = new ExtendedQuery;
module.exports.Update = Update;
module.exports.update = function(mysql) {
  return new Update(mysql);
}

Update.prototype.values = function(values) {
  this._values = values;
  return this;
}
Update.prototype.value = function(key, value) {
  this._values[key] = value;
  return this;
}

Update.prototype._pushValues = function() {
  Object.keys(this._values).forEach(function(key) {
    if( Object.prototype.hasOwnProperty.call(this._values, key) ) {
      var val = this._values[key];
      this._parts.push(qexpr(key));
      this._parts.push('=');
      if( val instanceof Expr ) {
        this._parts.push(val.toString());
      } else {
        this._parts.push('?');
        this._params.push(val);
      }
    }
    this._parts.push(',');
  }.bind(this));
  this._parts.pop();
  return this;
}

Update.prototype.toString = function() {
  this._parts = [];
  this._params = [];
  
  // Check table
  if( !this._table ) {
    throw Error('No table set in object');
  } else if( Object.keys(this._values).length <= 0 ) {
    throw Error('No values set in object');
  }
  
  this._push('UPDATE')
      ._pushTable()
      ._push('SET')
      ._pushValues()
      ._pushWhere()
      ._pushOrder()
      ._pushLimit();
  
  return this._parts.join(' ');
}
