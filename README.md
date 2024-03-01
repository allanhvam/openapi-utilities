# openapi-utilities

Small collection of openapi utility functions.

```
Usage: openapi-utilities [options] <input>

path/url to OpenAPI/Swagger document as json/yaml

Options:
  -V, --version                output the version number
  -o, --output <path>          output path (default: "ApiSpecification.yaml")
  --fix-additional-properties  sets additionalProperties to false if undefined (default: false)
  --fix-nullable-required      remove nullable from properties, but set as required (default: false)
  -h, --help                   display help for command
  ```
