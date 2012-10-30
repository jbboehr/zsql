zsql
====

SQL generator for node.js modeled after Zend_Db_Select. Intended for use with
[easy-mysql](https://github.com/Mog-Inc/easy-mysql)


Overview
--------

The query generation is separated into two parts: query and params. You can 
access the string query and params array for all objects using 
`Query.toString()` and `Query.params()`

The `Query.all()` function returns an array of the query and parameters, and 
optionally a callback. Typically you would use easy-mysql like so:

```javascript
zsql.select(easyMySQL)
    .from('tableName')
    .where('columnName', 'value')
    .limit(100)
    .getAll(function(err, results) {
      if( err ) throw err;
      doSomething(results);
    });
```

The getAll/getOne/execute functions are just proxies for easy-mysql:

```javascript
this._mysql.execute.apply(this._mysql, this.all(callback));
```

Below is provided various examples and the resultant SQL and parameters that
would be passed into easy-mysql.


Examples
--------

### Select

```javascript
zsql.select()
    .from('tableName')
    .where('columnName', 1)
    .where('columnName2 > ?', 2)
    .whereIn('columnName3', [3, 4])
    .order('columnName4', 'ASC')
    .limit(5)
    .offset(20)
    .all();
```

```javascript
[ 'SELECT * FROM `tableName` WHERE `columnName` = ? && columnName2 > ? && `columnName3` IN (?, ?) ORDER BY `columnName4` ASC LIMIT ?, ?',
  [ 1,
    2,
    3,
    4,
    20,
    5 ] ]
```


### Insert

```javascript
zsql.insert()
    .into('tableName')
    .value('columnName', 1)
    .value('columnName2', zsql.expr('NOW()'))
    .all();
```

```javascript
[ 'INSERT INTO `tableName` (`columnName`, `columnName2`) VALUES (?, NOW())',
  [ 1 ] ]
```


### Delete 

```javascript
zsql.del()
    .from('tableName')
    .where('columnName', 112358)
    .limit(1)
    .all();
```

```javascript
[ 'DELETE FROM `tableName` WHERE `columnName` = ? LIMIT ?',
  [ 112358, 1 ] ]
```


### Update

```javascript
zsql.update()
    .table('tableName')
    .set('columnName1', 3.14)
    .set('columnName2', zsql.expr('columnName2 + 1'))
    .set('columnName3', 'value')
    .where('columnName4', 159)
    .limit(2)
    .all();
```

```javascript
[ 'UPDATE `tableName` SET `columnName1` = ? , `columnName2` = columnName2 + 1 , `columnName3` = ? WHERE `columnName4` = ? LIMIT ?',
  [ 3.14, 'value', 159, 2 ] ]
```


Todo
----

* escape/interpolate support
* node-mysql support

