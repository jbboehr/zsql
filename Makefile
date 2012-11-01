
REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER)

test-cov: lib-cov
	@COVERAGE=1 $(MAKE) test REPORTER=html-cov | grep -v "Entering directory" > coverage.html

lib-cov:
	@mkdir -p tmp && \
	mkdir -p cov && \
	cp -f zsql.js tmp/zsql.js && \
	jscoverage tmp cov && \
	cat cov/zsql.js > zsql-cov.js && \
	rm -f cov/zsql.js && \
	rm -f tmp/zsql.js && \
	rmdir tmp && \
	rmdir cov

.PHONY: test
