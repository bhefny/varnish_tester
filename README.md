
# Purpose

A script to help test varnish output against it's own VCL

## full test

should produce a one by one pass or fail for each asynchronous test

```
node varnish_tester
```

## debugging

will run only one test and disply request and response headers

```
node varnish_tester 16
```
